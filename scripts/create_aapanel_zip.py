import os
import sys
import zipfile
import hashlib
from datetime import datetime

def main():
    root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    parent_dir = os.path.abspath(os.path.join(root_dir, '..'))
    
    timestamp = datetime.now().strftime('%Y%m%d_%H%M')
    base_folder_name = f"TrueLern_LMS_AAPanel_Deploy_{timestamp}"
    zip_file_name = f"{base_folder_name}.zip"
    zip_file_path = os.path.join(parent_dir, zip_file_name)
    
    print(f"Creating deployment ZIP: {zip_file_path}")
    
    # Deployment documentation content
    deployment_guide = f"""# PROJECT
- TrueLern LMS / LMSCA

# DEPLOYMENT MODEL
- Next.js (Version 16.3.5 / React 19.2.4)
- Node.js (Version 20+ LTS recommended)
- npm
- aaPanel (Node.js Project Manager / PM2)

# BUILD & RUN COMMANDS
- Build command: npm ci && npm run build
- Start command: npm start (or next start, port 3000)

# NODE VERSION
- Node.js 20.x or 22.x LTS (compatible with React 19 / Next.js 16)

# PORT
- Port: 3000 (configurable via PORT environment variable)
- aaPanel: Node project runs on port 3000; domain reverse proxy routes 80/443 -> 127.0.0.1:3000.

# ENVIRONMENT
Configure these environment variables in aaPanel Node project settings or in a secure production .env:
- NODE_ENV=production
- PORT=3000
- NEXT_PUBLIC_APP_URL=https://<your-domain>
- NEXT_PUBLIC_APP_VERSION=1.0.0
- MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/lmsca?retryWrites=true&w=majority
- JWT_SECRET=<high-entropy-64-char-secret>
- JWT_REFRESH_SECRET=<high-entropy-64-char-secret>
- CRON_SECRET=<high-entropy-secret>
- PUBLIC_WEB_ORIGINS=https://<your-domain>
- JITSI_APP_ID=truelern-lms
- JITSI_APP_SECRET=<jitsi-jwt-secret>
- JITSI_DOMAIN=<jitsi-domain>
- JITSI_SERVER_URL=https://<jitsi-domain>
- RECORDINGS_STORAGE_PATH=/www/wwwroot/<jitsi-domain>/recordings
- BREVO_API_KEY=<brevo-api-key>
- BREVO_FROM_EMAIL=<verified-sender-email>
- BREVO_FROM_NAME="TrueLern"

# DEPLOYMENT STEPS
1. Upload `{zip_file_name}` to aaPanel (e.g., `/www/wwwroot/`).
2. Extract the archive.
3. Enter the project root directory (`{base_folder_name}`).
4. In aaPanel Node.js Project Manager:
   - Node Version: Select Node 20.x+
   - Run Opt: npm
   - Run Command: start
   - Port: 3000
5. Set the required production environment variables.
6. Run the build in terminal or aaPanel execution panel:
   npm ci
   npm run build
7. Start/restart the Node application service.
8. Configure aaPanel Reverse Proxy for the domain (target: `http://127.0.0.1:3000`).
9. Enable SSL certificate (Let's Encrypt / custom cert).
10. Verify HTTPS production URL.

# ROLLBACK
- Keep a backup of the previous release directory (e.g. `/www/wwwroot/truelern_previous`).
- If issues occur, switch the aaPanel Node project path back to the previous release folder.
- Restart the Node application service in aaPanel.

# HEALTH CHECK
- Health URL: https://<your-domain>/ or https://<your-domain>/api/public/lead
- Expected response: HTTP 200 OK.
"""

    include_dirs = [
        'app',
        'components',
        'lib',
        'services',
        'hooks',
        'utils',
        'types',
        'constants',
        'dtos',
        'helpers',
        'models',
        'repositories',
        'config',
        'docker',
        'docs',
        'middleware',
        'scripts'
    ]

    include_files = [
        'package.json',
        'package-lock.json',
        'tsconfig.json',
        'next.config.ts',
        'proxy.ts',
        'postcss.config.mjs',
        'eslint.config.mjs',
        'components.json',
        '.env.example'
    ]

    # Exclusions
    exclude_patterns = [
        '.git',
        '.next',
        'node_modules',
        '.env',
        'scratch',
        '.tempmediaStorage',
        '.system_generated',
        '.user_uploaded',
        'brain',
        'temp_educa',
        'temp_truelern',
        '.DS_Store',
        'Thumbs.db'
    ]

    file_count = 0

    with zipfile.ZipFile(zip_file_path, 'w', zipfile.ZIP_DEFLATED, compresslevel=6) as zipf:
        # 1. Add top-level individual files under base_folder_name
        for fname in include_files:
            fpath = os.path.join(root_dir, fname)
            if os.path.exists(fpath):
                arcname = f"{base_folder_name}/{fname}"
                zipf.write(fpath, arcname)
                file_count += 1
                
        # 2. Add documentation inside zip
        zipf.writestr(f"{base_folder_name}/DEPLOYMENT_AAPANEL.md", deployment_guide)
        file_count += 1

        # 3. Add storage and public/uploads placeholder (.gitkeep)
        zipf.writestr(f"{base_folder_name}/storage/.gitkeep", "")
        zipf.writestr(f"{base_folder_name}/public/uploads/.gitkeep", "")
        file_count += 2

        # 4. Add public assets (excluding public/uploads content)
        public_dir = os.path.join(root_dir, 'public')
        if os.path.exists(public_dir):
            for root, dirs, files in os.walk(public_dir):
                # Don't recurse into uploads
                if 'uploads' in dirs:
                    dirs.remove('uploads')
                for file in files:
                    if file.startswith('.'):
                        continue
                    full_p = os.path.join(root, file)
                    rel_p = os.path.relpath(full_p, root_dir).replace('\\', '/')
                    arcname = f"{base_folder_name}/{rel_p}"
                    zipf.write(full_p, arcname)
                    file_count += 1

        # 5. Add directories
        for dname in include_dirs:
            dir_path = os.path.join(root_dir, dname)
            if not os.path.exists(dir_path):
                continue
            for root, dirs, files in os.walk(dir_path):
                # filter out excluded dirs
                dirs[:] = [d for d in dirs if not any(ex in d for ex in exclude_patterns)]
                for file in files:
                    if any(ex in file for ex in exclude_patterns):
                        continue
                    if file.endswith('.sock') or file.endswith('.zip') or file.endswith('.tar.gz') or file.endswith('.log'):
                        continue
                    full_p = os.path.join(root, file)
                    if not os.path.isfile(full_p):
                        continue
                    rel_p = os.path.relpath(full_p, root_dir).replace('\\', '/')
                    arcname = f"{base_folder_name}/{rel_p}"
                    try:
                        zipf.write(full_p, arcname)
                        file_count += 1
                    except Exception as e:
                        print(f"Skipping non-readable file {full_p}: {e}")

    # Calculate SHA256
    sha256_hash = hashlib.sha256()
    with open(zip_file_path, "rb") as f:
        for byte_block in iter(lambda: f.read(65536), b""):
            sha256_hash.update(byte_block)
    checksum = sha256_hash.hexdigest()

    # Write checksum file
    checksum_file_path = os.path.join(root_dir, "DEPLOYMENT_CHECKSUMS.txt")
    with open(checksum_file_path, "w", encoding="utf-8") as f:
        f.write(f"SHA256: {checksum}  {zip_file_name}\n")

    # Also save DEPLOYMENT_AAPANEL.md to root
    with open(os.path.join(root_dir, "DEPLOYMENT_AAPANEL.md"), "w", encoding="utf-8") as f:
        f.write(deployment_guide)

    file_size_bytes = os.path.getsize(zip_file_path)
    file_size_mb = file_size_bytes / (1024 * 1024)

    print("\n================== PACKAGING REPORT ==================")
    print(f"ZIP Path:          {zip_file_path}")
    print(f"ZIP Size:          {file_size_mb:.2f} MB ({file_size_bytes:,} bytes)")
    print(f"Total Files:       {file_count}")
    print(f"SHA-256 Checksum:  {checksum}")
    print(f"Checksum File:     {checksum_file_path}")
    print(f"Deployment Guide:  {os.path.join(root_dir, 'DEPLOYMENT_AAPANEL.md')}")
    print("======================================================")

if __name__ == '__main__':
    main()
