const http = require('http');
const mongoose = require('mongoose');

async function checkHealth() {
  console.log("=== CHECKING BASELINE SERVICES ===");

  // 1. Check MongoDB
  try {
    await mongoose.connect('mongodb://localhost:27017/lmsca', { serverSelectionTimeoutMS: 3000 });
    console.log("✅ MongoDB connected successfully at mongodb://localhost:27017/lmsca");
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`   Collections present: ${collections.length}`);
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
  }

  // 2. Check Next.js server on port 3030
  const req = http.get('http://localhost:3030/api/public/courses', (res) => {
    console.log(`✅ Next.js server responding on http://localhost:3030 (Status: ${res.statusCode})`);
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      try {
        const json = JSON.parse(data);
        console.log(`   Public courses endpoint returned ${json.data ? json.data.length : 'valid'} courses`);
      } catch (e) {
        console.log(`   Raw response length: ${data.length}`);
      }
      process.exit(0);
    });
  });

  req.on('error', (err) => {
    console.error("❌ Next.js server request error on port 3030:", err.message);
    process.exit(1);
  });
}

checkHealth();
