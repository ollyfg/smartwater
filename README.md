# Smart Water Tank Monitor

A web application that displays water level data from a water tank, with historical charts and monitoring capabilities.

## Features

- Historical data visualization
- Automatic data collection via scheduled scraping

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9.15.9+

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/ollyfg/smartwater.git
   cd smartwater
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

### Running Locally

For development:

```bash
pnpm dev
```

To build for production:

```bash
pnpm build
```

To preview the production build:

```bash
pnpm preview
```

### Data Collection

The project includes an automated scraper that collects water level data from SmartWater devices and stores it in a local SQLite database.

#### Requirements
- Firebase credentials (stored as environment variables):
  - `SMARTWATER_API_KEY` - Firebase API key
  - `SMARTWATER_USERNAME` - SmartWater account email
  - `SMARTWATER_PASSWORD` - SmartWater account password

#### Running the Scraper
```bash
pnpm scrape
```

#### What It Does
1. Authenticates with SmartWater's Firebase backend
2. Fetches current water levels for all connected tanks
3. Stores the data in `public/tanks.db` with:
   - Tank metadata (ID, name)
   - Water level readings (percentage, timestamp)
4. Handles:
   - New tank discovery
   - Existing tank updates
   - Historical data preservation

#### Scheduled Collection
For regular automated collection:
1. Set up a cron job or scheduled task to run:
```bash
cd /path/to/project && pnpm scrape
```
2. Recommended frequency: Every 1-4 hours depending on your needs

#### Data Structure
The SQLite database contains two tables:
- `tanks` - Tank metadata (id, name)
- `water_levels` - Historical readings (tank_id, level%, timestamp)

Example query to view recent data:
```sql
SELECT t.name, w.level, w.date 
FROM water_levels w
JOIN tanks t ON w.tank = t.id
ORDER BY w.date DESC
LIMIT 10;
```

## Deployment

The project is automatically deployed to GitHub Pages when changes are pushed to the `master` branch.

## Project Structure

- `src/` - Main application source code
  - `components/` - React components
  - `contexts/` - Application contexts
  - `models.ts` - Type definitions
- `bin/scraper/` - Data collection script
- `public/` - Static assets and database

## Technologies Used

- React
- TypeScript
- Chart.js for data visualization
- SQLite for local data storage and retrieval (using sqlite-wasm)
- Vite for build tooling
