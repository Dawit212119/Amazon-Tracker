# Amazon Product Price Tracker - Project Description

## Overview (30 seconds)

This is a full-stack web application that monitors Amazon product prices in real-time. Users can search for products, scrape their current prices and ratings, track historical price changes, and receive alerts when prices drop significantly.

---

## Core Functionality (2 minutes)

### 1. **Web Scraping Engine**

- **Technology**: Node.js with Axios and Cheerio
- **Features**:
  - Scrapes Amazon search results based on user-provided keywords
  - Extracts product data: ASIN, title, price, rating, and product images
  - Implements anti-bot measures: randomized user agents, delays, retry logic with exponential backoff
  - Handles Amazon's 503 errors and rate limiting gracefully

### 2. **Backend Architecture**

- **Stack**: Node.js + Express.js + PostgreSQL
- **Architecture**: MVC pattern with service layer and modular routes
- **Key Components**:
  - RESTful JSON APIs for all operations
  - ETL processor for data cleaning and validation
  - Scheduled jobs using node-cron (hourly automatic scraping)
  - Manual refresh endpoint with real-time progress tracking
  - Database migrations for schema management

### 3. **Database Design**

- **Schema**:
  - `products` table: Stores current product information (ASIN, title, price, rating, image_url, timestamp)
  - `product_history` table: Maintains historical snapshots for price trend analysis
- **Features**:
  - Upsert logic for avoiding duplicates
  - Indexed queries for performance
  - Proper data types (DECIMAL for prices, TIMESTAMP for tracking)

### 4. **Frontend Features**

- **Stack**: React + Vite + Tailwind CSS + Chart.js
- **Pages**:
  1. **Dashboard**: Overview statistics (total products, average price, average rating, total tracked)
  2. **Products**: Search and filter products with real-time scraping capability
  3. **Trends**: Interactive charts showing price and rating changes over time
  4. **Top Drops**: Lists products with significant price drops (5%+) and new products
- **UX Features**:
  - Real-time data updates without page blinking (stale-while-revalidate pattern)
  - Auto-refresh every 3-5 seconds
  - Responsive design for mobile and desktop
  - Loading states and error handling

---

## Technical Approach (3 minutes)

### 1. **Problem-Solving Strategy**

- **Challenge 1**: Amazon's anti-bot protection

  - **Solution**: Implemented rotating user agents, randomized delays (2-5 seconds), exponential backoff retry logic, and proper HTTP headers

- **Challenge 2**: Real-time updates without UI flicker

  - **Solution**: Implemented stale-while-revalidate pattern using ASIN-based reconciliation, merging new data into existing list without full re-render

- **Challenge 3**: User-driven scraping vs automated
  - **Solution**: Made keywords mandatory from user input, no default keywords. Scraping only triggered via "Search & Scrape" button to respect Amazon's rate limits

### 2. **Architecture Decisions**

- **Why PostgreSQL?**: Robust for time-series data (product history), supports complex queries for analytics
- **Why MVC + Service Layer?**: Separation of concerns - controllers handle HTTP, services handle business logic, database layer handles data access
- **Why Polling over WebSockets?**: Simpler to implement, works with stateless REST APIs, sufficient for 3-5 second update intervals

### 3. **Data Flow**

```
User Input → Frontend → API Request → ETL Service → Scraper
                                    ↓
Database ← Data Validation ← Product Data
                                    ↓
Frontend ← API Response ← Database Query
```

### 4. **Key Features Implementation**

- **Progress Tracking**: Job-based system with unique IDs, stores progress in-memory, polled by frontend every 2 seconds
- **Price Alerts**: SQL query to find products with >5% price drop in last 24 hours
- **Historical Trends**: Chart.js line charts with dual Y-axes for price and rating
- **Image Handling**: Multiple selector fallbacks, URL cleaning (removing size parameters), error handling for broken images

---

## Advanced Features (2 minutes)

### 1. **Price Alerts System**

- Detects price drops greater than 5%
- Categorizes products as "new" vs "existing" for better UX
- Shows percent change and previous/current prices

### 2. **Historical Analysis**

- Tracks all price changes over time
- Visual representation with interactive charts
- Supports comparing multiple products

### 3. **Real-time Synchronization**

- Background auto-refresh updates data seamlessly
- No page reload or data flicker
- Optimistic UI updates with reconciliation

### 4. **Error Handling & Resilience**

- Retry logic for network failures
- Graceful degradation when scraping fails
- User-friendly error messages

---

## Technologies & Tools (30 seconds)

**Backend:**

- Node.js, Express.js
- PostgreSQL with pg library
- Axios, Cheerio for scraping
- node-cron for scheduling
- Winston for logging

**Frontend:**

- React (Vite)
- Tailwind CSS
- Chart.js / react-chartjs-2
- Axios for API calls

**DevOps:**

- Docker & Docker Compose (optional)
- Environment variables (.env)
- Database migrations

---

## Key Highlights for Interview (1 minute)

1. **Full-Stack Proficiency**: Built complete system from database to UI
2. **Problem Solving**: Overcame Amazon's anti-bot measures with smart strategies
3. **User Experience**: Implemented advanced patterns (stale-while-revalidate) for smooth UX
4. **Scalable Architecture**: Modular code, proper separation of concerns
5. **Real-World Application**: Solves actual problem (price tracking) with production-ready features

---

## Future Enhancements (30 seconds)

- Email notifications for price alerts
- Redis caching for improved performance
- Category-based analysis and filtering
- Support for multiple e-commerce platforms (eBay, Best Buy)
- User authentication and personalized watchlists
- API rate limiting and request queuing

---

## Demo Flow (if asked)

1. Show Dashboard with statistics
2. Search for a product (e.g., "laptop") and click "Search & Scrape"
3. Demonstrate real-time progress updates during scraping
4. Show Products page with filters
5. Navigate to Trends page and display price history chart
6. Show Top Drops page with price alerts

---

**Total Time: 7-10 minutes**

This project demonstrates:

- Full-stack development skills
- API design and integration
- Database design and optimization
- Web scraping and data processing
- Real-time UI updates
- Error handling and resilience
- User experience design
