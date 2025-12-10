# Braintrust Talent Scraper & Viewer

A Next.js application that scrapes talent data from Braintrust API and displays it in a beautiful, searchable interface.

## Features

### Scraper Script
- Scrapes paginated talent data from Braintrust API
- Fetches detailed information for each talent
- Saves data to MongoDB via local API endpoint
- Configurable page range and request delays

### Web Application
- **Search**: Search talents by name, title, or location
- **Filters**: Filter by role (Design, Engineering, Product, etc.)
- **Multiple View Modes**:
  - Table view: Compact tabular display
  - List view: Detailed list with avatars
  - Grid view: Card grid layout
  - Card view: Rich card display with full details
- **Pagination**: Navigate through large datasets
- **Dark Mode**: Automatic dark mode support

## Setup

### Prerequisites
- Node.js 18+ installed
- MongoDB running locally or MongoDB Atlas connection string

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up MongoDB connection:
   - Create a `.env.local` file in the root directory
   - Add your MongoDB connection string:
   ```
   MONGODB_URI=mongodb://localhost:27017/braintrust
   ```
   Or for MongoDB Atlas:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/braintrust
   ```

3. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Usage

### Running the Scraper

To scrape talent data, first make sure the Next.js server is running, then:

```bash
npm run scrape
```

Or with custom page range:
```bash
node scraper.js 1 10
```

This will scrape pages 1 to 10. The script will:
1. Fetch the list of talents from each page
2. Get detailed information for each talent
3. Save each talent to MongoDB via the `/api/talent` PUT endpoint

### Configuration

Edit `scraper.js` to customize:
- `START_PAGE`: Starting page number (default: 1)
- `END_PAGE`: Ending page number (default: 10)
- `DELAY_MS`: Delay between requests in milliseconds (default: 1000)

### API Endpoints

- `PUT /api/talent`: Save or update talent data
- `GET /api/talent`: Fetch talents with pagination, search, and filters
  - Query parameters:
    - `page`: Page number (default: 1)
    - `limit`: Items per page (default: 20)
    - `search`: Search query
    - `role`: Filter by role name

## Project Structure

```
braintrust/
├── app/
│   ├── api/
│   │   └── talent/
│   │       └── route.ts      # API routes for talent CRUD
│   ├── page.tsx              # Main UI component
│   └── layout.tsx            # Root layout
├── lib/
│   └── mongodb.ts            # MongoDB connection utility
├── scraper.js                # Scraping script
└── package.json
```

## Technologies

- **Next.js 16**: React framework
- **MongoDB**: Database
- **TypeScript**: Type safety
- **Tailwind CSS**: Styling
- **React 19**: UI library

## Notes

- The scraper includes delays between requests to be respectful to the API
- Make sure MongoDB is running before starting the scraper
- The UI automatically debounces search input for better performance
- All view modes are responsive and work on mobile devices
