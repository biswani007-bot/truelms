const fs = require('fs');
const path = require('path');

const OLD_FILE = path.join(__dirname, '../docs/postman/TrueLern-Mobile-API.postman_collection.json');
const NEW_FILE = path.join(__dirname, '../docs/postman/TrueLern-Complete-API.postman_collection.json');

if (!fs.existsSync(OLD_FILE)) {
  console.log('No old file found.');
  process.exit(0);
}

const oldData = JSON.parse(fs.readFileSync(OLD_FILE, 'utf-8'));
const newData = JSON.parse(fs.readFileSync(NEW_FILE, 'utf-8'));

// Build a map of old requests
const oldRequests = new Map();

function extractRequests(items, map) {
  if (!items) return;
  for (const item of items) {
    if (item.item) {
      extractRequests(item.item, map);
    } else if (item.request) {
      const url = typeof item.request.url === 'string' ? item.request.url : (item.request.url.raw || '');
      const method = item.request.method;
      // normalize url by removing baseUrl
      let normalizedUrl = url.replace('{{baseUrl}}', '').replace('http://localhost:3000', '').split('?')[0];
      const key = `${method} ${normalizedUrl}`;
      map.set(key, item);
    }
  }
}

extractRequests(oldData.item, oldRequests);

let mergedCount = 0;

function mergeRequests(items) {
  if (!items) return;
  for (const item of items) {
    if (item.item) {
      mergeRequests(item.item);
    } else if (item.request) {
      const url = typeof item.request.url === 'string' ? item.request.url : (item.request.url.raw || '');
      const method = item.request.method;
      let normalizedUrl = url.replace('{{baseUrl}}', '').split('?')[0];
      const key = `${method} ${normalizedUrl}`;
      
      const oldItem = oldRequests.get(key);
      if (oldItem) {
        // Merge description
        if (oldItem.request.description) {
           item.request.description = (item.request.description ? item.request.description + '\n\n' : '') + oldItem.request.description;
        }
        
        // Merge body
        if (oldItem.request.body && (!item.request.body || item.request.body.raw === '{\n  \n}')) {
           item.request.body = oldItem.request.body;
        }
        
        // Merge responses
        if (oldItem.response && oldItem.response.length > 0) {
           item.response = oldItem.response;
        }
        
        // Merge headers
        if (oldItem.request.header && oldItem.request.header.length > 0) {
           const existingKeys = new Set((item.request.header || []).map(h => h.key.toLowerCase()));
           for (const h of oldItem.request.header) {
             if (!existingKeys.has(h.key.toLowerCase())) {
               if(!item.request.header) item.request.header = [];
               item.request.header.push(h);
             }
           }
        }
        
        mergedCount++;
      }
    }
  }
}

mergeRequests(newData.item);

fs.writeFileSync(NEW_FILE, JSON.stringify(newData, null, 2));

console.log('Merged', mergedCount, 'requests from old collection.');
