# 🛒 Amazon Product Price Tracker

A full-stack web application that tracks Amazon product prices, ratings, and historical trends. Features automated scraping, data processing, and an interactive dashboard.

## 🏗️ Architecture

- **Backend**: Node.js + Express.js + PostgreSQL
- **Frontend**: React + Vite + Tailwind CSS + Chart.js
- **Scheduler**: node-cron for automated ETL jobs
- **Scraping**: Axios + Cheerio for Amazon product data
- **Containerization**: Docker Compose

## ✨ Features

- 🔄 **Automated Scraping**: Scheduled hourly ETL jobs to fetch product data
- 📊 **Real-time Dashboard**: Overview stats and product listings
- 📈 **Price Trends**: Interactive charts showing price and rating history
- 🔔 **Price Alerts**: Automatic detection of price drops >5%
- 🔍 **Filtering & Search**: Find products by keyword, price range, and rating
- 📱 **Responsive Design**: Works on mobile and desktop
- 🐳 **Dockerized**: Complete container setup for easy deployment

## 📁 Project Structure

```
.
├── backend/
│   ├── server.js              # Express server entry point
│   ├── routes/                # API route handlers
│   ├── controllers/           # Request controllers
│   ├── services/              # Business logic (scraper, ETL, database)
│   ├── jobs/                  # Scheduled jobs (cron)
│   ├── utils/                 # Utilities (db, logger)
│   ├── scripts/               # Migration scripts
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── pages/             # React pages (Dashboard, Products, Trends, etc.)
│   │   ├── components/        # Reusable components
│   │   ├── hooks/             # Custom React hooks
│   │   └── services/          # API service layer
│   └── Dockerfile
└── docker-compose.yml         # Docker orchestration

```

## 🚀 Quick Start

### Prerequisites

- Docker and Docker Compose installed
- Git (for cloning)

### Step 1: Clone and Setup

```bash
# Navigate to project directory
cd 80

# Copy environment template (optional - Docker Compose sets defaults)
# cp backend/.env.example backend/.env
```

### Step 2: Start Services

```bash
# Start all services (backend, frontend, database)
docker-compose up --build
```

This will:

- Start PostgreSQL database
- Run database migrations
- Start Express backend on port 5000
- Start React frontend on port 3000

### Step 3: Access Application

- **Frontend Dashboard**: http://localhost:3000
- **Backend API**: http://localhost:5000/api
- **Health Check**: http://localhost:5000/health

### Step 4: Trigger Initial Scrape

1. Go to the Dashboard (http://localhost:3000)
2. Click the "🔄 Refresh Data" button
3. Wait for the scraper to fetch products (check backend logs)

## 📡 API Endpoints

### Products

- `GET /api/products` - List all products (limit: 50 by default)
- `GET /api/products/:asin` - Get product details with history
- `GET /api/products/stats/summary` - Get aggregated statistics
- `GET /api/products/alerts/price` - Get price alerts (>5% drops)

### Utilities

- `POST /api/refresh` - Manually trigger ETL job
- `GET /api/top-changes` - Get top price drops (last 24h)
- `GET /api/stats` - Get dashboard statistics
- `GET /health` - Health check endpoint

## 🗄️ Database Schema

### `products` Table

```sql
- id (SERIAL PRIMARY KEY)
- asin (TEXT UNIQUE)
- title (TEXT)
- price (DECIMAL)
- rating (DECIMAL)
- timestamp (TIMESTAMP)
```

### `product_history` Table

```sql
- id (SERIAL PRIMARY KEY)
- asin (TEXT)
- price (DECIMAL)
- rating (DECIMAL)
- timestamp (TIMESTAMP)
```

## ⚙️ Configuration

### Environment Variables

Create `backend/.env` (or use Docker Compose defaults):

```env
# Database
DB_HOST=postgres
DB_PORT=5432
DB_NAME=amazon_tracker
DB_USER=postgres
DB_PASSWORD=postgres

# Server
PORT=5000
NODE_ENV=development

# Scraper
SCRAPER_KEYWORDS=laptop,headphones,smartwatch,phone,tablet
SCRAPER_DELAY_MIN=2000
SCRAPER_DELAY_MAX=5000
SCRAPER_MAX_PAGES=3

# Scheduler (cron format)
CRON_SCHEDULE=0 * * * *  # Every hour

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

### Cron Schedule Format

- `0 * * * *` - Every hour
- `*/30 * * * *` - Every 30 minutes
- `0 0 * * *` - Daily at midnight

## 🔧 Development

### Run Without Docker

#### Backend

```bash
cd backend
npm install
npm run migrate  # Run migrations
npm run dev      # Start server
```

#### Frontend

```bash
cd frontend
npm install
npm run dev      # Start Vite dev server
```

### Database Migrations

```bash
# Via Docker
docker-compose exec backend npm run migrate

# Or locally
cd backend
npm run migrate
```

## 📊 Features Breakdown

### Dashboard

- Total products tracked
- Average price and rating
- Last update timestamp
- Manual refresh button

### Products Page

- Product grid with cards
- Search by title/ASIN
- Filter by price range
- Filter by minimum rating

### Trends Page

- Select any product
- View price history chart
- View rating history chart
- Interactive Chart.js visualizations

### Top Drops Page

- List of biggest price drops (24h)
- Price alerts for drops >5%
- Previous vs current price comparison

## 🛡️ Anti-Blocking Measures

The scraper includes:

- Randomized delays (2-5 seconds)
- Realistic browser headers
- Respectful request rates
- Error handling and retries

**Note**: Amazon may still block requests. For production, consider:

- Using proxy services
- Rotating user agents
- Adding CAPTCHA solving
- Using official Amazon API (if available)

## 🐛 Troubleshooting

### Database Connection Issues

```bash
# Check if PostgreSQL is running
docker-compose ps

# View logs
docker-compose logs postgres
docker-compose logs backend
```

### Scraper Not Working

- Check backend logs: `docker-compose logs backend`
- Verify Amazon is accessible
- Adjust delay settings in `.env`
- Reduce `SCRAPER_MAX_PAGES` if blocked

### Frontend Not Loading

- Verify backend is running: http://localhost:5000/health
- Check browser console for errors
- Verify `VITE_API_URL` in frontend environment

## 📝 Notes

- The scraper fetches live data from Amazon search results
- Data is stored in PostgreSQL with full history
- ETL jobs run automatically via cron scheduler
- All prices are in USD
- ASINs are unique identifiers for Amazon products

## 🚧 Future Enhancements

- Email notifications for price alerts
- User accounts and watchlists
- Category-based analysis
- Redis caching layer
- Webhook integrations
- Export data to CSV/JSON
- Multi-marketplace support (Amazon UK, DE, etc.)

## 📄 License

This project is for educational purposes. Ensure compliance with Amazon's Terms of Service when scraping their website.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

**Built with ❤️ using Node.js, React, and PostgreSQL**

