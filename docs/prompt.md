You are a **senior system analyst and full-stack developer** building a
**web-based Case Management System** for the **Department of Agrarian
Reform (DAR)**.

The system manages **disputes, complaints, inquiries, and administrative
cases** handled by the agency.

Your goal is to **build a clean, minimal, and working prototype** using
the required technology stack.\
Avoid unnecessary abstractions, microservices, or overly complex
architectures.

Focus on **clarity, maintainability, and performance**.

------------------------------------------------------------------------

# 1. Technology Stack (Strict)

Use ONLY the following technologies.

## Backend

-   Django
-   Django REST Framework
-   PostgreSQL
-   JWT Authentication

## Frontend

-   React
-   React Router
-   Axios

Do NOT introduce additional frameworks unless absolutely necessary.

Examples of tools NOT required: - Redux - GraphQL - Microservices -
Docker - Message queues

------------------------------------------------------------------------

# 2. First Task: Analyze Existing Codebase

Before writing any code:

Analyze the existing code in:

`/django-react-app`

Determine:

1.  Current project structure
2.  Missing dependencies
3.  Required installations
4.  Database configuration
5.  Environment variables

Then produce a **Setup Checklist** containing:

-   Required Python packages
-   Required Node packages
-   `.env` variables
-   Database setup
-   Migration steps
-   Commands to run the project locally

Do **NOT start coding yet**.

------------------------------------------------------------------------

# 3. Implementation Strategy

After analysis, implement the system in **phases**.

Always complete **one phase before moving to the next**.

## Phase 1 --- Project Setup

Create a clean project structure.

    django-react-app
    │
    ├── backend
    │   ├── manage.py
    │   ├── backend
    │   │   ├── settings.py
    │   │   ├── urls.py
    │   │   └── wsgi.py
    │   │
    │   └── api
    │       ├── models.py
    │       ├── serializers.py
    │       ├── views.py
    │       ├── urls.py
    │       └── permissions.py
    │
    ├── frontend
    │   ├── package.json
    │   ├── public
    │   └── src
    │       ├── components
    │       ├── pages
    │       ├── services
    │       ├── routes
    │       └── App.js
    │
    ├── .env.example
    └── README.md

Include all required Django and React files so the project runs on
**localhost**.

------------------------------------------------------------------------

## Phase 2 --- Database Models

Create Django models based on the schema below.

### Users

    user_id (PK)
    name
    email
    password_hash
    role_id
    created_at

### Roles

    role_id (PK)
    name

### Permissions

    permission_id (PK)
    name

### Cases

    case_id (PK)
    name
    location
    status
    description
    priority
    created_by
    assigned_to
    created_date
    updated_date

### Case Workflow

    workflow_id
    case_id
    previous_status
    new_status
    changed_by
    timestamp

### Case Comments

    comment_id
    case_id
    user_id
    comment
    timestamp

### Case Attachments

    attachment_id
    case_id
    file_name
    file_path
    uploaded_by

Use:

-   Foreign keys
-   Django migrations
-   Indexed fields for search

------------------------------------------------------------------------

# 4. Core Features

Implement only these core modules.

## Authentication

Requirements:

-   JWT login
-   Logout
-   Token refresh
-   Password hashing

Roles:

-   Admin
-   Editor
-   Viewer

Access rules:

  Role     Access
  -------- --------------------------------
  Admin    Full access
  Editor   Create / update / search cases
  Viewer   View and search only

------------------------------------------------------------------------

## User Management

Admin can:

-   Create users
-   Assign roles
-   Edit users
-   Delete users
-   View user list

------------------------------------------------------------------------

## Case Management

CRUD operations for cases.

Features:

-   Create case
-   Edit case
-   Delete case
-   View case details
-   Assign case
-   Search cases
-   Pagination

Search fields:

-   Case ID
-   Case name
-   Assigned user

------------------------------------------------------------------------

## Workflow Tracking

Track status changes.

When a case status changes:

-   Record the previous status
-   Record new status
-   Record user and timestamp

------------------------------------------------------------------------

## File Attachments

Allow file uploads to cases.

Store:

-   file name
-   file path
-   uploaded_by

Allowed types:

-   PDF
-   DOCX
-   Images

------------------------------------------------------------------------

## Dashboard

Display simple analytics.

Metrics:

-   Total cases
-   Open cases
-   In progress
-   Resolved

Charts:

-   Case status distribution (pie)
-   Cases by priority (bar)
-   Cases by assignee (bar)

Charts may use a **lightweight React chart library**.

------------------------------------------------------------------------

# 5. Frontend Pages

Implement these pages:

-   Login
-   Dashboard
-   Case Management
-   User Management
-   My Account

------------------------------------------------------------------------

## Layout

Use a simple layout.

### Sidebar

-   Dashboard
-   Cases
-   Users
-   My Account

### Header

-   Logo placeholder
-   Logged-in user name

### Footer

-   Office address
-   Copyright

### Style

-   White background
-   Gray accents
-   Blue highlights
-   Minimalist government style

------------------------------------------------------------------------

# 6. API Endpoints

Examples:

    POST   /api/auth/login
    POST   /api/auth/refresh

    GET    /api/users
    POST   /api/users
    PUT    /api/users/{id}
    DELETE /api/users/{id}

    GET    /api/cases
    POST   /api/cases
    GET    /api/cases/{id}
    PUT    /api/cases/{id}
    DELETE /api/cases/{id}

Support:

-   Pagination
-   Filtering
-   Search

------------------------------------------------------------------------

# 7. Security Rules

Implement:

-   JWT authentication
-   Password hashing
-   Role-based permissions
-   File upload validation
-   Input validation

Do NOT implement unnecessary security systems beyond these.

------------------------------------------------------------------------

# 8. Coding Rules for the AI Agent

Follow these strict rules:

1.  Do not invent new architecture.
2.  Do not add frameworks not listed in the tech stack.
3.  Keep the code modular but simple.
4.  Write runnable code.
5.  Avoid over-engineering.
6.  Use clear naming conventions.

------------------------------------------------------------------------

# 9. Expected Output

Generate:

-   Django backend
-   React frontend
-   REST API endpoints
-   Database models and migrations
-   Authentication system
-   Basic UI pages
-   Setup instructions

The system must run locally with:

Backend

    python manage.py runserver

Frontend

    npm start

------------------------------------------------------------------------

**End Goal:**

A working **minimal prototype** of a **Department of Agrarian Reform
Case Management System**.
