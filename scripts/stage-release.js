const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const targetDir = path.join(rootDir, 'TrueLern-production');

const INCLUDED_DIRS = [
  'app',
  'components',
  'config',
  'constants',
  'docs',
  'dtos',
  'helpers',
  'lib',
  'middleware',
  'models',
  'public',
  'repositories',
  'scripts',
  'services',
  'types',
  'utils'
];

const INCLUDED_FILES = [
  '.env.example',
  '.gitignore',
  'Dockerfile',
  'docker-compose.yml',
  'next-env.d.ts',
  'next.config.ts',
  'package.json',
  'package-lock.json',
  'postcss.config.mjs',
  'proxy.ts',
  'tsconfig.json',
  'README.md',
  'AGENTS.md'
];

function copyFolderRecursiveSync(source, target) {
  if (!fs.existsSync(target)) {
    fs.mkdirSync(target, { recursive: true });
  }

  const files = fs.readdirSync(source);
  files.forEach((file) => {
    const curSource = path.join(source, file);
    const curTarget = path.join(target, file);

    // Skip node_modules or .git or socket files
    if (file === 'node_modules' || file === '.git' || file === '.next' || file.endsWith('.sock')) return;

    try {
      const stat = fs.lstatSync(curSource);
      if (stat.isDirectory()) {
        copyFolderRecursiveSync(curSource, curTarget);
      } else if (stat.isFile()) {
        fs.copyFileSync(curSource, curTarget);
      }
    } catch (err) {
      console.warn(`  Warning: skipping unreadable item: ${curSource} (${err.message})`);
    }
  });
}

function prepareRelease() {
  console.log('[Release Staging] Preparing clean release directory:', targetDir);

  if (fs.existsSync(targetDir)) {
    fs.rmSync(targetDir, { recursive: true, force: true });
  }
  fs.mkdirSync(targetDir, { recursive: true });

  // Ensure storage/recordings placeholder directory exists
  fs.mkdirSync(path.join(targetDir, 'storage', 'recordings'), { recursive: true });
  fs.writeFileSync(path.join(targetDir, 'storage', 'recordings', '.gitkeep'), '');

  // Copy whitelisted directories
  for (const dir of INCLUDED_DIRS) {
    const src = path.join(rootDir, dir);
    const dest = path.join(targetDir, dir);
    if (fs.existsSync(src)) {
      console.log(`  Copying directory: ${dir}/`);
      copyFolderRecursiveSync(src, dest);
    }
  }

  // Copy docker directory selectively (docker-compose & base config, skipping prosody .sock runtime files)
  const dockerSrc = path.join(rootDir, 'docker');
  const dockerDest = path.join(targetDir, 'docker');
  if (fs.existsSync(dockerSrc)) {
    console.log('  Copying directory: docker/');
    copyFolderRecursiveSync(dockerSrc, dockerDest);
  }

  // Copy whitelisted files
  for (const file of INCLUDED_FILES) {
    const src = path.join(rootDir, file);
    const dest = path.join(targetDir, file);
    if (fs.existsSync(src)) {
      console.log(`  Copying file: ${file}`);
      fs.copyFileSync(src, dest);
    }
  }

  // Remove scripts/stage-release.js & scripts/prepare-release-package.js from release folder
  const unneededScripts = [
    path.join(targetDir, 'scripts', 'stage-release.js'),
    path.join(targetDir, 'scripts', 'prepare-release-package.js')
  ];
  unneededScripts.forEach(f => {
    if (fs.existsSync(f)) fs.unlinkSync(f);
  });

  console.log('[Release Staging] Clean staging directory ready at:', targetDir);
}

prepareRelease();
