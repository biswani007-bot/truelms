const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from project root
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Explicitly enforce port 3030 (overriding any PORT=3000 in .env)
process.env.PORT = '3030';
process.env.HOSTNAME = '127.0.0.1';

console.log(`Starting TrueLern standalone server on http://${process.env.HOSTNAME}:${process.env.PORT}...`);
console.log(`MongoDB URI: ${process.env.MONGODB_URI}`);

require('../.next/standalone/server.js');
