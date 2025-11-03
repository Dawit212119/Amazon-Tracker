# ETL Service Flow Explanation

## What is ETL?

**ETL** stands for **Extract, Transform, Load**:

- **Extract**: Get data from external source (Amazon website)
- **Transform**: Clean, validate, and structure the data
- **Load**: Store data in database

---

## ETL Service Overview

The `ETLService` class orchestrates the entire data pipeline from scraping Amazon to storing products in PostgreSQL.

---

## Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER TRIGGERS SCRAPE                          │
│              (via "Search & Scrape" button)                      │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              refreshController.triggerRefresh()                  │
│  • Validates user-provided keywords                              │
│  • Generates unique Job ID                                       │
│  • Creates progress tracking entry                               │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              ETLService.run(jobId, progressCallback)            │
│                    ↓                                             │
│         ┌──────────────────────────┐                              │
│         │   STEP 1: EXTRACT       │                              │
│         └──────────────────────────┘                              │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              LOOP: For Each Keyword                             │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  keyword = "laptop"                                     │    │
│  │  ┌─────────────────────────────────────────────┐        │    │
│  │  │  LOOP: For Each Page (1 to maxPages)       │        │    │
│  │  │  ┌─────────────────────────────────────┐   │        │    │
│  │  │  │  scraper.scrapeSearchPage()         │   │        │    │
│  │  │  │  • Makes HTTP request to Amazon     │   │        │    │
│  │  │  │  • Parses HTML with Cheerio         │   │        │    │
│  │  │  │  • Extracts product data:           │   │        │    │
│  │  │  │    - ASIN                            │   │        │    │
│  │  │  │    - Title                           │   │        │    │
│  │  │  │    - Price                           │   │        │    │
│  │  │  │    - Rating                          │   │        │    │
│  │  │  │    - Image URL                       │   │        │    │
│  │  │  │  • Returns array of products        │   │        │    │
│  │  │  └─────────────────────────────────────┘   │        │    │
│  │  │          │                                  │        │    │
│  │  │          ▼                                  │        │    │
│  │  │  ┌─────────────────────────────────────┐   │        │    │
│  │  │  │  STEP 2: TRANSFORM & LOAD            │   │        │    │
│  │  │  │  etlService.processProducts()        │   │        │    │
│  │  │  └─────────────────────────────────────┘   │        │    │
│  │  └─────────────────────────────────────────────┘        │    │
│  │          │                                              │    │
│  │          ▼                                              │    │
│  │  Wait 2-5 seconds (anti-bot delay)                     │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
│  Repeat for next keyword...                                     │
└─────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    STEP 2: TRANSFORM (Details)                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  For Each Product:                                       │  │
│  │                                                            │  │
│  │  1. cleanProduct()                                       │  │
│  │     • Trims and normalizes ASIN (uppercase)              │  │
│  │     • Truncates title to 500 chars                        │  │
│  │     • Parses price to float                              │  │
│  │     • Parses rating to float                             │  │
│  │     • Validates:                                          │  │
│  │       - ASIN must be 10 characters                        │  │
│  │       - Title must be at least 5 chars                    │  │
│  │       - Price must be > 0 and < $100,000                  │  │
│  │       - Rating must be 0-5                               │  │
│  │                                                            │  │
│  │  2. Check if product exists in DB                        │  │
│  │     • Get existing product to compare prices              │  │
│  │                                                            │  │
│  │  3. db.upsertProduct()                                   │  │
│  │     • INSERT if new product                               │  │
│  │     • UPDATE if existing product                         │  │
│  │     • Uses PostgreSQL ON CONFLICT clause                 │  │
│  │                                                            │  │
│  │  4. db.insertHistory()                                   │  │
│  │     • Always insert new row in product_history           │  │
│  │     • Creates price/rating snapshot                      │  │
│  │                                                            │  │
│  │  5. Log price changes                                     │  │
│  │     • Calculate percent change                            │  │
│  │     • Log if price changed                                │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    STEP 3: PROGRESS TRACKING                     │
│  • Updates progressTracker with:                                │
│    - Current keyword                                            │
│    - Current page                                               │
│    - Products scraped count                                      │
│    - Products processed count                                    │
│    - Errors count                                                │
│  • Frontend polls /api/refresh/progress/:jobId                  │
│    every 2 seconds for real-time updates                        │
└─────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    JOB COMPLETION                                │
│  • Logs summary statistics                                       │
│  • Updates progressTracker with final status                    │
│  • Returns result object:                                        │
│    {                                                             │
│      success: true/false,                                        │
│      duration: "123.45s",                                        │
│      processed: 86,                                             │
│      updated: 86,                                               │
│      errors: 0                                                   │
│    }                                                             │
└─────────────────────────────────────────────────────────────────┘
```

---

## Detailed Step-by-Step Flow

### 1. **EXTRACT Phase** (`scraper.scrapeSearchPage()`)

**What happens:**

```
┌─────────────────────────────────────────────────────────┐
│ Input: keyword="laptop", page=1                         │
├─────────────────────────────────────────────────────────┤
│ 1. Build Amazon search URL                              │
│    https://www.amazon.com/s?k=laptop&page=1            │
│                                                          │
│ 2. Apply anti-bot measures:                             │
│    • Random delay (2-5 seconds)                          │
│    • Random User-Agent header                           │
│    • Proper HTTP headers                                │
│                                                          │
│ 3. Make HTTP GET request (with retry logic)             │
│    • Retries up to 3 times on 503/403 errors            │
│    • Exponential backoff on retries                      │
│                                                          │
│ 4. Parse HTML response with Cheerio                      │
│    • Find product containers                            │
│    • Extract ASIN from href/data attributes              │
│    • Extract title, price, rating, image                │
│                                                          │
│ 5. Return array of product objects:                     │
│    [{                                                    │
│      asin: "B08XYZ123",                                 │
│      title: "Laptop Computer...",                       │
│      price: 1299.99,                                    │
│      rating: 4.5,                                       │
│      image_url: "https://..."                           │
│    }, ...]                                               │
└─────────────────────────────────────────────────────────┘
```

**Anti-Bot Measures:**

- Randomized delays between requests (2-5 seconds)
- Rotating User-Agent strings
- Proper HTTP headers to mimic browser
- Retry logic with exponential backoff
- Respects rate limits

---

### 2. **TRANSFORM Phase** (`cleanProduct()`)

**What happens:**

```
Raw Scraped Data → Cleaned & Validated Data

Input:  { asin: "  b08xyz123  ", title: "Laptop...", price: "$1,299.99", ... }
         ↓
    cleanProduct()
         ↓
Output: { asin: "B08XYZ123", title: "Laptop...", price: 1299.99, ... }
         (normalized, validated, ready for DB)
```

**Validation Rules:**

- ASIN: Must be exactly 10 alphanumeric characters (uppercase)
- Title: Must be at least 5 characters, max 500
- Price: Must be between $0.01 and $100,000
- Rating: Must be between 0 and 5 (optional)
- Invalid products are skipped

---

### 3. **LOAD Phase** (`processProducts()`)

**What happens for each product:**

```
┌─────────────────────────────────────────────────────────┐
│ Product: { asin: "B08XYZ123", price: 1299.99, ... }    │
├─────────────────────────────────────────────────────────┤
│ 1. Check if product exists:                             │
│    existing = db.getProductByAsin("B08XYZ123")         │
│    previousPrice = existing ? existing.price : null     │
│                                                          │
│ 2. UPSERT to products table:                            │
│    INSERT INTO products (...)                           │
│    ON CONFLICT (asin) DO UPDATE ...                     │
│    → Updates current price, title, rating, image       │
│                                                          │
│ 3. INSERT history snapshot:                             │
│    INSERT INTO product_history (asin, price, rating, ts) │
│    → Creates timestamped record for trends              │
│                                                          │
│ 4. Compare prices:                                      │
│    if (previousPrice !== currentPrice)                  │
│      log("Price change: $1299 -> $1199 (-7.7%)")      │
└─────────────────────────────────────────────────────────┘
```

**Database Operations:**

- **Upsert**: Update if exists, insert if new (based on ASIN)
- **History**: Always insert new snapshot (for trend analysis)
- **Logging**: Track price changes for alerts

---

## Real-World Example Flow

**Scenario: User searches for "iPhone 15"**

```
1. User clicks "Search & Scrape" with keyword "iPhone 15"
   ↓
2. POST /api/refresh with { keywords: "iPhone 15" }
   ↓
3. refreshController creates Job ID: "abc-123-def"
   ↓
4. ETLService.run() starts
   ↓
5. EXTRACT: Scrape Amazon for "iPhone 15"
   ├─ Page 1: Found 24 products
   ├─ Page 2: Found 18 products
   └─ Page 3: Found 5 products
   ↓
6. For each page, immediately TRANSFORM & LOAD:
   ├─ Clean and validate each product
   ├─ Check if ASIN exists in DB
   ├─ Upsert to products table
   ├─ Insert history snapshot
   └─ Log price changes
   ↓
7. Progress updates sent to frontend:
   {
     currentKeyword: "iPhone 15",
     currentPage: 2,
     productsProcessed: 42,
     productsUpdated: 42
   }
   ↓
8. Job completes:
   {
     success: true,
     processed: 47,
     updated: 47,
     errors: 0,
     duration: "45.32s"
   }
```

---

## Key Features

### **Streaming Processing**

- Products are processed **page-by-page** (not all at once)
- Immediate feedback to user during scraping
- Lower memory usage

### **Progress Tracking**

- Real-time updates via `progressCallback`
- Frontend polls for updates every 2 seconds
- Shows current keyword, page, and counts

### **Error Handling**

- Invalid products are skipped (not fatal)
- Retry logic for network errors
- Individual product errors don't stop the job

### **Data Integrity**

- Validates all data before insertion
- Uses database transactions (via PostgreSQL)
- Maintains referential integrity

### **History Tracking**

- Every scrape creates a new history entry
- Enables trend analysis and price alerts
- Never loses historical data

---

## Code Locations

- **ETL Service**: `backend/services/etl.js`
- **Scraper**: `backend/services/scraper.js`
- **Database Service**: `backend/services/database.js`
- **Controller**: `backend/controllers/refreshController.js`
- **Progress Tracker**: `backend/utils/progressTracker.js`

---

## Summary

**ETL Service = Orchestrator**

- Coordinates scraping, validation, and storage
- Provides real-time progress updates
- Handles errors gracefully
- Ensures data quality and consistency

**Flow: Extract → Transform → Load → Track Progress**
