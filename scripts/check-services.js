const http = require('http');
const mongoose = require('mongoose');

async function check() {
  console.log('--- CHECKING MONGODB ---');
  try {
    await mongoose.connect('mongodb://localhost:27017/lmsca', { serverSelectionTimeoutMS: 3000 });
    console.log('MongoDB: CONNECTED (host: ' + mongoose.connection.host + ')');
    await mongoose.disconnect();
  } catch (e) {
    console.log('MongoDB: ERROR -', e.message);
  }

  console.log('\n--- CHECKING NEXT.JS SERVER (http://localhost:3030) ---');
  const req = http.get('http://localhost:3030/api/auth/me', (res) => {
    console.log('Next.js server responded: HTTP', res.statusCode);
    process.exit(0);
  });
  req.on('error', (err) => {
    console.log('Next.js server error:', err.message);
    process.exit(0);
  });
  req.setTimeout(3000, () => {
    console.log('Next.js server request TIMEOUT');
    req.destroy();
    process.exit(0);
  });
}

check();
