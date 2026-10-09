const { spawn } = require('child_process');
const fs = require('fs');

console.log("Starting Next.js production build (next build --webpack)...");
const child = spawn('npm', ['run', 'build'], {
  stdio: 'inherit',
  shell: true
});

child.on('close', (code) => {
  console.log(`Build finished with exit code: ${code}`);
  fs.writeFileSync('build-result.txt', `BUILD_EXIT_CODE: ${code}\n`);
  process.exit(code || 0);
});
