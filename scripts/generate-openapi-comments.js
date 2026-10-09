const fs = require('fs');
const path = require('path');

function findRouteFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      findRouteFiles(filePath, fileList);
    } else if (file === 'route.ts' || file === 'route.js') {
      fileList.push(filePath);
    }
  }
  return fileList;
}

function processRouteFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  if (content.includes('@swagger')) {
    return; // Already documented
  }

  // Derive endpoint path
  const normalizedPath = filePath.replace(/\\/g, '/');
  const match = normalizedPath.match(/app\/api\/(.*)\/route\.(ts|js)$/);
  if (!match) return;

  let endpoint = `/api/${match[1]}`;
  
  // Replace Next.js dynamic route brackets with Swagger curly braces
  endpoint = endpoint.replace(/\[([^\]]+)\]/g, '{$1}');
  
  const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
  let injected = false;
  
  methods.forEach(method => {
    // Check if the method is exported. e.g. export async function GET
    // or export const POST = apiHandler(
    const regex = new RegExp(`export\\s+(async\\s+function|const)\\s+${method}\\b`, 'g');
    if (regex.test(content)) {
      const isProtected = content.includes('authMiddleware') || content.includes('jwt') || !endpoint.includes('/public/');
      const tag = match[1].split('/')[0] || 'Default';
      
      const comment = `
/**
 * @swagger
 * ${endpoint}:
 *   ${method.toLowerCase()}:
 *     summary: Auto-generated summary for ${method} ${endpoint}
 *     tags: [${tag}]
 *     ${isProtected ? `security:\n *       - BearerAuth: []` : ''}
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 */
`;
      content = comment + content;
      injected = true;
    }
  });

  if (injected) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`[Swagger Generated] ${endpoint}`);
  }
}

const apiDir = path.join(__dirname, '../app/api');
const routeFiles = findRouteFiles(apiDir);
console.log(`Found ${routeFiles.length} route files.`);
routeFiles.forEach(processRouteFile);
console.log('Done generating OpenAPI comments.');
