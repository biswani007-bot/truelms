import os
import re
import json

ROOT_DIR = r'e:\Lmsca\lmsca'
INVENTORY_FILE = os.path.join(ROOT_DIR, 'api_surface_inventory.json')

with open(INVENTORY_FILE, 'r', encoding='utf-8') as f:
    routes = json.load(f)

# Module mapping rules based on path
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

print(f"Loaded {len(routes)} route files from inventory.")
