const { execSync } = require('child_process');
const fs = require('fs');

console.log('Running tsc --noEmit...');
try {
  const stdout = execSync('node ./node_modules/typescript/bin/tsc --noEmit', {
    cwd: process.cwd(),
    encoding: 'utf8',
    timeout: 120000,
  });
  console.log('TSC SUCCESS (exit 0)');
  fs.writeFileSync('tsc-result.txt', 'TSC SUCCESS (exit 0)\n' + (stdout || 'No errors.'));
} catch (err) {
  console.error('TSC FAILED (exit ' + err.status + ')');
  console.error(err.stdout || err.message);
  fs.writeFileSync('tsc-result.txt', 'TSC FAILED:\n' + (err.stdout || err.message));
}
