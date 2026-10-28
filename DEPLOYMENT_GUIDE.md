# 🚀 SAMAGRA — Cloud Deployment Guide (Render + Vercel)

This guide walks you through deploying the **SAMAGRA** full-stack system online using **Render** (for Backend API & PostgreSQL Database) and **Vercel** (for the Next.js Web Admin Portal). Both platforms offer free tiers suitable for production demos and evaluation.

---

## 🏗️ Architecture Overview

```
                      ┌────────────────────────────┐
                      │    Vercel (Next.js 16)     │
                      │      Web Admin Portal      │
                      │  https://your-admin.vercel.app  │
                      └─────────────┬──────────────┘
                                    │ NEXT_PUBLIC_API_URL
                                    ▼
                      ┌────────────────────────────┐
                      │      Render Web Service    │
                      │     (Node.js / Express)    │
                      │ https://school-erp-backend.onrender.com │
                      └─────────────┬──────────────┘
                                    │ DATABASE_URL (SSL)
                                    ▼
                      ┌────────────────────────────┐
                      │    Managed PostgreSQL      │
                      │   (Render or Neon.tech)    │
                      │ 29 Tables + 8 Migrations   │
                      └────────────────────────────┘
```

---

## Step 1: Push Changes to GitHub

Before deploying, ensure all latest deployment configs (`render.yaml`, `backend/Dockerfile`, build fixes) are committed and pushed to your GitHub repository:

```bash
git add .
git commit -m "feat(deploy): configure cloud deployment for Render and Vercel"
git push origin main
```

---

## Step 2: Deploy Backend & PostgreSQL on Render

You have two convenient options on Render:

### Option A: 1-Click Blueprint (Recommended)
1. Go to [Render Dashboard](https://dashboard.render.com/) and sign in with GitHub.
2. Click **New +** and select **Blueprint**.
3. Connect your repository: `SRIVASTAVAOM/SAAS-Personal` (or `SRIVASTAVAOM/samagra`).
4. Render will automatically read `render.yaml` and configure:
   - **Database**: `school-erp-db` (PostgreSQL)
   - **Web Service**: `school-erp-backend`
   - **Build Command**: `npm install --include=dev && npm run build`
   - **Start Command**: `npm run migrate:prod && npm run seed:prod && npm start`
   - **Health Check**: `/health`
5. Click **Apply**.
6. Render will provision the PostgreSQL instance, run migrations (001–008), seed default users, and launch the API server.
7. Once finished, copy your public backend URL (e.g. `https://school-erp-backend.onrender.com`).

### Option B: Manual Setup on Render
If you prefer setting it up step-by-step:
1. **Create PostgreSQL Database**:
   - In Render Dashboard, click **New +** -> **PostgreSQL**.
   - Name: `school-erp-db`
   - Database: `school_erp_db`
   - Plan: **Free**
   - Click **Create Database**.
   - Once created, copy the **Internal Database URL** (or External if hosting backend elsewhere).
2. **Create Backend Web Service**:
   - In Render Dashboard, click **New +** -> **Web Service**.
   - Connect your GitHub repo `SRIVASTAVAOM/SAAS-Personal` (or `SRIVASTAVAOM/samagra`).
   - Settings:
     - **Root Directory**: `backend`
     - **Runtime**: `Node`
     - **Build Command**: `npm install --include=dev && npm run build`
     - **Start Command**: `npm run migrate:prod && npm run seed:prod && npm start`
     - **Instance Type**: `Free`
   - **Environment Variables**:
     - `NODE_ENV`: `production`
     - `PORT`: `5001`
     - `DATABASE_URL`: *(Paste your PostgreSQL URL from step 1)*
     - `JWT_SECRET`: *(A secure 32+ character random string)*
     - `JWT_EXPIRES_IN`: `8h`
   - Click **Create Web Service**.

---

## Step 3: Deploy Web Admin on Vercel

1. Go to [Vercel Dashboard](https://vercel.com/) and sign in with GitHub.
2. Click **Add New...** -> **Project**.
3. Import the repository: `SRIVASTAVAOM/SAAS-Personal` (or `SRIVASTAVAOM/samagra`).
4. In the Project Configuration:
   - **Framework Preset**: `Next.js`
   - **Root Directory**: Click **Edit** and choose `web-admin`.
5. Under **Environment Variables**, add:
   - **Key**: `NEXT_PUBLIC_API_URL`
   - **Value**: `https://your-backend-name.onrender.com/api/v1` *(Replace with your actual Render backend URL)*
6. Click **Deploy**.
7. In ~60 seconds, your Web Admin dashboard will be live online!

---

## Step 4: Verify Live System & Log In

Once both services are deployed:

### 1. Test Backend Health Check:
Open in browser:
```
https://your-backend-name.onrender.com/health
```
Expected response:
```json
{"status":"ok","timestamp":"2026-10-17T..."}
```

### 2. Log in to Web Admin:
Visit your live Vercel URL (e.g. from your [Vercel Dashboard](https://vercel.com/dashboard) under project `web-admin` -> `https://web-admin-*.vercel.app/login`) and test with seeded credentials:

| Role | Username / Identifier | Password | Access Scope |
| :--- | :--- | :--- | :--- |
| **Management / Super Admin** | `management1` | `Password@123` | Full Admin Command Center, Greensheet Reports, Timetable |
| **Coordinator** | `coordinator1` | `Password@123` | Senior Wing oversight, Academic approvals |
| **Teacher** | `teacher1` | `Password@123` | Grade 10 Section A Class Teacher, Marks & Attendance |
| **Student** | `student1` | `Password@123` | Student Dashboard & Academic Profile |
| **Accountant** | `accountant1` | `Password@123` | Fee collections & Financial reporting |

---

## 🔒 Production Security Best Practices

1. **JWT Secret**: Ensure `JWT_SECRET` in Render is at least 32 characters long.
2. **AWS S3**: To enable real cloud storage for homework and notes uploads, set:
   - `AWS_REGION`: e.g. `ap-south-1`
   - `AWS_S3_BUCKET_NAME`: your S3 bucket name
   - `AWS_ACCESS_KEY_ID`: your AWS IAM access key
   - `AWS_SECRET_ACCESS_KEY`: your AWS IAM secret key
   *(If omitted, the backend automatically uses safe local mock fallback for pre-signed URLs).*
