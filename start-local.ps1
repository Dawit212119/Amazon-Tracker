# Amazon Price Tracker - Local Startup Script
Write-Host "🚀 Starting Amazon Price Tracker..." -ForegroundColor Cyan

# Check if PostgreSQL is running (optional check)
Write-Host "📦 Note: Make sure PostgreSQL is running on localhost:5432" -ForegroundColor Yellow
Write-Host "   Database: amazon_tracker, User: postgres, Password: postgres" -ForegroundColor Yellow
Write-Host ""

# Run database migrations
Write-Host "🔄 Running database migrations..." -ForegroundColor Cyan
cd backend
node scripts/migrate.js
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Migration failed. Please check your PostgreSQL connection." -ForegroundColor Red
    exit 1
}
cd ..

Write-Host "✅ Migrations complete!" -ForegroundColor Green
Write-Host ""

# Start backend server (in background)
Write-Host "🔧 Starting backend server on port 5000..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; npm run dev"
Start-Sleep -Seconds 3

# Start frontend server (in background)
Write-Host "🎨 Starting frontend server on port 3000..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"
Start-Sleep -Seconds 2

Write-Host ""
Write-Host "✅ Application is starting up!" -ForegroundColor Green
Write-Host "📊 Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "🔌 Backend API: http://localhost:5000/api" -ForegroundColor Cyan
Write-Host "💚 Health Check: http://localhost:5000/health" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop all servers" -ForegroundColor Yellow

