$ErrorActionPreference = "Stop"

$src = "E:\Lmsca\lmsca"
$timestamp = Get-Date -Format "yyyyMMdd_HHmm"
$deployDirName = "TrueLern_LMS_AAPanel_Deploy_$timestamp"
$dest = "E:\Lmsca\$deployDirName"
$zipPath = "E:\Lmsca\$deployDirName.zip"

Write-Host "Creating deployment directory at $dest..."
if (Test-Path $dest) { Remove-Item -Recurse -Force $dest }
New-Item -ItemType Directory -Path $dest | Out-Null

# List of items to include
$includes = @(
    "app", "components", "lib", "services", "hooks", "utils", "public", 
    "scripts", "types", "constants", "dtos", "helpers", "models", 
    "repositories", "config", "docker", "docs",
    "package.json", "package-lock.json", "tsconfig.json", 
    "next.config.ts", "proxy.ts", "postcss.config.mjs", "eslint.config.mjs",
    "components.json", "middleware", ".env.example"
)

foreach ($item in $includes) {
    $itemPath = Join-Path $src $item
    if (Test-Path $itemPath) {
        Write-Host "Copying $item..."
        Copy-Item -Path $itemPath -Destination (Join-Path $dest $item) -Recurse -Force
    } else {
        Write-Host "Skipping $item (Not Found)"
    }
}

# Handle public/uploads (empty it and put .gitkeep)
$publicUploads = Join-Path $dest "public\uploads"
if (Test-Path $publicUploads) {
    Remove-Item -Recurse -Force "$publicUploads\*"
    New-Item -ItemType File -Path "$publicUploads\.gitkeep" | Out-Null
}

# Handle storage (empty it and put .gitkeep)
$storageDir = Join-Path $dest "storage"
if (!(Test-Path $storageDir)) {
    New-Item -ItemType Directory -Path $storageDir | Out-Null
} else {
    Remove-Item -Recurse -Force "$storageDir\*"
}
New-Item -ItemType File -Path "$storageDir\.gitkeep" | Out-Null

# Create DEPLOYMENT_AAPANEL.md
$deploymentMdPath = Join-Path $dest "DEPLOYMENT_AAPANEL.md"
$deploymentMdContent = @"
# PROJECT
- TrueLern LMS / LMSCA

# DEPLOYMENT MODEL
- Next.js
- Node.js
- npm
- aaPanel

# BUILD
- Build command: npm ci && npm run build
- Start command: npm start (or next start, usually configured via aaPanel as Node project start command `npm start`)

# NODE
- Required Node version: >= 18.x (based on Next.js 14/15 requirements and package.json)

# PORT
- Expected application port: 3000
- aaPanel should map the domain to the Node.js project running on port 3000.

# ENVIRONMENT
Required environment variables (NAMES ONLY, configure these securely in aaPanel):
- NODE_ENV
- PORT
- NEXT_PUBLIC_APP_URL
- NEXT_PUBLIC_APP_VERSION
- MONGODB_URI
- JWT_SECRET
- JWT_REFRESH_SECRET
- CRON_SECRET
- PUBLIC_WEB_ORIGINS
- JITSI_APP_ID
- JITSI_APP_SECRET
- JITSI_DOMAIN
- JITSI_SERVER_URL
- RECORDINGS_STORAGE_PATH
- BREVO_API_KEY
- BREVO_FROM_EMAIL
- BREVO_FROM_NAME

# DEPLOYMENT STEPS
1. Upload ZIP to aaPanel.
2. Extract the ZIP in your desired web root directory.
3. Enter the project root (`$deployDirName`).
4. Configure production environment variables in the aaPanel Node project settings or a `.env` file.
5. Run `npm ci` to install dependencies cleanly.
6. Run `npm run build` to compile the Next.js application.
7. Start/restart the application using the aaPanel Node.js process manager (`npm start`).
8. Configure aaPanel reverse proxy/domain to point to the running Node.js port (e.g., 3000).
9. Verify HTTPS production URL.

# ROLLBACK
- Before deploying, keep a backup of the previous deployment directory.
- Stop the current Node process.
- Restore the previous release directory.
- Restart the Node process.

# HEALTH CHECK
- Production URL: Request the base domain (e.g., `https://TrueLern.visital.in`).
- Expected HTTP response: 200 OK or 30x Redirect to login if unauthenticated.
"@
Set-Content -Path $deploymentMdPath -Value $deploymentMdContent

Write-Host "Creating ZIP archive..."
if (Test-Path $zipPath) { Remove-Item -Force $zipPath }
Compress-Archive -Path "$dest\*" -DestinationPath $zipPath

Write-Host "Calculating Checksum..."
$checksum = (Get-FileHash -Path $zipPath -Algorithm SHA256).Hash
$checksumPath = Join-Path $src "DEPLOYMENT_CHECKSUMS.txt"
"SHA256: $checksum $deployDirName.zip" | Set-Content -Path $checksumPath

Write-Host "Done!"
Write-Host "ZIP Path: $zipPath"
Write-Host "Checksum Path: $checksumPath"
