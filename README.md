# Simply 🚀

> A modern SaaS platform for academic similarity checking and Turnitin report management, featuring a Next.js frontend, Express API backend, MongoDB database, and Nginx reverse proxy—fully containerized with Docker and ready for automated deployment to AWS Lightsail.

---

## 🛠️ Tech Stack

### **Frontend (`/frontend`)**
- **Framework:** [Next.js 16](https://nextjs.org/) (App Router)
- **UI & Styling:** [React 19](https://react.dev/), [Tailwind CSS v4](https://tailwindcss.com/), [Lucide Icons](https://lucide.dev/)
- **Language:** [TypeScript](https://www.typescriptlang.org/)

### **Backend (`/backend`)**
- **Runtime & Framework:** [Node.js](https://nodejs.org/), [Express.js](https://expressjs.com/)
- **Database & ORM:** [MongoDB](https://www.mongodb.com/), [Mongoose](https://mongoosejs.com/)
- **Authentication:** JWT (JSON Web Tokens), `bcryptjs` password hashing

### **Infrastructure & DevOps**
- **Orchestration:** [Docker](https://www.docker.com/) & Docker Compose
- **Reverse Proxy:** [Nginx](https://www.nginx.com/)
- **CI/CD:** [GitHub Actions](https://github.com/features/actions)
- **Hosting:** [AWS Lightsail](https://aws.amazon.com/lightsail/) (Ubuntu 22.04 LTS)

---

## ✨ Features

- 🎨 **Modern Landing & Marketing Pages:** Clean, responsive UI with pricing packages, how-it-works guide, blog, and legal pages.
- 🔒 **User Authentication:** Complete user registration, login, and JWT-backed authentication.
- 👑 **Admin Portal:** Dedicated admin dashboard, user stats, and management routes (`/admin/login`, `/admin/dashboard`).
- 🐳 **Microservice Architecture:** Decoupled frontend, API server, database, and Nginx proxy configured in `docker-compose.yml`.
- ⚡ **Production-Ready CI/CD:** Automatic SSH deployment to AWS Lightsail triggered on push to `main`.

---

## 📁 Repository Structure

```text
simply/
├── backend/                  # Node.js Express API service
│   ├── src/
│   │   ├── config/           # Database configuration (MongoDB connection)
│   │   ├── middleware/       # Auth & Admin JWT verification middleware
│   │   ├── models/           # Mongoose schemas (User model)
│   │   ├── routes/           # API routes (/api/auth, /api/admin)
│   │   └── index.js          # Express app entry point
│   ├── .env.example          # Environment variable template for backend
│   └── Dockerfile            # Production Docker container setup for backend
│
├── frontend/                 # Next.js 16 Web application
│   ├── src/
│   │   ├── app/              # App router pages (Landing, Auth, Admin, Packages)
│   │   └── components/       # Shared UI components (Navbar, Footer, etc.)
│   ├── .env.example          # Environment variable template for frontend
│   └── Dockerfile            # Multi-stage production build Dockerfile for Next.js
│
├── .github/
│   └── workflows/
│       └── deploy.yml        # GitHub Actions CI/CD pipeline for AWS Lightsail
│
├── docker-compose.yml        # Production Docker Compose orchestration file
├── nginx.conf                # Reverse proxy config routing /api to backend & / to frontend
├── .env.example              # Root environment configuration template
└── README.md                 # Project documentation
```

---

## 🛠️ Development & Production Environments

Detailed instructions can be found in [ENVIRONMENT_SETUP.md](file:///d:/Project/simply/ENVIRONMENT_SETUP.md).

### 🧪 1. Local Development Mode

#### Option A: Local Node / npm (Fastest for Development)
```bash
# Terminal 1: Backend API (http://localhost:5000)
npm run dev:backend

# Terminal 2: Frontend App (http://localhost:3000)
npm run dev:frontend
```

#### Option B: Docker Development Stack (With Hot-Reload)
```bash
# Launch Dev Stack (Frontend: 3000, Backend: 5000, Mongo: 27017)
npm run dev:docker

# Stop Dev Stack
npm run dev:docker:down
```

---

### 🌐 2. Production Environment Mode

```bash
# 1. Copy production env template
cp .env.production.example .env

# 2. Start full production stack (Nginx, Let's Encrypt SSL, Next.js, Express, MongoDB)
npm run prod:docker

# 3. View live production logs
npm run prod:docker:logs

# 4. Stop production stack
npm run prod:docker:down
```

---

## 🔐 Environment Variables

The codebase provides separate environment configurations for Development and Production:

| Environment | Config File | Purpose |
| :--- | :--- | :--- |
| **Development** | `.env.development` | Preset defaults for `http://localhost:3000` & `http://localhost:5000` |
| **Production Template** | `.env.production.example` | Template for domain name, SSL, and production secrets |
| **Overview Guide** | `.env.example` | High-level instructions for OAuth and env variables |


## 📡 API Endpoints Summary

### Authentication Routes (`/api/auth`)
- `POST /api/auth/register` — Register a new user account
- `POST /api/auth/login` — User login & JWT token generation
- `GET /api/auth/me` — Retrieve current authenticated user profile *(Requires JWT)*

### Admin Routes (`/api/admin`)
- `POST /api/admin/login` — Admin authentication & token issuance
- `GET /api/admin/users` — Fetch list of registered users *(Requires Admin JWT)*
- `GET /api/admin/stats` — System analytics and dashboard counters *(Requires Admin JWT)*

### Health Check
- `GET /health` — API service health status

---

## ☁️ Deployment (AWS Lightsail + GitHub Actions)

This project features automated deployment via **GitHub Actions** to **AWS Lightsail**.

### GitHub Repository Secrets Required
Set up the following secrets in **Settings → Secrets and variables → Actions**:

| Secret Name | Description |
| :--- | :--- |
| `LIGHTSAIL_HOST` | Static IP address of your AWS Lightsail server |
| `LIGHTSAIL_USERNAME` | SSH username (default: `ubuntu`) |
| `LIGHTSAIL_SSH_KEY` | Private SSH key authorized in `~/.ssh/authorized_keys` |

When code is pushed to the `main` branch, `.github/workflows/deploy.yml` automatically SSHs into Lightsail, pulls the latest code, and builds/restarts the Docker containers.

---

## 📜 License

This project is open-source and available under the [MIT License](LICENSE).