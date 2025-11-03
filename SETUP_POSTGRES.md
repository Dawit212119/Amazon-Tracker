# 📦 PostgreSQL Setup Guide (Windows)

## Quick Installation

### Step 1: Download & Install

1. Go to: https://www.postgresql.org/download/windows/
2. Click "Download the installer"
3. Run the installer:
   - Choose installation directory (default is fine)
   - Select components: **PostgreSQL Server**, **pgAdmin 4**, **Command Line Tools**
   - Data directory: default is fine
   - **Password**: Set to `postgres` (or remember what you set)
   - Port: `5432` (default)
   - Locale: default

### Step 2: Create Database

**Method 1: Using pgAdmin (GUI)**

1. Open **pgAdmin 4** from Start Menu
2. Connect to server (enter your password)
3. Right-click "Databases" → "Create" → "Database"
4. Name: `amazon_tracker`
5. Click "Save"

**Method 2: Using Command Line**

1. Open PowerShell as Administrator
2. Navigate to PostgreSQL bin directory (usually):
   ```powershell
   cd "C:\Program Files\PostgreSQL\15\bin"
   ```
   (Replace `15` with your PostgreSQL version)
3. Create database:
   ```powershell
   .\psql.exe -U postgres
   # Enter password when prompted
   CREATE DATABASE amazon_tracker;
   \q
   ```

### Step 3: Update Backend Configuration

If you used a password other than `postgres`, create `backend/.env`:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=amazon_tracker
DB_USER=postgres
DB_PASSWORD=YOUR_PASSWORD_HERE
PORT=5000
NODE_ENV=development
SCRAPER_KEYWORDS=laptop,headphones,smartwatch,phone,tablet
SCRAPER_DELAY_MIN=2000
SCRAPER_DELAY_MAX=5000
SCRAPER_MAX_PAGES=3
CRON_SCHEDULE=0 * * * *
FRONTEND_URL=http://localhost:3000
```

### Step 4: Run Migrations

```powershell
cd backend
npm run migrate
```

You should see: `Migrations completed successfully`

### Step 5: Restart Backend

If the backend PowerShell window showed errors, close it and restart:

```powershell
cd backend
npm run dev
```

## ✅ Verify Setup

1. Check backend health: http://localhost:5000/health
2. Should show: `{"status":"healthy","database":"connected"}`

## 🆘 Common Issues

**"pg_isready: command not found"**

- PostgreSQL might not be in PATH
- Try using full path: `"C:\Program Files\PostgreSQL\15\bin\psql.exe"`

**"Password authentication failed"**

- Check your password in `backend/.env`
- Default PostgreSQL password is what you set during installation

**"Database does not exist"**

- Make sure you created `amazon_tracker` database
- Check in pgAdmin: Databases → amazon_tracker should exist

**Port 5432 already in use**

- Another PostgreSQL instance might be running
- Check Windows Services for "postgresql" service

