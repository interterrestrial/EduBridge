# 🔐 Authentication

This document defines the authentication system for **EduBridge**. Authentication is responsible for verifying user identity before granting access to the platform.

EduBridge supports both traditional authentication and OAuth-based authentication to provide a secure and seamless user experience.

---

# 🎯 Objectives

The authentication system is designed to:

- Secure user accounts
- Support multiple login methods
- Protect user credentials
- Provide persistent login sessions
- Enable secure API communication
- Support role-based authentication

---

# 🏗️ Authentication Overview

EduBridge supports two authentication methods:

1. Email & Password Authentication
2. Google OAuth 2.0 Authentication

After successful authentication, the backend generates a JWT access token that is used to access protected APIs.

---

# 🔑 Authentication Flow

```text
              User
                │
                ▼
         Login / Register
                │
      ┌─────────┴─────────┐
      │                   │
      ▼                   ▼
 Email & Password     Google OAuth
      │                   │
      ▼                   ▼
Credential Check   Google Verification
      │                   │
      └─────────┬─────────┘
                ▼
        Create / Find User
                │
                ▼
          Generate JWT
                │
                ▼
      Return Token + User
                │
                ▼
       Redirect Dashboard
```

---

# 👤 Registration Flow

```text
Register
     │
     ▼
Enter Name
Email
Password
Role
     │
     ▼
Validate Input
     │
     ▼
Check Existing User
     │
     ▼
Hash Password
     │
     ▼
Create User
     │
     ▼
Generate JWT
     │
     ▼
Login Successful
```

---

# 🔓 Login Flow

```text
Login
   │
   ▼
Enter Email
Password
   │
   ▼
Find User
   │
   ▼
Compare Password
   │
   ▼
Password Correct?
   │
 ┌─┴───────────┐
 │             │
 ▼             ▼
Yes           No
 │             │
 ▼             ▼
Generate JWT  Error
 │
 ▼
Dashboard
```

---

# 🌐 Google OAuth Flow

```text
Click Continue with Google
            │
            ▼
Redirect to Google
            │
            ▼
User Authentication
            │
            ▼
Google Returns Profile
            │
            ▼
Find Existing User
            │
     ┌──────┴──────┐
     ▼             ▼
 Exists        New User
     │             │
     └──────┬──────┘
            ▼
Generate JWT
            │
            ▼
Dashboard
```

---

# 🔑 JWT Authentication

After successful login, the backend generates a JWT.

Example Payload

```json
{
  "id": "user_id",
  "email": "student@example.com",
  "role": "student"
}
```

The frontend stores the token securely and includes it in every protected API request.

```http
Authorization: Bearer <JWT_TOKEN>
```

---

# 🔒 Password Security

Passwords are never stored in plain text.

Workflow

```text
Password
     │
     ▼
bcrypt Hash
     │
     ▼
Database
```

During login:

```text
Entered Password
       │
       ▼
bcrypt Compare
       │
       ▼
Authentication Result
```

---

# 📦 User Session

A logged-in session contains:

- User ID
- Name
- Email
- Role
- JWT Token

---

# 📂 Authentication APIs

## POST /api/auth/register

Creates a new user account.

---

## POST /api/auth/login

Authenticates using email and password.

---

## POST /api/auth/google

Authenticates using Google OAuth.

---

## GET /api/auth/me

Returns current user information.

---

## POST /api/auth/logout

Logs out the current user.

---

# 📁 Folder Structure

```text
server/
│
├── controllers/
│   └── auth.controller.ts
│
├── routes/
│   └── auth.routes.ts
│
├── middleware/
│   └── authenticate.ts
│
├── services/
│   └── auth.service.ts
│
└── utils/
    ├── jwt.ts
    ├── hash.ts
    └── oauth.ts
```

---

# 🔐 Security Best Practices

- Passwords hashed using bcrypt
- JWT signed using environment secrets
- HTTPS-only communication
- Input validation
- Rate limiting (Future)
- Refresh Tokens (Future)
- Email Verification (Future)
- Password Reset (Future)

---

# 🚀 Future Improvements

- Two-Factor Authentication (2FA)
- Email Verification
- Refresh Tokens
- Session Management
- Device Management
- Login History

---

# 📋 Deliverables

- ✅ Email Authentication
- ✅ Google OAuth
- ✅ JWT Authentication
- ✅ Password Hashing
- ✅ Authentication APIs
- ✅ Session Management
- ✅ Security Practices

---

## 📌 Document Status

**Status:** ✅ Completed