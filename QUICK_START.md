# ⚡ Quick Start - No Docker

## Current Status

✅ **Backend Server**: Starting on http://localhost:5000  
✅ **Frontend Server**: Starting on http://localhost:3000

## ⚠️ Database Setup Required

The application needs **PostgreSQL** to store product data. You have two options:

### Option A: Install PostgreSQL (Recommended)

1. **Download PostgreSQL**: https://www.postgresql.org/download/windows/

   - Use the Windows installer
   - Remember the password you set (or use `postgres` as default)

2. **Create the database**:

   - Open "pgAdmin" (comes with PostgreSQL)
   - Or use command line:

   ```powershell
   # After installing, open a new PowerShell and run:
   psql -U postgres
   # Then in psql:
   CREATE DATABASE amazon_tracker;
   \q
   ```

3. **Run migrations**:

   ```powershell
   cd backend
   npm run migrate
   ```

4. **Restart backend** (if needed) - check the backend PowerShell window

### Option B: Use PostgreSQL Online (Alternative)

You can use a free PostgreSQL hosting service like:

- **Supabase**: https://supabase.com (free tier)
- **Neon**: https://neon.tech (free tier)
- **ElephantSQL**: https://www.elephantsql.com (free tier)

Then update `backend/.env` with your database connection string.

## 🚀 Access the Application

Once PostgreSQL is set up:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api
- **Health Check**: http://localhost:5000/health

## 📝 Next Steps

1. Open http://localhost:3000 in your browser
2. Click "🔄 Refresh Data" to start scraping Amazon products
3. View products, trends, and price drops!

## 🐛 Troubleshooting

**Backend shows connection error?**

- Make sure PostgreSQL is installed and running
- Check if PostgreSQL service is running in Windows Services
- Verify database credentials in `backend/.env`

**Can't access frontend?**

- Wait a few seconds for Vite to compile
- Check the frontend PowerShell window for errors
- Frontend should be at http://localhost:3000

**Need to restart servers?**

- Close the PowerShell windows
- Run the startup commands again, or use:
  ```powershell
  cd backend
  npm run dev
  ```
  (in one terminal)
  ```powershell
  cd frontend
  npm run dev
  ```
  (in another terminal)
