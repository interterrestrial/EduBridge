# 🛡️ Authorization

This document defines the authorization strategy for **EduBridge**.

While authentication verifies **who a user is**, authorization determines **what a user is allowed to do**.

EduBridge implements **Role-Based Access Control (RBAC)** to ensure students and teachers can only access resources appropriate to their role.

---

# 🎯 Objectives

The authorization system is designed to:

- Protect sensitive resources
- Prevent unauthorized access
- Separate student and teacher functionality
- Secure APIs
- Simplify permission management

---

# 🏗️ Authorization Model

EduBridge currently supports two roles:

```text
User
 │
 ├──────────── Student
 │
 └──────────── Teacher
```

Future roles may include:

- Admin
- Parent
- Teaching Assistant

---

# 🔑 Authorization Flow

```text
Incoming Request
        │
        ▼
JWT Authentication
        │
        ▼
Extract User
        │
        ▼
Read User Role
        │
        ▼
Permission Check
        │
  ┌─────┴─────┐
  ▼           ▼
Allowed     Denied
  │           │
  ▼           ▼
Continue   403 Forbidden
```

---

# 👨‍🎓 Student Permissions

Students can:

- View own dashboard
- Upload notes
- Chat with AI
- Generate quizzes
- Generate flashcards
- View own analytics
- Update own profile

Students cannot:

- View other students
- Access teacher dashboard
- View classroom analytics
- Modify teacher resources

---

# 👨‍🏫 Teacher Permissions

Teachers can:

- View teacher dashboard
- View classroom analytics
- View student reports
- View AI recommendations
- Update own profile

Teachers cannot:

- Access another teacher's private data
- Modify student credentials
- Access admin resources

---

# 🔒 Protected Routes

## Student Routes

```text
/dashboard
/upload
/chat
/flashcards
/quizzes
/progress
/profile
```

---

## Teacher Routes

```text
/teacher/dashboard
/teacher/students
/teacher/analytics
/teacher/reports
/profile
```

---

# 📦 Middleware Flow

```text
API Request
      │
      ▼
Authenticate JWT
      │
      ▼
Verify Token
      │
      ▼
Read Role
      │
      ▼
Permission Check
      │
      ▼
Controller
```

---

# 📂 Backend Structure

```text
server/
│
├── middleware/
│   ├── authenticate.ts
│   ├── authorize.ts
│   └── roles.ts
│
├── controllers/
├── routes/
└── services/
```

---

# 🧩 Role Middleware Example

Student-only endpoint

```text
GET /api/student/progress

↓

authenticate()

↓

authorize("student")

↓

Controller
```

Teacher-only endpoint

```text
GET /api/teacher/analytics

↓

authenticate()

↓

authorize("teacher")

↓

Controller
```

---

# 🔑 Route Access Matrix

| Feature | Student | Teacher |
|----------|:-------:|:-------:|
| Register/Login | ✅ | ✅ |
| Update Profile | ✅ | ✅ |
| Upload Notes | ✅ | ❌ |
| AI Tutor | ✅ | ❌ |
| Generate Quiz | ✅ | ❌ |
| Generate Flashcards | ✅ | ❌ |
| View Progress | ✅ | ❌ |
| View Student Reports | ❌ | ✅ |
| Teacher Dashboard | ❌ | ✅ |
| Classroom Analytics | ❌ | ✅ |
| AI Recommendations | ❌ | ✅ |

---

# 🚫 Authorization Errors

Possible responses:

- **401 Unauthorized** – User is not authenticated.
- **403 Forbidden** – User is authenticated but lacks permission.
- **404 Not Found** – Resource does not exist.

---

# 🔐 Security Considerations

- Never trust frontend role checks.
- Validate permissions on every protected API.
- Use JWT middleware before authorization.
- Prevent horizontal privilege escalation.
- Prevent access to another user's resources.
- Log unauthorized access attempts (Future).

---

# 🚀 Future Enhancements

- Fine-Grained Permissions
- Classroom Ownership
- Admin Dashboard
- Permission Groups
- Audit Logs
- Multi-Tenant Organizations

---

# 📋 Deliverables

- ✅ Role-Based Access Control (RBAC)
- ✅ Student Permissions
- ✅ Teacher Permissions
- ✅ Protected Routes
- ✅ Authorization Middleware
- ✅ Route Access Matrix
- ✅ Security Guidelines

---

## 📌 Document Status

**Status:** ✅ Completed