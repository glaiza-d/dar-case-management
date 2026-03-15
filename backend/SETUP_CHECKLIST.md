# DAR Case Management System - Setup Checklist

## Current Codebase Analysis

### Project Structure
```
django-react-app/
├── backend/
│   ├── manage.py
│   ├── backend/
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── wsgi.py
│   ├── api/
│   │   ├── models.py (Basic Case model only)
│   │   ├── serializers.py
│   │   ├── views.py
│   │   ├── urls.py
│   │   └── migrations/
│   ├── requirements.txt
│   └── db.sqlite3
│
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── .env
│   ├── public/
│   └── src/
│       ├── App.jsx (Broken - references undefined Home)
│       ├── api.js
│       ├── constants.js
│       ├── main.jsx
│       ├── components/
│       │   ├── Form.jsx
│       │   ├── ProtectedRoute.jsx (Has React.useState bug)
│       │   └── LoadingIndicator.jsx
│       ├── pages/
│       │   ├── Login.jsx
│       │   ├── NotFound.jsx
│       │   ├── Dashboard.jsx (Empty)
│       │   ├── CaseManagement.jsx (Empty)
│       │   ├── UserManagement.jsx (Empty)
│       │   └── MyAccount.jsx (Empty)
│       └── styles/
│
└── docs/
```

---

## Required Python Packages

### Already Installed (requirements.txt)
- asgiref
- Django
- django-cors-headers
- djangorestframework
- djangorestframework-simplejwt
- PyJWT
- pytz
- sqlparse
- psycopg2-binary
- python-dotenv

### Installation Command
```bash
cd backend
pip install -r requirements.txt
```

---

## Required Node Packages

### Already in package.json
- axios
- jwt-decode
- react
- react-dom
- react-router-dom

### Installation Command
```bash
cd frontend
npm install
```

### Additional Packages to Add
- recharts (for dashboard charts)

```bash
npm install recharts
```

---

## Environment Variables

### Backend (.env)
Create `backend/.env`:
```env
SECRET_KEY=your-secret-key-here
DEBUG=True
DATABASE_NAME=dar_db
DATABASE_USER=postgres
DATABASE_PASSWORD=your-password
DATABASE_HOST=localhost
DATABASE_PORT=5432
```

### Frontend (.env already exists)
```
VITE_API_URL="http://127.0.0.1:8000"
```

---

## Database Setup

### Option 1: SQLite (Development - Already Configured)
The current settings.py uses SQLite. No additional setup required.

### Option 2: PostgreSQL (Recommended for Production)
1. Create PostgreSQL database:
```sql
CREATE DATABASE dar_db;
```

2. Update `backend/backend/settings.py` DATABASES config:
```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'dar_db',
        'USER': 'postgres',
        'PASSWORD': 'your-password',
        'HOST': 'localhost',
        'PORT': '5432',
    }
}
```

---

## Migration Steps

### Backend Migrations
```bash
cd backend

# Create migrations for existing models
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# Create superuser (admin)
python manage.py createsuperuser
```

---

## Commands to Run the Project

### Backend
```bash
cd backend
python manage.py runserver
```
Backend runs at: http://127.0.0.1:8000

### Frontend
```bash
cd frontend
npm run dev
```
Frontend runs at: http://localhost:5173 (Vite default)

---

## Issues to Fix (Before Running)

### Backend
1. Need to add missing models (Roles, Permissions, CaseWorkflow, CaseComments, CaseAttachments)
2. Need to implement proper User model with roles
3. Need to fix serializers to include all fields
4. Need to add more API endpoints

### Frontend
1. Fix App.jsx - remove undefined `Home` reference
2. Fix ProtectedRoute.jsx - change `React.useState` to `useState`
3. Implement all empty pages
4. Add layout with sidebar, header, footer

---

## API Endpoints to Implement

### Authentication
- POST /api/token/ (login)
- POST /api/token/refresh/ (refresh token)
- POST /api/auth/logout/

### Users
- GET /api/users/ (list users)
- POST /api/users/ (create user)
- GET /api/users/{id}/ (get user)
- PUT /api/users/{id}/ (update user)
- DELETE /api/users/{id}/ (delete user)

### Cases
- GET /api/cases/ (list cases with pagination/filtering)
- POST /api/cases/ (create case)
- GET /api/cases/{id}/ (get case)
- PUT /api/cases/{id}/ (update case)
- DELETE /api/cases/{id}/ (delete case)

### Case Workflow
- GET /api/cases/{id}/workflow/ (get workflow history)

### Case Comments
- GET /api/cases/{id}/comments/
- POST /api/cases/{id}/comments/

### Case Attachments
- GET /api/cases/{id}/attachments/
- POST /api/cases/{id}/attachments/

### Dashboard
- GET /api/dashboard/stats/

---

## Phase Implementation Plan

### Phase 1: Project Setup (Complete - needs fixes)
- [x] Django project structure
- [x] React frontend structure
- [x] JWT authentication configured

### Phase 2: Database Models (Pending)
- [ ] User model with roles
- [ ] Role model
- [ ] Permission model
- [ ] Case model (already exists - needs enhancement)
- [ ] CaseWorkflow model
- [ ] CaseComment model
- [ ] CaseAttachment model

### Phase 3: Authentication (Partial)
- [x] JWT login
- [ ] Role-based permissions
- [ ] Logout functionality

### Phase 4: API Endpoints (Partial)
- [x] User registration
- [x] Token obtain/refresh
- [ ] Full CRUD for cases
- [ ] User management endpoints
- [ ] Workflow tracking endpoints
- [ ] Dashboard statistics

### Phase 5: Frontend Pages (Partial)
- [x] Login page
- [ ] Dashboard with charts
- [ ] Case management CRUD
- [ ] User management
- [ ] My Account page
- [ ] Layout with sidebar

### Phase 6: Core Features (Pending)
- [ ] File attachments
- [ ] Search and filtering
- [ ] Pagination
