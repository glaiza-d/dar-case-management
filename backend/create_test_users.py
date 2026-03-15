#!/usr/bin/env python
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
django.setup()

from django.contrib.auth.models import User
from api.models import UserProfile, Role

# Get roles
admin_role, _ = Role.objects.get_or_create(name='Admin', defaults={'description': 'Full access'})
editor_role, _ = Role.objects.get_or_create(name='Editor', defaults={'description': 'Create and update'})
viewer_role, _ = Role.objects.get_or_create(name='Viewer', defaults={'description': 'View only'})

# Create Admin user
if not User.objects.filter(username='admin').exists():
    admin = User.objects.create_user(
        username='admin',
        password='admin123',
        email='admin@dar.gov.ph',
        first_name='Admin',
        last_name='User'
    )
    UserProfile.objects.update_or_create(user=admin, defaults={'role': admin_role})
    print('[OK] Admin user created: admin / admin123')
else:
    print('[OK] Admin user already exists: admin / admin123')

# Create Editor user
if not User.objects.filter(username='editor').exists():
    editor = User.objects.create_user(
        username='editor',
        password='editor123',
        email='editor@dar.gov.ph',
        first_name='Editor',
        last_name='User'
    )
    UserProfile.objects.update_or_create(user=editor, defaults={'role': editor_role})
    print('[OK] Editor user created: editor / editor123')
else:
    print('[OK] Editor user already exists: editor / editor123')

# Create Viewer user
if not User.objects.filter(username='viewer').exists():
    viewer = User.objects.create_user(
        username='viewer',
        password='viewer123',
        email='viewer@dar.gov.ph',
        first_name='Viewer',
        last_name='User'
    )
    UserProfile.objects.update_or_create(user=viewer, defaults={'role': viewer_role})
    print('[OK] Viewer user created: viewer / viewer123')
else:
    print('[OK] Viewer user already exists: viewer / viewer123')

print('All test users ready!')
