# Smart Water Tank Monitor

A web application that displays water level data from a water tank, with historical charts and monitoring capabilities.

## Features

- Real-time water level monitoring
- Historical data visualization
- Responsive design for mobile and desktop
- Automatic data collection via scheduled scraping

## Getting Started

### Prerequisites
- Node.js 20+
- pnpm 9.15.9+

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/smartwater.git
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
The project includes a scraper that collects water level data:
```bash
pnpm scrape
```

## Deployment
The project is automatically deployed to GitHub Pages when changes are pushed to the `master` branch.

## Project Structure
- `src/` - Main application source code
  - `components/` - React components
  - `contexts/` - Application contexts
  - `models.ts` - Type definitions
- `bin/scraper/` - Data collection scripts
- `public/` - Static assets and database

## Technologies Used
- React
- TypeScript
- Chart.js for data visualization
- SQLite for local data storage
- Vite for build tooling
