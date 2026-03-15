# DAR Case Management System

A web-based Case Management System for the Department of Agrarian Reform (DAR).

## Technology Stack

### Backend
- Django 5.2
- Django REST Framework
- SQLite (default) / PostgreSQL (production)
- JWT Authentication (djangorestframework-simplejwt)

### Frontend
- React 19
- React Router
- Axios
- Recharts (for dashboard charts)
- Vite

## Features

- **JWT Authentication** - Secure login with token refresh
- **Role-based Access Control** - Admin, Editor, Viewer roles
- **Case Management** - Create, read, update, delete cases
- **Workflow Tracking** - Automatic status change history
- **Dashboard Analytics** - Visual charts for case statistics
- **User Management** - Admin can manage users and roles

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install Python dependencies:
```bash
pip install -r requirements.txt
```

3. Run migrations:
```bash
python manage.py migrate
```

4. Create initial roles (optional):
```bash
python manage.py shell -c "from api.models import Role; Role.objects.get_or_create(name='Admin', defaults={'description': 'Full access'}); Role.objects.get_or_create(name='Editor', defaults={'description': 'Create and update'}); Role.objects.get_or_create(name='Viewer', defaults={'description': 'View only'})"
```

5. Create a superuser (optional):
```bash
python manage.py createsuperuser
```

6. Run the backend server:
```bash
python manage.py runserver
```

The backend will run at http://127.0.0.1:8000

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

The frontend will run at http://localhost:5173

## API Endpoints

### Authentication
- `POST /api/token/` - Login (obtain JWT token)
- `POST /api/token/refresh/` - Refresh JWT token

### Users
- `GET /api/users/` - List users
- `POST /api/user/register/` - Register new user
- `GET /api/users/{id}/` - Get user details
- `PUT /api/users/{id}/` - Update user
- `DELETE /api/users/{id}/` - Delete user
- `GET /api/user/me/` - Get current user

### Roles
- `GET /api/roles/` - List roles

### Cases
- `GET /api/cases/` - List cases (with filtering/search)
- `POST /api/cases/` - Create case
- `GET /api/cases/{id}/` - Get case details
- `PUT /api/cases/{id}/` - Update case
- `DELETE /api/cases/{id}/` - Delete case

### Case Workflow
- `GET /api/cases/{id}/workflow/` - Get workflow history

### Case Comments
- `GET /api/cases/{id}/comments/` - List comments
- `POST /api/cases/{id}/comments/` - Add comment

### Case Attachments
- `GET /api/cases/{id}/attachments/` - List attachments
- `POST /api/cases/{id}/attachments/` - Upload attachment

### Dashboard
- `GET /api/dashboard/stats/` - Get dashboard statistics

## Default Roles

- **Admin** - Full access to all features
- **Editor** - Create and update cases
- **Viewer** - View cases only

## Project Structure

```
django-react-app/
├── backend/
│   ├── manage.py
│   ├── backend/
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── wsgi.py
│   └── api/
│       ├── models.py
│       ├── serializers.py
│       ├── views.py
│       ├── urls.py
│       ├── permissions.py
│       ├── admin.py
│       └── signals.py
│
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── App.jsx
│       ├── main.jsx
│       ├── api.js
│       ├── constants.js
│       ├── components/
│       │   ├── Layout.jsx
│       │   ├── ProtectedRoute.jsx
│       │   ├── Form.jsx
│       │   └── LoadingIndicator.jsx
│       ├── pages/
│       │   ├── Login.jsx
│       │   ├── Dashboard.jsx
│       │   ├── CaseManagement.jsx
│       │   ├── UserManagement.jsx
│       │   └── MyAccount.jsx
│       └── styles/
│           └── main.css
│
└── README.md
```

## License

MIT License

---

## Pushing to GitHub

### If you don't have a GitHub repository yet:

1. Create a new repository on GitHub (https://github.com/new)
2. Copy the repository URL (e.g., https://github.com/username/dar-case-management.git)

### Initialize Git and push:

```bash
# Initialize git
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit - DAR Case Management System"

# Add remote repository
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git

# Push to GitHub
git push -u origin main
```

### For subsequent changes:

```bash
# Check status
git status

# Add changes
git add .

# Commit changes
git commit -m "Description of changes"

# Push to GitHub
git push
```

### Notes:
- The `.gitignore` file excludes: node_modules, venv, .venv, db.sqlite3, .env files, and other unnecessary files
- Make sure to create a `.env` file with your local configuration before deploying
