import os
import re
import json

api_dir = r'e:\Lmsca\lmsca\app\api'
routes = []

for root, dirs, files in os.walk(api_dir):
    for f in files:
        if f.startswith('route.') and (f.endswith('.ts') or f.endswith('.js')):
            full_path = os.path.join(root, f)
            rel_dir = os.path.relpath(root, api_dir).replace('\\', '/')
            api_path = '/api' if rel_dir == '.' else f'/api/{rel_dir}'
            
            with open(full_path, 'r', encoding='utf-8', errors='ignore') as fp:
                content = fp.read()
                
            methods = []
            for m in ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']:
                if re.search(r'export\s+(async\s+)?(function\s+' + m + r'\b|const\s+' + m + r'\s*=)', content):
                    methods.append(m)
                    
            # Check auth
            auth_required = bool(
                'authService' in content or 
                'verifyToken' in content or 
                'requireAuth' in content or 
                'getServerSession' in content or
                'req.cookies.get("accessToken")' in content or
                'cookies.get("accessToken")' in content or
                'withRoles' in content or
                'jwt' in content.lower() or
                'authenticate' in content.lower()
            )
            
            # Check roles
            role_hints = []
            for role in ['Admin', 'Teacher', 'Parent', 'Student', 'SuperAdmin', 'FinanceManager', 'AcademicManager']:
                if re.search(r'\b' + role + r'\b', content, re.IGNORECASE):
                    if role.capitalize() not in role_hints:
                        role_hints.append(role.capitalize())

            routes.append({
                'path': api_path,
                'methods': methods,
                'auth': auth_required,
                'roles': role_hints,
                'file': os.path.relpath(full_path, r'e:\Lmsca\lmsca').replace('\\', '/')
            })

routes.sort(key=lambda x: x['path'])
print(f'Total route files: {len(routes)}')
total_endpoints = sum(len(r['methods']) for r in routes)
print(f'Total HTTP endpoints (methods): {total_endpoints}')
for r in routes:
    m_str = ', '.join(r['methods']) if r['methods'] else 'NO_METHODS'
    print(f"{m_str:<25} {r['path']}")

with open(r'e:\Lmsca\lmsca\api_surface_inventory.json', 'w', encoding='utf-8') as out:
    json.dump(routes, out, indent=2)
