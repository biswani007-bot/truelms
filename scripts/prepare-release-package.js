const fs = require('fs');
const path = require('path');
const archiver = require('archiver'); // or custom zip implementation

// Let's create a release preparation script using native Node.js / AdmZip or PowerShell Compress-Archive
const sourceDir = path.resolve(__dirname, '..');
const releaseDirName = 'TrueLern-production';
const releasePath = path.join(sourceDir, releaseDirName);

// Excluded directories and files
const EXCLUDES = [
  'node_modules',
  '.next',
  '.git',
  '.env',
  '.env.local',
  '.env.production',
  'scratch',
  'temp_educa',
  'TrueLern-production',
  'storage/recordings'
];

console.log('Source:', sourceDir);
console.log('Release Directory:', releasePath);
