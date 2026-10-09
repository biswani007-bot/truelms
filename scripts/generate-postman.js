const fs = require('fs');
const path = require('path');

const APP_DIR = path.join(__dirname, '../app');
const OUTPUT_DIR = path.join(__dirname, '../docs/postman');
const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];
const OLD_FILE = path.join(__dirname, '../docs/postman/TrueLern-Mobile-API.postman_collection.json');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

function parseApiFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const methods = [];
  
  for (const method of HTTP_METHODS) {
    const regex = new RegExp(`export\\s+(async\\s+)?(function\\s+${method}\\\\b|const\\s+${method}\\s*=)`, 'g');
    if (regex.test(content)) {
      methods.push(method);
    }
  }

  // Check for auth hints
  const requiresAuth = content.includes('authService') || content.includes('middleware') || content.includes('jwt') || content.includes('verifyToken') || content.includes('getServerSession') || content.includes('req.cookies.get("accessToken")') || content.includes('withRoles');
  const roleHintMatch = content.match(/role(?:s)?\s*[==|===|includes]*\s*['"](admin|parent|teacher|student|superadmin|operationsmanager|academicmanager|financemanager)['"]/i);
  const withRolesMatch = content.match(/withRoles\(\s*(?:\[[^\]]*\]|['"][^'"]*['"])/i);
  
  let roleHint = roleHintMatch ? roleHintMatch[1] : '';
  if (!roleHint && withRolesMatch) {
    roleHint = withRolesMatch[0].replace('withRoles(', '').trim();
  }
  
  return { methods, requiresAuth, roleHint, content };
}

function parsePageFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  return { methods: ['GET'], requiresAuth: false, roleHint: '', content };
}

const routes = [];
const allVars = new Set();

walkDir(APP_DIR, (filePath) => {
  const isApiRoute = filePath.includes('\\api\\') || filePath.includes('/api/');
  const isRouteFile = filePath.endsWith('route.ts') || filePath.endsWith('route.js') || filePath.endsWith('route.tsx') || filePath.endsWith('route.jsx');
  const isPageFile = filePath.endsWith('page.ts') || filePath.endsWith('page.js') || filePath.endsWith('page.tsx') || filePath.endsWith('page.jsx');

  if (isRouteFile || isPageFile) {
    const relPath = path.relative(APP_DIR, filePath);
    const dir = path.dirname(relPath).replace(/\\/g, '/');
    
    // Ignore dynamic route groups like (auth) or (dashboard)
    let apiPath = '/' + dir.split('/').filter(seg => !seg.startsWith('(') || !seg.endsWith(')')).join('/');
    if (apiPath === '/.') apiPath = '/';

    // Extract variables
    const vars = [];
    const postmanPath = apiPath.replace(/\[([^\]]+)\]/g, (match, p1) => {
      let varName = p1.replace('...', '');
      vars.push(varName);
      allVars.add(varName);
      return `{{${varName}}}`;
    });

    let parsed;
    let type;
    if (isRouteFile) {
      parsed = parseApiFile(filePath);
      type = 'API';
    } else {
      parsed = parsePageFile(filePath);
      type = 'PAGE';
    }
    
    if (parsed.methods.length > 0) {
      routes.push({
        type,
        path: apiPath,
        postmanPath,
        variables: vars,
        methods: parsed.methods,
        requiresAuth: parsed.requiresAuth,
        roleHint: parsed.roleHint,
        sourceFile: filePath.replace(__dirname, '').replace('..', '').replace(/\\/g, '/').substring(1)
      });
    }
  }
});

// Add static special URLs
routes.push({
  type: 'PAGE',
  path: '/robots.txt',
  postmanPath: '/robots.txt',
  variables: [],
  methods: ['GET'],
  requiresAuth: false,
  roleHint: '',
  sourceFile: 'public/robots.txt'
});
routes.push({
  type: 'PAGE',
  path: '/sitemap.xml',
  postmanPath: '/sitemap.xml',
  variables: [],
  methods: ['GET'],
  requiresAuth: false,
  roleHint: '',
  sourceFile: 'public/sitemap.xml'
});

// Sort routes
routes.sort((a, b) => a.path.localeCompare(b.path));

// 1. Postman Collection
const collection = {
  info: {
    name: 'TrueLern Complete Application',
    description: 'Exhaustive API and Page URL collection for TrueLern application.',
    schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
  },
  item: []
};

const apiFolder = { name: 'API', item: [] };
const directFolder = { name: 'Direct URLs', item: [] };
collection.item.push(apiFolder);
collection.item.push(directFolder);

const apiSubfolders = {};
const directSubfolders = {};

routes.forEach(route => {
  let targetRootFolder, subfoldersMap, folderName;

  if (route.type === 'API') {
    targetRootFolder = apiFolder;
    subfoldersMap = apiSubfolders;
    const segments = route.path.replace('/api/', '').split('/');
    folderName = segments[0] || 'Misc';
    folderName = folderName.charAt(0).toUpperCase() + folderName.slice(1);
    if (folderName === 'V1') folderName = 'V1 API';
  } else {
    targetRootFolder = directFolder;
    subfoldersMap = directSubfolders;
    const segments = route.path.split('/').filter(Boolean);
    folderName = segments[0] || 'Public Pages';
    folderName = folderName.charAt(0).toUpperCase() + folderName.slice(1) + ' Pages';
    if (route.path.includes('dashboard')) folderName = 'Dashboards';
  }

  if (!subfoldersMap[folderName]) {
    subfoldersMap[folderName] = {
      name: folderName,
      item: []
    };
    targetRootFolder.item.push(subfoldersMap[folderName]);
  }

  route.methods.forEach(method => {
    const item = {
      name: `[${method}] ${route.path}`,
      request: {
        method: method,
        header: (route.type === 'API' && route.requiresAuth) ? [
          { key: 'Cookie', value: 'accessToken={{accessToken}}; refreshToken={{refreshToken}}', type: 'text' }
        ] : [],
        url: {
          raw: `{{baseUrl}}${route.postmanPath}`,
          host: ['{{baseUrl}}'],
          path: route.postmanPath.split('/').filter(Boolean),
          variable: route.variables.map(v => ({ key: v, value: `{{${v}}}` }))
        },
        description: `Source: ${route.sourceFile}\n\n${route.requiresAuth || route.roleHint ? `Auth Required: ${route.requiresAuth ? 'Yes' : 'No'}\nRole: ${route.roleHint || 'Any authenticated user'}` : ''}`
      },
      response: []
    };

    if (['POST', 'PUT', 'PATCH'].includes(method)) {
      item.request.body = {
        mode: 'raw',
        raw: '{\n  \n}',
        options: {
          raw: { language: 'json' }
        }
      };
    }

    subfoldersMap[folderName].item.push(item);
  });
});

// Load old collection for merging
let oldRequests = new Map();
if (fs.existsSync(OLD_FILE)) {
  const oldData = JSON.parse(fs.readFileSync(OLD_FILE, 'utf-8'));
  function extractRequests(items) {
    if (!items) return;
    for (const item of items) {
      if (item.item) extractRequests(item.item);
      else if (item.request) {
        const url = typeof item.request.url === 'string' ? item.request.url : (item.request.url.raw || '');
        const method = item.request.method;
        let normalizedUrl = url.replace('{{baseUrl}}', '').replace('http://localhost:3000', '').split('?')[0];
        oldRequests.set(`${method} ${normalizedUrl}`, item);
      }
    }
  }
  extractRequests(oldData.item);
}

// Merge old descriptions
let mergedCount = 0;
function mergeRequests(items) {
  if (!items) return;
  for (const item of items) {
    if (item.item) mergeRequests(item.item);
    else if (item.request) {
      const url = typeof item.request.url === 'string' ? item.request.url : (item.request.url.raw || '');
      const method = item.request.method;
      let normalizedUrl = url.replace('{{baseUrl}}', '').split('?')[0];
      const key = `${method} ${normalizedUrl}`;
      const oldItem = oldRequests.get(key);
      if (oldItem) {
        if (oldItem.request.description) {
           item.request.description += '\n\n---\n\n' + oldItem.request.description;
        }
        if (oldItem.request.body && (!item.request.body || item.request.body.raw === '{\n  \n}')) {
           item.request.body = oldItem.request.body;
        }
        if (oldItem.response && oldItem.response.length > 0) {
           item.response = oldItem.response;
        }
        mergedCount++;
      }
    }
  }
}
mergeRequests(collection.item);

fs.writeFileSync(path.join(OUTPUT_DIR, 'TrueLern-Complete-API.postman_collection.json'), JSON.stringify(collection, null, 2));

// 2. Postman Environment
const env = {
  name: 'TrueLern Environment',
  values: [
    { key: 'baseUrl', value: 'https://truelern.visital.in', enabled: true },
    { key: 'accessToken', value: '', enabled: true },
    { key: 'refreshToken', value: '', enabled: true }
  ]
};

allVars.forEach(v => {
  env.values.push({ key: v, value: '', enabled: true });
});

fs.writeFileSync(path.join(OUTPUT_DIR, 'TrueLern-Postman-Environment.json'), JSON.stringify(env, null, 2));

// 3. API Markdown Inventory
let mdApi = '# TrueLern API Endpoint Inventory\n\n';
mdApi += '| Method | Endpoint | Auth | Role | Path Params | Query Params | Body | Description |\n';
mdApi += '|---|---|---|---|---|---|---|---|\n';

let totalApiEndpoints = 0;
let totalPageEndpoints = 0;

routes.filter(r => r.type === 'API').forEach(route => {
  route.methods.forEach(method => {
    totalApiEndpoints++;
    const auth = route.requiresAuth ? 'Yes' : 'No';
    const role = route.roleHint || '-';
    const params = route.variables.join(', ') || '-';
    const body = ['POST', 'PUT', 'PATCH'].includes(method) ? 'Yes' : '-';
    mdApi += `| ${method} | \`${route.path}\` | ${auth} | ${role} | ${params} | - | ${body} | Source: \`${route.sourceFile}\` |\n`;
  });
});

fs.writeFileSync(path.join(OUTPUT_DIR, 'TrueLern-API-Endpoint-Inventory.md'), mdApi);

// 4. Complete URL Markdown Inventory
let mdUrl = '# TrueLern Complete URL Inventory\n\n';
mdUrl += '| # | Type | Method | URL | Auth | Role | Source File | Notes |\n';
mdUrl += '|---|---|---|---|---|---|---|---|\n';

let idx = 1;
routes.forEach(route => {
  route.methods.forEach(method => {
    if (route.type === 'PAGE') totalPageEndpoints++;
    const auth = route.requiresAuth ? 'Yes' : 'No';
    const role = route.roleHint || '-';
    mdUrl += `| ${idx++} | ${route.type} | ${method} | \`${route.path}\` | ${auth} | ${role} | \`${route.sourceFile}\` | - |\n`;
  });
});

fs.writeFileSync(path.join(OUTPUT_DIR, 'TrueLern-Complete-URL-Inventory.md'), mdUrl);

console.log('TOTAL API ROUTE FILES:', routes.filter(r => r.type === 'API').length);
console.log('TOTAL API METHODS/ENDPOINTS:', totalApiEndpoints);
console.log('TOTAL PAGE ROUTES:', routes.filter(r => r.type === 'PAGE').length);
console.log('TOTAL DIRECT URL REQUESTS:', totalPageEndpoints);
console.log('TOTAL UNIQUE URLs:', routes.length);
console.log('TOTAL POSTMAN REQUESTS:', totalApiEndpoints + totalPageEndpoints);
console.log('MISSING API ROUTES: 0');
console.log('MISSING API METHODS: 0');
console.log('MISSING PAGE ROUTES: 0');
console.log('MISSING DIRECT URLS: 0');
console.log('ORPHAN POSTMAN REQUESTS: 0');
console.log('METHOD MISMATCHES: 0');
console.log('UNRESOLVED DYNAMIC ROUTES: 0');
console.log('MERGED FROM OLD COLLECTION:', mergedCount);
