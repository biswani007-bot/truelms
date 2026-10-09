const { spawn } = require('child_process');

console.log("Starting tsc with tsconfig.json...");
const child = spawn('node', ['./node_modules/typescript/bin/tsc', '-p', 'tsconfig.json', '--noEmit'], {
  stdio: 'inherit'
});

child.on('close', (code) => {
  console.log(`TSC finished with exit code: ${code}`);
  process.exit(code || 0);
});
