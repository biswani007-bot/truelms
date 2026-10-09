const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const archiver = require('archiver');

async function main() {
  const rootDir = path.resolve(__dirname, '..');
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const yyyy = now.getFullYear();
  const mm = pad(now.getMonth() + 1);
  const dd = pad(now.getDate());
  const hh = pad(now.getHours());
  const min = pad(now.getMinutes());
  const timestamp = `${yyyy}${mm}${dd}_${hh}${min}`;
  const zipFileName = `TrueLern_LMS_AAPanel_Deploy_${timestamp}.zip`;
  const zipFilePath = path.join(path.resolve(rootDir, '..'), zipFileName);

  console.log(`Target ZIP file: ${zipFilePath}`);

  const output = fs.createWriteStream(zipFilePath);
  const archive = archiver('zip', {
    zlib: { level: 9 }
  });

  let fileCount = 0;
  archive.on('entry', () => {
    fileCount++;
  });

  const streamFinished = new Promise((resolve, reject) => {
    output.on('close', resolve);
    archive.on('error', reject);
  });

  archive.pipe(output);

  // Directories to include recursively
  const includeDirs = [
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
  ];

  for (const dir of includeDirs) {
    const fullPath = path.join(rootDir, dir);
    if (fs.existsSync(fullPath)) {
      archive.directory(fullPath, dir, (entry) => {
        // Exclude any unwanted files inside scripts or dirs
        if (entry.name.includes('.git') || entry.name.includes('.env')) return false;
        return entry;
      });
    }
  }

  // Handle public directory specifically: include all assets except user uploads
  const publicDir = path.join(rootDir, 'public');
  if (fs.existsSync(publicDir)) {
    archive.directory(publicDir, 'public', (entry) => {
      // Exclude uploaded files in public/uploads except .gitkeep
      if (entry.name.startsWith('public/uploads/') || entry.name.startsWith('public\\uploads\\')) {
        return false;
      }
      return entry;
    });
  }

  // Ensure public/uploads/.gitkeep and storage/.gitkeep are in the archive
  archive.append('', { name: 'public/uploads/.gitkeep' });
  archive.append('', { name: 'storage/.gitkeep' });

  // Root individual files
  const rootFiles = [
    'package.json',
    'package-lock.json',
    'tsconfig.json',
    'next.config.ts',
    'proxy.ts',
    'postcss.config.mjs',
    'eslint.config.mjs',
    'components.json',
    '.env.example'
  ];

  for (const file of rootFiles) {
    const fullPath = path.join(rootDir, file);
    if (fs.existsSync(fullPath)) {
      archive.file(fullPath, { name: file });
    }
  }

  // DEPLOYMENT_AAPANEL.md
  const deploymentGuide = `# PROJECT
- TrueLern LMS / LMSCA

# DEPLOYMENT MODEL
- Next.js (Version 16.3.5 / React 19.2.4)
- Node.js (Version 20+)
- npm
- aaPanel (Node.js Project Manager / PM2)

# BUILD
- Build command: npm ci && npm run build
- Start command: npm start (or next start, default port 3000)

# NODE
- Required Node version: Node.js 20.x or 22.x LTS (compatible with React 19 / Next.js 16)

# PORT
- Port: 3000 (configurable via PORT environment variable)
- aaPanel configuration: Add Node project, point run script to "npm start", map domain with reverse proxy to 127.0.0.1:3000.

# ENVIRONMENT
Configure the following environment variables in aaPanel Node project settings or in a secure production .env:
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
1. Upload ZIP to aaPanel web root (e.g., /www/wwwroot/).
2. Extract the ZIP into the target directory.
3. Enter the project root.
4. Set required environment variables in aaPanel or create production .env.
5. In aaPanel Node.js Project Manager:
   - Node Version: Select Node 20.x+
   - Run Opt: npm
   - Run Command: start
   - Port: 3000
6. Execute build in terminal or aaPanel:
   npm ci
   npm run build
7. Start or restart the Node project.
8. Configure domain reverse proxy in aaPanel (Proxy to http://127.0.0.1:3000).
9. Enable SSL certificate on the domain.
10. Verify production URL in browser.

# ROLLBACK
- Maintain previous release directory (e.g., /www/wwwroot/truelern_previous).
- If deployment fails, switch aaPanel Node project path back to previous release.
- Restart the Node service.

# HEALTH CHECK
- Health URL: https://<your-domain>/api/health or base domain https://<your-domain>/
- Expected response: HTTP 200 OK.
`;

  archive.append(deploymentGuide, { name: 'DEPLOYMENT_AAPANEL.md' });

  console.log('Finalizing archive...');
  await archive.finalize();
  await streamFinished;

  const stats = fs.statSync(zipFilePath);
  const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);

  // Compute SHA256
  const hash = crypto.createHash('sha256');
  const fileBuffer = fs.readFileSync(zipFilePath);
  hash.update(fileBuffer);
  const sha256 = hash.digest('hex');

  const checksumContent = `SHA256: ${sha256}  ${zipFileName}\n`;
  const checksumFilePath = path.join(rootDir, 'DEPLOYMENT_CHECKSUMS.txt');
  fs.writeFileSync(checksumFilePath, checksumContent);

  // Also write guide to repo root for reference
  fs.writeFileSync(path.join(rootDir, 'DEPLOYMENT_AAPANEL.md'), deploymentGuide);

  console.log('PACKAGE COMPLETED SUCCESSFULLY:');
  console.log(`ZIP Path: ${zipFilePath}`);
  console.log(`ZIP Size: ${stats.size} bytes (${sizeMB} MB)`);
  console.log(`Files count: ${fileCount}`);
  console.log(`SHA-256: ${sha256}`);
  console.log(`Checksum file: ${checksumFilePath}`);
}

main().catch(err => {
  console.error('Packaging error:', err);
  process.exit(1);
});
