# 🚀 Local Development Setup Guide

This guide will help you run the Amazon Price Tracker on your local machine without Docker Compose for the full stack.

## Prerequisites

1. **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
2. **PostgreSQL** (v15 or higher) - Choose one option:
   - Install locally: [PostgreSQL Downloads](https://www.postgresql.org/download/)
   - Use Docker (recommended): See "Option 1: Docker for PostgreSQL" below

## Setup Steps

### Option 1: Docker for PostgreSQL Only (Recommended)

If you have Docker installed, you can run just PostgreSQL in a container:

```powershell
# Start PostgreSQL only
docker compose -f docker-compose.db-only.yml up -d

# Check if it's running
docker compose -f docker-compose.db-only.yml ps

# Stop PostgreSQL
docker compose -f docker-compose.db-only.yml down
```

### Option 2: Install PostgreSQL Locally

1. Download and install PostgreSQL from [postgresql.org](https://www.postgresql.org/download/)
2. During installation, remember your password (default will be used: `postgres`)
3. Create the database:

```sql
-- Connect to PostgreSQL using psql or pgAdmin
CREATE DATABASE amazon_tracker;
```

Or use command line:
```powershell
psql -U postgres
CREATE DATABASE amazon_tracker;
\q
```

### Step 2: Configure Environment Variables

The backend already has defaults that work with local PostgreSQL. If your PostgreSQL setup is different, create `backend/.env`:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=amazon_tracker
DB_USER=postgres
DB_PASSWORD=postgres
PORT=5000
NODE_ENV=development
SCRAPER_KEYWORDS=laptop,headphones,smartwatch,phone,tablet
SCRAPER_DELAY_MIN=2000
SCRAPER_DELAY_MAX=5000
SCRAPER_MAX_PAGES=3
CRON_SCHEDULE=0 * * * *
FRONTEND_URL=http://localhost:3000
```

### Step 3: Install Dependencies

```powershell
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### Step 4: Run Database Migrations

```powershell
cd backend
npm run migrate
```

### Step 5: Start the Application

**Terminal 1 - Backend:**
```powershell
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```powershell
cd frontend
npm run dev
```

### Step 6: Access the Application

- **Frontend Dashboard**: http://localhost:3000
- **Backend API**: http://localhost:5000/api
- **Health Check**: http://localhost:5000/health

## Quick Start Script

Alternatively, you can use the PowerShell script:

```powershell
.\start-local.ps1
```

This will:
1. Run database migrations
2. Start backend server in a new window
3. Start frontend server in a new window

## Troubleshooting

### PostgreSQL Connection Error

If you see `ECONNREFUSED`:
- Make sure PostgreSQL is running
- Check if PostgreSQL is on port 5432
- Verify username/password in `backend/.env`

### Port Already in Use

If port 5000 or 3000 is already in use:
- Change `PORT` in `backend/.env` for backend
- Change port in `frontend/vite.config.js` for frontend

### Database Migration Fails

```powershell
# Make sure PostgreSQL is running first
# Then try migration again
cd backend
npm run migrate
```

## Development Tips

1. **Manual Refresh**: Click "🔄 Refresh Data" button in the dashboard to trigger scraper
2. **View Logs**: Backend logs appear in the terminal running `npm run dev`
3. **Hot Reload**: Both frontend and backend support hot reloading on file changes

## Stop the Application

- Press `Ctrl+C` in each terminal window
- If using Docker for PostgreSQL: `docker compose -f docker-compose.db-only.yml down`

