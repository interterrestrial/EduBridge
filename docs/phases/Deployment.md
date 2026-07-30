# Deployment — Implementation Guide

**Status: ✅ Code changes applied, ready to deploy**

---

## Stack

| Component | Platform | URL Pattern |
|---|---|---|
| Frontend (Next.js) | Vercel | `https://edubridge-xxx.vercel.app` |
| Backend (Express.js) | Render Web Service | `https://edubridge-server.onrender.com` |
| Database | Render PostgreSQL | Internal connection string |

---

## Code Changes Already Applied

All production code changes have been applied to the codebase:

| File | Change Applied |
|---|---|
| `server/prisma/schema.prisma` | `provider = "postgresql"` ✅ |
| `server/package.json` | Added `"start"` script, `"build": "prisma generate && tsc"`, moved `prisma` to dependencies ✅ |
| `server/src/app.ts` | CORS restricted to `CLIENT_URL` env var ✅ |
| `server/src/config/ai.config.ts` | `VECTOR_DB_DIR` reads from env var ✅ |
| `server/src/middleware/upload.middleware.ts` | `UPLOAD_DIR` reads from env var ✅ |
| `client/src/lib/api.ts` | `baseURL` reads from `NEXT_PUBLIC_API_URL` ✅ |
| `client/.env.example` | Created ✅ |

---

## Build Output

- `npm run build` (in `server/`) compiles to `dist/`
- Start command: `node dist/server.js`
- TypeScript compiles with zero errors

---

## Environment Variables

### Render (Backend)

| Variable | Value |
|---|---|
| `NODE_ENV` | `production` |
| `PORT` | *(Render sets automatically)* |
| `DATABASE_URL` | *(Render PostgreSQL Internal URL)* |
| `JWT_SECRET` | *(long random string — `openssl rand -hex 32`)* |
| `GEMINI_API_KEY` | *(from Google AI Studio)* |
| `OAUTH_ID` | *(Google OAuth Client ID)* |
| `CLIENT_URL` | `https://your-app.vercel.app` |
| `UPLOAD_DIR` | `/data/uploads` *(if Persistent Disk added)* |
| `VECTOR_DB_DIR` | `/data/vector_db` *(if Persistent Disk added)* |

### Vercel (Frontend)

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_API_URL` | `https://edubridge-server.onrender.com/api` |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | *(Google OAuth Client ID)* |

---

## Render Build Settings

- **Root Directory**: `server`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`
- **Instance Type**: Free

## Vercel Build Settings

- **Root Directory**: `client`
- **Framework**: Next.js (auto-detected)
- **Build Command**: `next build` (default)

---

## Post-Deploy Database Setup

`npm start` runs `prisma db push` before starting the API, so a deployment with
a valid `DATABASE_URL` creates or updates the PostgreSQL schema automatically.
If that step fails, the deploy fails and Render logs identify the database
configuration problem instead of serving API requests that all return 500.

---

## Known Limits (Free Tier)

| Issue | Details |
|---|---|
| Render cold starts | Server sleeps after 15 min inactivity; first request takes ~30s |
| File upload persistence | Ephemeral disk — files lost on redeploy without Persistent Disk addon ($7/mo) |
| FAISS index persistence | Same as file uploads — ephemeral without Persistent Disk |
| Render PostgreSQL | Free for 90 days, 1 GB limit |
