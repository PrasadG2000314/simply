# Simply 🚀 Environment Setup & Deployment Guide

This guide details how to work with the **Development Environment** (for local testing and debugging) and the **Production Environment** (for live deployment).

---

## 🏗️ Architectural Overview

| Feature | 🛠️ Development Environment | 🌐 Production Environment |
| :--- | :--- | :--- |
| **Purpose** | Local testing, active code editing & debugging | Live user-facing deployment |
| **Target Host** | `localhost` | AWS Lightsail / VPS / Custom Domain |
| **Frontend URL** | `http://localhost:3000` | `https://yourdomain.com` |
| **Backend URL** | `http://localhost:5000` | Served via Nginx `/api` proxy |
| **Database** | Local MongoDB (`mongodb://localhost:27017/simply_db`) | Docker container or MongoDB Atlas |
| **Compose File** | `docker-compose.dev.yml` | `docker-compose.yml` |
| **Nginx / SSL** | Not required locally | Enabled with Let's Encrypt / Certbot |
| **Hot Reloading** | ✅ Enabled (Nodemon & Next.js HMR) | ❌ Disabled (Standalone production builds) |

---

## 🛠️ 1. Development Environment (Local Testing)

You have **two options** to run the development environment locally:

### Option A: Local Node.js / npm Workflow (Fastest for Code Edits)

#### Prerequisites:
- Node.js v18+ or v20+
- MongoDB running locally on port `27017` (or Docker Mongo)

#### Steps:
1. **Prepare Environment Files**:
   ```bash
   # Root
   cp .env.development .env

   # Backend
   cp backend/.env.development backend/.env

   # Frontend
   cp frontend/.env.development frontend/.env.local
   ```

2. **Start Backend API Server**:
   ```bash
   cd backend
   npm install
   npm run dev
   ```
   *Backend running at `http://localhost:5000`.*

3. **Start Frontend Next.js Server**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   *Frontend running at `http://localhost:3000`.*

> **Tip:** You can also run both backend and frontend from the root folder:
> ```bash
> npm run dev:backend   # In Terminal 1
> npm run dev:frontend  # In Terminal 2
> ```

---

### Option B: Docker Development Stack (Isolated & Zero Local Setup)

Run MongoDB, Express API, and Next.js frontend together with live hot-reloading:

```bash
# Start all dev containers
npm run dev:docker

# Stop dev containers
npm run dev:docker:down
```

- **Frontend:** `http://localhost:3000`
- **Backend API:** `http://localhost:5000/health`
- **MongoDB:** `localhost:27017`

---

## 🌐 2. Production Environment (Deployment)

The production environment is built for security, performance, and reliability using Docker Compose, standalone Next.js builds, and Nginx SSL termination.

### Deployment Steps (AWS Lightsail / VPS / Dedicated Server)

1. **Clone & Configure**:
   ```bash
   git clone https://github.com/PrasadG2000314/simply.git
   cd simply
   ```

2. **Set Production Environment Variables**:
   Create a root `.env` file based on `.env.production.example`:
   ```bash
   cp .env.production.example .env
   ```
   Update `.env` with strong secrets and your actual domain name:
   ```env
   NODE_ENV=production
   JWT_SECRET=super_strong_random_secret_key
   ADMIN_JWT_SECRET=super_strong_admin_secret_key
   ADMIN_PASSWORD=your_secure_admin_password
   FRONTEND_URL=https://yourdomain.com
   NEXT_PUBLIC_API_URL=/api
   ```

3. **Configure Nginx & SSL**:
   - Update `nginx.conf` with your actual domain (`yourdomain.com`).
   - Run `./setup-ssl.sh yourdomain.com admin@yourdomain.com` to issue Let's Encrypt SSL certificates.

4. **Launch Production Stack**:
   ```bash
   npm run prod:docker
   ```

5. **Monitor Logs & Status**:
   ```bash
   npm run prod:docker:logs
   ```

---

## 🚀 3. Automated CI/CD (GitHub Actions)

Pushes to the `main` branch automatically trigger `.github/workflows/deploy.yml`.

### Required GitHub Secrets:
Set up the following under **Repository Settings → Secrets and variables → Actions**:
- `LIGHTSAIL_HOST`: Server IP Address
- `LIGHTSAIL_USERNAME`: `ubuntu`
- `LIGHTSAIL_SSH_KEY`: SSH Private Key

---

## 🧪 4. Troubleshooting & Helpful Commands

- **Check API Health (Local):** `http://localhost:5000/health` or `http://localhost:3000/health`
- **Check MongoDB Logs:** `docker compose -f docker-compose.dev.yml logs db`
- **Reset Development Database:**
  ```bash
  docker compose -f docker-compose.dev.yml down -v
  ```
