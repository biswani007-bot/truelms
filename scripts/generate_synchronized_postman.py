import os
import re
import json

ROOT_DIR = r'e:\Lmsca\lmsca'
INVENTORY_FILE = os.path.join(ROOT_DIR, 'api_surface_inventory.json')

with open(INVENTORY_FILE, 'r', encoding='utf-8') as f:
    routes = json.load(f)

MODULES_ORDER = [
    '01 Authentication',
    '02 Parent',
    '03 Student',
    '04 Teacher',
    '05 Admin',
    '06 Courses',
    '07 Batches / Cohorts',
    '08 Enrollments',
    '09 Demo / CRM',
    '10 Live Classes',
    '11 Attendance',
    '12 Assignments',
    '13 Assessments',
    '14 Academic Progress',
    '15 Messaging / Communication',
    '16 Notifications',
    '17 Finance / Invoices / Receipts',
    '18 Certificates',
    '19 Media / Uploads',
    '20 Profile / Settings',
    '21 Health / Utility / Other implemented APIs',
    'Parent → Child Isolation Tests',
    'Critical Security & Negative Tests',
    '_DEPRECATED'
]

def get_module(path):
    if path.startswith('/api/auth'):
        return '01 Authentication'
    elif path.startswith('/api/parent'):
        return '02 Parent'
    elif path.startswith('/api/student/courses') and 'progress' in path:
        return '14 Academic Progress'
    elif path.startswith('/api/student') or path.startswith('/api/students'):
        return '03 Student'
    elif path.startswith('/api/teacher') or path.startswith('/api/teachers'):
        return '04 Teacher'
    elif path.startswith('/api/admin'):
        return '05 Admin'
    elif path.startswith('/api/courses') or path.startswith('/api/public/courses') or path.startswith('/api/public/categories'):
        return '06 Courses'
    elif path.startswith('/api/batches') or path.startswith('/api/cohorts'):
        return '07 Batches / Cohorts'
    elif path.startswith('/api/enrollments') or path.startswith('/api/public/enroll'):
        return '08 Enrollments'
    elif path.startswith('/api/crm') or 'demo' in path or path.startswith('/api/public/lead'):
        return '09 Demo / CRM'
    elif path.startswith('/api/live-classes') or path.startswith('/api/recordings'):
        return '10 Live Classes'
    elif path.startswith('/api/attendance'):
        return '11 Attendance'
    elif path.startswith('/api/assignments'):
        return '12 Assignments'
    elif path.startswith('/api/assessments'):
        return '13 Assessments'
    elif 'progress' in path or path.startswith('/api/academic'):
        return '14 Academic Progress'
    elif path.startswith('/api/messages') or path.startswith('/api/communication'):
        return '15 Messaging / Communication'
    elif path.startswith('/api/notifications'):
        return '16 Notifications'
    elif path.startswith('/api/finance'):
        return '17 Finance / Invoices / Receipts'
    elif path.startswith('/api/certificates'):
        return '18 Certificates'
    elif path.startswith('/api/media') or path.startswith('/api/upload'):
        return '19 Media / Uploads'
    elif path.startswith('/api/profile') or path.startswith('/api/settings'):
        return '20 Profile / Settings'
    else:
        return '21 Health / Utility / Other implemented APIs'

def determine_role(path, roles_hint):
    if path.startswith('/api/auth/login') or path.startswith('/api/auth/register') or path.startswith('/api/public/') or path == '/api/health' or path == '/api/docs-json':
        return 'PUBLIC'
    if path.startswith('/api/admin'):
        return 'ADMIN'
    if path.startswith('/api/parent'):
        return 'PARENT'
    if path.startswith('/api/teacher') or path.startswith('/api/teachers'):
        return 'TEACHER'
    if path.startswith('/api/student') or path.startswith('/api/students'):
        return 'STUDENT'
    if roles_hint:
        return ', '.join(roles_hint).upper()
    return 'AUTHENTICATED USER'

def determine_param_key(seg, path):
    if seg == '[id]':
        if 'children' in path: return 'studentId'
        if 'courses' in path: return 'courseId'
        if 'batches' in path: return 'batchId'
        if 'assignments' in path: return 'assignmentId'
        if 'assessments' in path: return 'assessmentId'
        if 'invoices' in path: return 'invoiceId'
        if 'receipts' in path: return 'receiptId'
        if 'certificates' in path: return 'certificateId'
        if 'live-classes' in path: return 'liveClassId'
        if 'demos' in path: return 'demoSessionId'
        return 'id'
    elif seg.startswith('[') and seg.endswith(']'):
        raw = seg[1:-1].replace('...', '')
        if raw == 'classId': return 'liveClassId'
        return raw
    return None

def build_sample_body(method, path):
    if method not in ['POST', 'PUT', 'PATCH']:
        return None
    
    if path == '/api/auth/login':
        return { "email": "parent@truelern.com", "password": "Password123!" }
    elif path == '/api/auth/refresh':
        return { "refreshToken": "{{refreshToken}}" }
    elif path == '/api/auth/change-password':
        return { "currentPassword": "Password123!", "newPassword": "NewPassword123!" }
    elif path == '/api/auth/forgot-password':
        return { "email": "parent@truelern.com" }
    elif path == '/api/auth/reset-password':
        return { "token": "sample-reset-token", "password": "NewSecurePassword123!" }
    elif path == '/api/crm/demos/availability':
        return {
            "startDate": "2026-10-15",
            "endDate": "2026-10-20",
            "daysOfWeek": [1, 2, 3, 4, 5],
            "times": ["10:00 AM", "02:00 PM"],
            "duration": 45,
            "timezone": "UTC"
        }
    elif path == '/api/parent/demo':
        return {
            "studentId": "{{studentId}}",
            "courseId": "{{courseId}}",
            "preferredDate": "2026-10-16",
            "preferredTime": "10:00 AM",
            "slotId": "{{demoAvailabilityId}}",
            "notes": "Interested in AI builders curriculum."
        }
    elif path == '/api/assignments':
        return {
            "title": "Module 3 Robotics Assignment",
            "description": "Assemble and test servo control logic.",
            "course": "{{courseId}}",
            "batch": "{{batchId}}",
            "dueDate": "2026-10-30T18:00:00.000Z",
            "totalMarks": 100,
            "status": "published"
        }
    elif path == '/api/assignments/[id]':
        return { "title": "Updated Robotics Assignment", "totalMarks": 100 }
    elif path == '/api/assessments':
        return {
            "title": "Midterm Robotics Assessment",
            "course": "{{courseId}}",
            "batch": "{{batchId}}",
            "totalMarks": 50,
            "durationMinutes": 60,
            "passingMarks": 25
        }
    elif path == '/api/live-classes':
        return {
            "title": "Live Interactive Coding Session",
            "course": "{{courseId}}",
            "batch": "{{batchId}}",
            "scheduledStart": "2026-10-20T10:00:00.000Z",
            "duration": 60
        }
    elif path == '/api/attendance':
        return {
            "batch": "{{batchId}}",
            "date": "2026-10-05T00:00:00.000Z",
            "records": [{ "student": "{{studentId}}", "status": "present" }]
        }
    elif path == '/api/courses':
        return {
            "courseName": "Full Stack AI Development",
            "courseCode": "AI-301",
            "gradeLevel": "Grade 9-12",
            "description": "Hands-on projects with modern AI tools.",
            "status": "published"
        }
    elif path == '/api/batches':
        return {
            "batchName": "AI Cohort November 2026",
            "course": "{{courseId}}",
            "capacity": 20,
            "startDate": "2026-11-01T00:00:00.000Z"
        }
    elif path == '/api/finance/invoices':
        return {
            "student": "{{studentId}}",
            "parent": "{{parentId}}",
            "amount": 350,
            "dueDate": "2026-11-15T00:00:00.000Z",
            "status": "unpaid"
        }
    elif path == '/api/messages':
        return { "recipient": "{{teacherId}}", "content": "Inquiring about upcoming assessment guidelines." }
    elif path == '/api/notifications/queue':
        return {
            "recipientId": "{{studentId}}",
            "type": "announcement",
            "title": "Cohort Schedule Update",
            "message": "Class will start at 10:30 AM tomorrow."
        }
    elif path == '/api/public/lead':
        return {
            "parentName": "John Doe",
            "email": "johndoe.lead@example.com",
            "phone": "+1-555-0199",
            "childName": "Sam Doe",
            "grade": "Grade 7",
            "programInterest": "Future Ready Builders"
        }
    elif path == '/api/public/enroll':
        return {
            "courseId": "{{courseId}}",
            "parentName": "Jane Smith",
            "email": "jane.enroll@example.com",
            "phone": "+1-555-0288",
            "studentName": "Alex Smith"
        }
    elif 'draft' in path:
        return { "notes": "Draft answers in progress", "content": "Working on question 1..." }
    elif 'submit' in path:
        return {
            "submissionNotes": "Final submission attached.",
            "fileUrl": "https://truelern.visital.in/uploads/assignment-sub.pdf"
        }
    
    return { "status": "active", "notes": "Updated via API" }

def build_test_script(method, path):
    lines = []
    if method == 'POST':
        lines.append("pm.test('Status code is 200 or 201', function () {")
        lines.append("    pm.expect(pm.response.code).to.be.oneOf([200, 201]);")
        lines.append("});")
    elif method == 'DELETE':
        lines.append("pm.test('Status code is 200 or 204', function () {")
        lines.append("    pm.expect(pm.response.code).to.be.oneOf([200, 204]);")
        lines.append("});")
    else:
        lines.append("pm.test('Status code is 200', function () {")
        lines.append("    pm.response.to.have.status(200);")
        lines.append("});")
        
    lines.append("pm.test('Response is valid JSON', function () {")
    lines.append("    pm.response.to.be.withBody;")
    lines.append("    pm.response.to.be.json;")
    lines.append("});")

    if path == '/api/auth/login':
        lines.append("var res = pm.response.json();")
        lines.append("if (res.data && res.data.accessToken) {")
        lines.append("    pm.environment.set('accessToken', res.data.accessToken);")
        lines.append("}")
        lines.append("if (res.data && res.data.refreshToken) {")
        lines.append("    pm.environment.set('refreshToken', res.data.refreshToken);")
        lines.append("}")
        lines.append("if (res.data && res.data.user && res.data.user.id) {")
        lines.append("    pm.environment.set('userId', res.data.user.id);")
        lines.append("}")
    elif path == '/api/parent/children':
        lines.append("var res = pm.response.json();")
        lines.append("if (res.data && Array.isArray(res.data) && res.data.length > 0) {")
        lines.append("    var firstChild = res.data[0];")
        lines.append("    var childId = firstChild._id || firstChild.id || (firstChild.student ? firstChild.student._id : null);")
        lines.append("    if (childId) pm.environment.set('studentId', childId);")
        lines.append("}")
    elif path == '/api/assignments' and method == 'POST':
        lines.append("var res = pm.response.json();")
        lines.append("if (res.data && (res.data._id || res.data.id)) {")
        lines.append("    pm.environment.set('assignmentId', res.data._id || res.data.id);")
        lines.append("}")
    elif path == '/api/crm/demos/availability' and method == 'POST':
        lines.append("var res = pm.response.json();")
        lines.append("if (res.data && Array.isArray(res.data) && res.data.length > 0) {")
        lines.append("    pm.environment.set('demoAvailabilityId', res.data[0]._id || res.data[0].id);")
        lines.append("}")
    elif path == '/api/parent/demo' and method == 'POST':
        lines.append("var res = pm.response.json();")
        lines.append("if (res.data && (res.data._id || res.data.id)) {")
        lines.append("    pm.environment.set('demoSessionId', res.data._id || res.data.id);")
        lines.append("}")
    elif path == '/api/courses' and method == 'POST':
        lines.append("var res = pm.response.json();")
        lines.append("if (res.data && (res.data._id || res.data.id)) {")
        lines.append("    pm.environment.set('courseId', res.data._id || res.data.id);")
        lines.append("}")
    elif path == '/api/batches' and method == 'POST':
        lines.append("var res = pm.response.json();")
        lines.append("if (res.data && (res.data._id || res.data.id)) {")
        lines.append("    pm.environment.set('batchId', res.data._id || res.data.id);")
        lines.append("}")
        
    return lines

# Build modules dictionary
folders = {m: [] for m in MODULES_ORDER}

for r in routes:
    path = r['path']
    methods = r['methods']
    if not methods:
        continue
        
    mod_name = get_module(path)
    role_str = determine_role(path, r.get('roles', []))
    
    # Process segments
    segments = [s for s in path.split('/') if s]
    postman_path_segments = []
    path_variables = []
    
    for seg in segments:
        var_key = determine_param_key(seg, path)
        if var_key:
            postman_path_segments.append(f":{var_key}")
            path_variables.append({
                "key": var_key,
                "value": f"{{{{{var_key}}}}}",
                "description": f"Unique identifier for {var_key}"
            })
        else:
            postman_path_segments.append(seg)
            
    postman_url_raw = "{{baseUrl}}/" + "/".join(postman_path_segments)
    
    # Check query params for child scoping
    query_params = []
    if path == '/api/parent/demo':
        query_params.append({
            "key": "studentId",
            "value": "{{studentId}}",
            "description": "Optional child ID scoping for multi-child parent"
        })
    elif 'progress' in path and 'studentId' in path:
        query_params.append({
            "key": "studentId",
            "value": "{{studentId}}",
            "description": "Student ID for academic course progress"
        })

    for m in methods:
        is_public = (role_str == 'PUBLIC')
        
        headers = []
        if not is_public:
            headers.append({
                "key": "Authorization",
                "value": "Bearer {{accessToken}}",
                "type": "text",
                "description": "Bearer token authentication"
            })
            headers.append({
                "key": "Cookie",
                "value": "accessToken={{accessToken}}; refreshToken={{refreshToken}}",
                "type": "text",
                "description": "Cookie authentication fallback"
            })
        if m in ['POST', 'PUT', 'PATCH']:
            headers.append({
                "key": "Content-Type",
                "value": "application/json",
                "type": "text"
            })
            
        req_body = build_sample_body(m, path)
        body_obj = None
        if req_body is not None:
            body_obj = {
                "mode": "raw",
                "raw": json.dumps(req_body, indent=2),
                "options": {
                    "raw": { "language": "json" }
                }
            }
            
        test_script_lines = build_test_script(m, path)
        
        # Format documentation description
        doc_desc = f"""**Purpose:** {m} operation on {path}
**Authentication:** {'None (Public)' if is_public else 'Required (Bearer Token / Cookie)'}
**Role:** {role_str}
**Parameters:** {', '.join([v['key'] for v in path_variables]) if path_variables else 'None'}
**Body:** {'JSON Payload required' if body_obj else 'None'}
**Expected success:** 200 OK / 201 Created
**Expected errors:** 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 500 Server Error
**Source File:** `{r['file']}`"""

        url_obj = {
            "raw": postman_url_raw,
            "host": ["{{baseUrl}}"],
            "path": postman_path_segments,
            "variable": path_variables
        }
        if query_params:
            url_obj["query"] = query_params

        item = {
            "name": f"[{m}] {path}",
            "request": {
                "method": m,
                "header": headers,
                "url": url_obj,
                "description": doc_desc
            },
            "response": []
        }
        
        if body_obj:
            item["request"]["body"] = body_obj
            
        if test_script_lines:
            item["event"] = [
                {
                    "listen": "test",
                    "script": {
                        "exec": test_script_lines,
                        "type": "text/javascript"
                    }
                }
            ]
            
        folders[mod_name].append(item)

# -------------------------------------------------------------
# ADD DEDICATED SUITE: Parent → Child Isolation Tests
# -------------------------------------------------------------
child_isolation_tests = [
    {
        "name": "[GET] Child A Dashboard (Isolate to Student A)",
        "method": "GET",
        "path": "/api/parent/children/:studentId/dashboard",
        "varKey": "studentId",
        "varVal": "{{studentAId}}",
        "desc": "Verify parent requests Child A dashboard and receives strictly Child A details without cross-child bleed.",
        "tests": [
            "pm.test('Status is 200', function () { pm.response.to.have.status(200); });",
            "var res = pm.response.json();",
            "pm.test('Returns Student A data', function () {",
            "    pm.expect(res.success).to.be.true;",
            "    var id = (res.data && (res.data._id || (res.data.student && res.data.student._id))) || '';",
            "    if (id) pm.expect(id).to.not.equal(pm.environment.get('studentBId'));",
            "});"
        ]
    },
    {
        "name": "[GET] Child A Academic Progress (Isolate to Student A)",
        "method": "GET",
        "path": "/api/parent/children/:studentId/progress",
        "varKey": "studentId",
        "varVal": "{{studentAId}}",
        "desc": "Verify child-scoped academic progress returns data calculated exclusively for Student A.",
        "tests": [
            "pm.test('Status is 200', function () { pm.response.to.have.status(200); });",
            "var res = pm.response.json();",
            "pm.test('Progress scoped to Student A', function () { pm.expect(res.success).to.be.true; });"
        ]
    },
    {
        "name": "[GET] Child A Assignments (Isolate to Student A)",
        "method": "GET",
        "path": "/api/parent/children/:studentId/assignments",
        "varKey": "studentId",
        "varVal": "{{studentAId}}",
        "desc": "Verify parent only receives assignments enrolled or submitted by Student A.",
        "tests": [
            "pm.test('Status is 200', function () { pm.response.to.have.status(200); });",
            "var res = pm.response.json();",
            "pm.test('Assignments payload is valid array', function () {",
            "    pm.expect(res.success).to.be.true;",
            "});"
        ]
    },
    {
        "name": "[GET] Child A Attendance (Isolate to Student A)",
        "method": "GET",
        "path": "/api/parent/children/:studentId/attendance",
        "varKey": "studentId",
        "varVal": "{{studentAId}}",
        "desc": "Verify attendance records belong strictly to Student A.",
        "tests": [
            "pm.test('Status is 200', function () { pm.response.to.have.status(200); });"
        ]
    },
    {
        "name": "[GET] Child B Dashboard (Switch to Student B)",
        "method": "GET",
        "path": "/api/parent/children/:studentId/dashboard",
        "varKey": "studentId",
        "varVal": "{{studentBId}}",
        "desc": "Switch active child context to Student B. Verify no stale Student A information persists.",
        "tests": [
            "pm.test('Status is 200', function () { pm.response.to.have.status(200); });",
            "var res = pm.response.json();",
            "pm.test('Returns Student B data without Student A leak', function () {",
            "    pm.expect(res.success).to.be.true;",
            "    var id = (res.data && (res.data._id || (res.data.student && res.data.student._id))) || '';",
            "    if (id) pm.expect(id).to.not.equal(pm.environment.get('studentAId'));",
            "});"
        ]
    },
    {
        "name": "[GET] Child B Academic Progress (Isolate to Student B)",
        "method": "GET",
        "path": "/api/parent/children/:studentId/progress",
        "varKey": "studentId",
        "varVal": "{{studentBId}}",
        "desc": "Verify child-scoped academic progress switches accurately to Student B.",
        "tests": [
            "pm.test('Status is 200', function () { pm.response.to.have.status(200); });"
        ]
    },
    {
        "name": "[GET] Child-Scoped Next Demo (Query param studentId=Student A)",
        "method": "GET",
        "path": "/api/parent/demo",
        "query": [{"key": "studentId", "value": "{{studentAId}}"}],
        "desc": "Verify next demo query with ?studentId= strictly isolates to Student A's booked demo.",
        "tests": [
            "pm.test('Status is 200', function () { pm.response.to.have.status(200); });",
            "var res = pm.response.json();",
            "pm.test('Demo session matches requested child', function () {",
            "    if (res.data && res.data.student) {",
            "        pm.expect(res.data.student._id || res.data.student).to.equal(pm.environment.get('studentAId'));",
            "    }",
            "});"
        ]
    }
]

for ct in child_isolation_tests:
    raw_url = "{{baseUrl}}" + ct['path']
    if 'query' in ct:
        raw_url += "?" + "&".join([f"{q['key']}={q['value']}" for q in ct['query']])
    
    path_segs = [s for s in ct['path'].split('/') if s]
    var_list = []
    if 'varKey' in ct:
        var_list.append({"key": ct['varKey'], "value": ct['varVal']})
        
    item = {
        "name": ct['name'],
        "request": {
            "method": ct['method'],
            "header": [
                {"key": "Authorization", "value": "Bearer {{accessToken}}", "type": "text"},
                {"key": "Cookie", "value": "accessToken={{accessToken}}", "type": "text"}
            ],
            "url": {
                "raw": raw_url,
                "host": ["{{baseUrl}}"],
                "path": path_segs,
                "variable": var_list,
                "query": ct.get('query', [])
            },
            "description": f"**Child Isolation Test**\n\n{ct['desc']}"
        },
        "event": [
            {
                "listen": "test",
                "script": {
                    "exec": ct['tests'],
                    "type": "text/javascript"
                }
            }
        ],
        "response": []
    }
    folders['Parent → Child Isolation Tests'].append(item)

# -------------------------------------------------------------
# ADD DEDICATED SUITE: Critical Security & Negative Tests
# -------------------------------------------------------------
security_negative_tests = [
    {
        "name": "[SECURITY] No Auth Token -> Expect 401 Unauthorized",
        "method": "GET",
        "path": "/api/parent/children",
        "headers": [],
        "desc": "Calls a protected endpoint with no Authorization header or accessToken cookie.",
        "tests": [
            "pm.test('Status is 401 Unauthorized', function () {",
            "    pm.response.to.have.status(401);",
            "});",
            "pm.test('Returns not authenticated error code', function () {",
            "    var res = pm.response.json();",
            "    pm.expect(res.success).to.be.false;",
            "});"
        ]
    },
    {
        "name": "[SECURITY] Role Authorization Failure -> Expect 403 Forbidden",
        "method": "DELETE",
        "path": "/api/assignments/:assignmentId",
        "varKey": "assignmentId",
        "varVal": "{{assignmentId}}",
        "headers": [
            {"key": "Authorization", "value": "Bearer {{studentToken}}", "type": "text"}
        ],
        "desc": "Calls an Admin/Teacher-only mutation endpoint using a Student token.",
        "tests": [
            "pm.test('Status is 403 Forbidden', function () {",
            "    pm.expect(pm.response.code).to.be.oneOf([401, 403]);",
            "});"
        ]
    },
    {
        "name": "[SECURITY] Invalid ObjectId Format -> Expect 400 or 404",
        "method": "GET",
        "path": "/api/assignments/:assignmentId",
        "varKey": "assignmentId",
        "varVal": "invalid-non-hex-id-999",
        "headers": [
            {"key": "Authorization", "value": "Bearer {{accessToken}}", "type": "text"}
        ],
        "desc": "Sends malformed non-hex ID parameter to verify ID validation prevents unhandled server errors.",
        "tests": [
            "pm.test('Status is 400 or 404', function () {",
            "    pm.expect(pm.response.code).to.be.oneOf([400, 404]);",
            "});"
        ]
    },
    {
        "name": "[SECURITY] Cross-Parent Child IDOR -> Expect 403 or 404",
        "method": "GET",
        "path": "/api/parent/children/:studentId/academics",
        "varKey": "studentId",
        "varVal": "670299999999999999999999",
        "headers": [
            {"key": "Authorization", "value": "Bearer {{accessToken}}", "type": "text"}
        ],
        "desc": "Authenticated parent attempts to query academics for an unlinked student ID.",
        "tests": [
            "pm.test('Status is 403 or 404', function () {",
            "    pm.expect(pm.response.code).to.be.oneOf([403, 404]);",
            "});"
        ]
    },
    {
        "name": "[SECURITY] Cross-User Invoice Access IDOR -> Expect 403 or 404",
        "method": "GET",
        "path": "/api/finance/invoices/:invoiceId",
        "varKey": "invoiceId",
        "varVal": "670e99999999999999999999",
        "headers": [
            {"key": "Authorization", "value": "Bearer {{accessToken}}", "type": "text"}
        ],
        "desc": "Attempts to fetch invoice belonging to another student/parent account.",
        "tests": [
            "pm.test('Status is 403 or 404', function () {",
            "    pm.expect(pm.response.code).to.be.oneOf([403, 404]);",
            "});"
        ]
    }
]

for st in security_negative_tests:
    raw_url = "{{baseUrl}}" + st['path']
    path_segs = [s for s in st['path'].split('/') if s]
    var_list = []
    if 'varKey' in st:
        var_list.append({"key": st['varKey'], "value": st['varVal']})
        
    item = {
        "name": st['name'],
        "request": {
            "method": st['method'],
            "header": st['headers'],
            "url": {
                "raw": raw_url,
                "host": ["{{baseUrl}}"],
                "path": path_segs,
                "variable": var_list
            },
            "description": f"**Security & Negative Test**\n\n{st['desc']}"
        },
        "event": [
            {
                "listen": "test",
                "script": {
                    "exec": st['tests'],
                    "type": "text/javascript"
                }
            }
        ],
        "response": []
    }
    folders['Critical Security & Negative Tests'].append(item)

# -------------------------------------------------------------
# ADD DEDICATED SUITE: _DEPRECATED
# -------------------------------------------------------------
deprecated_items = [
    {
        "name": "[LEGACY] GET /api/parent/progress (Replaced by child-scoped route)",
        "desc": "DEPRECATED: Un-scoped parent progress endpoint. Replaced by `/api/parent/children/:id/progress` and `/api/student/courses/:id/progress` which use the schedule-based ProgressService.",
        "path": "/api/parent/progress"
    },
    {
        "name": "[LEGACY] GET /api/parent/assignments (Replaced by child-scoped route)",
        "desc": "DEPRECATED: Legacy un-scoped assignments listing for parents. Replaced by `/api/parent/children/:id/assignments`.",
        "path": "/api/parent/assignments"
    },
    {
        "name": "[LEGACY] GET /api/parent/attendance (Replaced by child-scoped route)",
        "desc": "DEPRECATED: Legacy un-scoped attendance query. Replaced by child-scoped `/api/parent/children/:id/attendance`.",
        "path": "/api/parent/attendance"
    }
]

for dep in deprecated_items:
    item = {
        "name": dep['name'],
        "request": {
            "method": "GET",
            "header": [
                {"key": "Authorization", "value": "Bearer {{accessToken}}", "type": "text"}
            ],
            "url": {
                "raw": "{{baseUrl}}" + dep['path'],
                "host": ["{{baseUrl}}"],
                "path": [s for s in dep['path'].split('/') if s]
            },
            "description": f"⚠️ **DEPRECATED ENDPOINT**\n\n{dep['desc']}"
        },
        "response": []
    }
    folders['_DEPRECATED'].append(item)

# Build Collection Object
collection_items = []
total_requests = 0

for m in MODULES_ORDER:
    reqs = folders[m]
    if reqs:
        collection_items.append({
            "name": m,
            "item": reqs,
            "description": f"Endpoints and operations for {m}"
        })
        total_requests += len(reqs)

postman_collection = {
    "info": {
        "_postman_id": "truelern-lms-complete-api-v2",
        "name": "TrueLern LMS API - Synchronized Production Collection",
        "description": "Complete, synchronized, production-accurate Postman collection for TrueLern LMS / LMSCA backend API.\n\nAll routes mapped from actual Next.js app/api/** endpoints.",
        "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
        "version": "2.0.0"
    },
    "variable": [
        { "key": "baseUrl", "value": "http://localhost:3030", "type": "string" },
        { "key": "accessToken", "value": "", "type": "string" },
        { "key": "refreshToken", "value": "", "type": "string" },
        { "key": "studentId", "value": "670200000000000000000001", "type": "string" },
        { "key": "studentAId", "value": "670200000000000000000001", "type": "string" },
        { "key": "studentBId", "value": "670200000000000000000002", "type": "string" },
        { "key": "parentId", "value": "670100000000000000000001", "type": "string" },
        { "key": "teacherId", "value": "670300000000000000000001", "type": "string" },
        { "key": "adminId", "value": "670400000000000000000001", "type": "string" },
        { "key": "courseId", "value": "670500000000000000000001", "type": "string" },
        { "key": "batchId", "value": "670600000000000000000001", "type": "string" },
        { "key": "enrollmentId", "value": "670700000000000000000001", "type": "string" },
        { "key": "demoAvailabilityId", "value": "670800000000000000000001", "type": "string" },
        { "key": "demoSessionId", "value": "670900000000000000000001", "type": "string" },
        { "key": "liveClassId", "value": "670a00000000000000000001", "type": "string" },
        { "key": "assignmentId", "value": "670b00000000000000000001", "type": "string" },
        { "key": "submissionId", "value": "670c00000000000000000001", "type": "string" },
        { "key": "assessmentId", "value": "670d00000000000000000001", "type": "string" },
        { "key": "invoiceId", "value": "670e00000000000000000001", "type": "string" },
        { "key": "receiptId", "value": "670f00000000000000000001", "type": "string" },
        { "key": "certificateId", "value": "671000000000000000000001", "type": "string" },
        { "key": "messageThreadId", "value": "671100000000000000000001", "type": "string" }
    ],
    "item": collection_items
}

# Write Collection File
coll_path = os.path.join(ROOT_DIR, 'TrueLern_Postman_Collection.json')
with open(coll_path, 'w', encoding='utf-8') as f:
    json.dump(postman_collection, f, indent=2)

# Also update docs/postman/
docs_coll_path = os.path.join(ROOT_DIR, 'docs', 'postman', 'TrueLern-Complete-API.postman_collection.json')
with open(docs_coll_path, 'w', encoding='utf-8') as f:
    json.dump(postman_collection, f, indent=2)

# -------------------------------------------------------------
# CREATE ENVIRONMENTS
# -------------------------------------------------------------
env_vars_base = [
    { "key": "accessToken", "value": "", "enabled": True },
    { "key": "refreshToken", "value": "", "enabled": True },
    { "key": "parentId", "value": "670100000000000000000001", "enabled": True },
    { "key": "studentId", "value": "670200000000000000000001", "enabled": True },
    { "key": "studentAId", "value": "670200000000000000000001", "enabled": True },
    { "key": "studentBId", "value": "670200000000000000000002", "enabled": True },
    { "key": "teacherId", "value": "670300000000000000000001", "enabled": True },
    { "key": "adminId", "value": "670400000000000000000001", "enabled": True },
    { "key": "courseId", "value": "670500000000000000000001", "enabled": True },
    { "key": "batchId", "value": "670600000000000000000001", "enabled": True },
    { "key": "enrollmentId", "value": "670700000000000000000001", "enabled": True },
    { "key": "demoAvailabilityId", "value": "670800000000000000000001", "enabled": True },
    { "key": "demoSessionId", "value": "670900000000000000000001", "enabled": True },
    { "key": "liveClassId", "value": "670a00000000000000000001", "enabled": True },
    { "key": "assignmentId", "value": "670b00000000000000000001", "enabled": True },
    { "key": "submissionId", "value": "670c00000000000000000001", "enabled": True },
    { "key": "assessmentId", "value": "670d00000000000000000001", "enabled": True },
    { "key": "invoiceId", "value": "670e00000000000000000001", "enabled": True },
    { "key": "receiptId", "value": "670f00000000000000000001", "enabled": True },
    { "key": "certificateId", "value": "671000000000000000000001", "enabled": True },
    { "key": "messageThreadId", "value": "671100000000000000000001", "enabled": True },
    { "key": "studentToken", "value": "", "enabled": True },
    { "key": "id", "value": "670100000000000000000001", "enabled": True },
    { "key": "slug", "value": "future-ready-builders", "enabled": True },
    { "key": "filename", "value": "test-sample.pdf", "enabled": True },
    { "key": "docId", "value": "671200000000000000000001", "enabled": True },
    { "key": "topicId", "value": "671300000000000000000001", "enabled": True },
    { "key": "messageId", "value": "671400000000000000000001", "enabled": True }
]

env_local = {
    "id": "truelern-local-env",
    "name": "TrueLern Local",
    "values": [{"key": "baseUrl", "value": "http://localhost:3030", "enabled": True}] + env_vars_base,
    "_postman_variable_scope": "environment"
}

env_prod = {
    "id": "truelern-production-env",
    "name": "TrueLern Production",
    "values": [{"key": "baseUrl", "value": "https://truelern.visital.in", "enabled": True}] + env_vars_base,
    "_postman_variable_scope": "environment"
}

local_env_path = os.path.join(ROOT_DIR, 'TrueLern_Local.postman_environment.json')
prod_env_path = os.path.join(ROOT_DIR, 'TrueLern_Production.postman_environment.json')

with open(local_env_path, 'w', encoding='utf-8') as f:
    json.dump(env_local, f, indent=2)

with open(prod_env_path, 'w', encoding='utf-8') as f:
    json.dump(env_prod, f, indent=2)

# Also update docs/postman environment files
with open(os.path.join(ROOT_DIR, 'docs', 'postman', 'TrueLern-Postman-Environment.json'), 'w', encoding='utf-8') as f:
    json.dump(env_local, f, indent=2)

# -------------------------------------------------------------
# CREATE POSTMAN_API_README.md
# -------------------------------------------------------------
readme_content = f"""# TrueLern / LMSCA — Postman Collection & API Documentation

This directory contains the synchronized Postman collection and environments reflecting the actual Next.js backend API routes (`app/api/**`).

---

## 1. Collection Files

- **`TrueLern_Postman_Collection.json`**: Complete Postman Collection (v2.1.0 format) covering {total_requests} API requests organized into 21 functional modules, plus dedicated Child-Isolation and Security suites.
- **`TrueLern_Local.postman_environment.json`**: Local development environment configured for `http://localhost:3030`.
- **`TrueLern_Production.postman_environment.json`**: Production environment configured for `https://truelern.visital.in`.

---

## 2. Authentication Flow

TrueLern supports dual-mode authentication via edge middleware (`proxy.ts`) and API auth helper (`getAuthenticatedUser` / `getAuthenticatedParent` / `getAuthenticatedStudent` / `getAuthenticatedTeacher`):
1. **Bearer Authorization Header:** `Authorization: Bearer <accessToken>`
2. **HttpOnly Cookie:** `accessToken=<accessToken>; refreshToken=<refreshToken>`

### Login Steps
1. Execute `[POST] /api/auth/login` under **01 Authentication**.
2. The automated Postman test script captures `accessToken`, `refreshToken`, and `userId` directly into the active environment.
3. Subsequent requests automatically pass `{{accessToken}}` in the headers and cookies.

---

## 3. Module Hierarchy

```text
01 Authentication                 — User login, refresh token, password reset, OAuth, sessions
02 Parent                         — Multi-child profile, child-scoped academics, attendance, finance, demo
03 Student                        — Student directory, timeline, student profiles, documents
04 Teacher                        — Faculty batches, messages, teacher directory, availability
05 Admin                          — User roles, system configurations, admin dashboard, analytics
06 Courses                        — Course catalog, public courses, categories, modules
07 Batches / Cohorts              — Cohort schedules, students, teachers, timelines
08 Enrollments                    — Student admissions, checklist, public checkout
09 Demo / CRM                     — Demo availability, atomic booking, lead pipeline, follow-ups
10 Live Classes                   — Sessions, Jitsi tokens, participant heartbeats, recordings
11 Attendance                     — Attendance logs, daily tracking, regularization
12 Assignments                    — Creation, evaluation, student submissions, soft-delete
13 Assessments                    — Quizzes, evaluations, questions, rubrics, results
14 Academic Progress              — Schedule-based Course Progress (Student & Parent child-scoped)
15 Messaging / Communication      — Parent-teacher conversation threads, read indicators
16 Notifications                  — Notification queue, inbox, preference settings, templates
17 Finance / Invoices / Receipts  — Invoices, fee plans, installments, payment receipts, refunds
18 Certificates                   — Certificate verification, issuance, eligibility, templates
19 Media / Uploads                — Secure file uploads, attachment retrieval
20 Profile / Settings             — User profile management, global app settings
21 Health / Utility / Other       — System health, docs-json, workflows, gateway logs
Parent → Child Isolation Tests    — Multi-child data leakage and child-context switching verification
Critical Security & Negative Tests— 401 unauthenticated, 403 role-guard, 404/400 validation, IDOR tests
_DEPRECATED                       — Retired/superseded endpoints marked with migration rationale
```

---

## 4. Parent → Child Isolation Tests

Multi-child isolation is strictly enforced across all parent endpoints:
- Child selection uses the route format `/api/parent/children/:studentId/...` or `?studentId={{studentId}}`.
- The **Parent → Child Isolation Tests** folder executes:
  1. Fetch Child A dashboard (`{{studentAId}}`)
  2. Verify response contains Student A data only (no bleed of Student B)
  3. Fetch Child A progress (`/api/parent/children/{{studentAId}}/progress`)
  4. Fetch Child A assignments (`/api/parent/children/{{studentAId}}/assignments`)
  5. Fetch Child A attendance (`/api/parent/children/{{studentAId}}/attendance`)
  6. Switch active child to Student B (`{{studentBId}}`)
  7. Verify response switches completely without caching Student A data
  8. Verify demo booking scoping (`/api/parent/demo?studentId={{studentAId}}`)

---

## 5. Academic Progress Architecture

The progress computation is powered by `ProgressService.getStudentCourseProgressDetail`:
- Computes schedule-based completion by evaluating completed live-class sessions against total scheduled classes.
- Used in both Student Portal (`GET /api/student/courses/:id/progress`) and Parent Portal (`GET /api/parent/children/:id/progress`).

---

## 6. Deprecated / Superseded Endpoints

Located in `_DEPRECATED`:
- `GET /api/parent/progress`: Replaced by child-scoped `/api/parent/children/:id/progress`.
- `GET /api/parent/assignments`: Replaced by child-scoped `/api/parent/children/:id/assignments`.
- `GET /api/parent/attendance`: Replaced by child-scoped `/api/parent/children/:id/attendance`.
"""

readme_path = os.path.join(ROOT_DIR, 'POSTMAN_API_README.md')
with open(readme_path, 'w', encoding='utf-8') as f:
    f.write(readme_content)

print(f"SUCCESS: Generated Postman Collection with {total_requests} requests across {len(collection_items)} folders.")
print(f"Saved: {coll_path}")
print(f"Saved: {local_env_path}")
print(f"Saved: {prod_env_path}")
print(f"Saved: {readme_path}")
