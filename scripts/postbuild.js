const fs = require('fs');
const path = require('path');

function copyRecursiveSync(src, dest) {
  if (fs.existsSync(src)) {
    const stats = fs.statSync(src);
    if (stats.isDirectory()) {
      if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
      }
      fs.readdirSync(src).forEach((childItemName) => {
        copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
      });
    } else {
      fs.copyFileSync(src, dest);
    }
  }
}

const standalonePath = path.join(__dirname, '..', '.next', 'standalone');
const publicSrc = path.join(__dirname, '..', 'public');
const publicDest = path.join(standalonePath, 'public');
const staticSrc = path.join(__dirname, '..', '.next', 'static');
const staticDest = path.join(standalonePath, '.next', 'static');

console.log('Running postbuild: copying static assets to standalone folder...');
copyRecursiveSync(publicSrc, publicDest);
copyRecursiveSync(staticSrc, staticDest);
console.log('Postbuild complete.');
