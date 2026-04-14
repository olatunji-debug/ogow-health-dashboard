# Ogow Health — EPI Weekly Performance Dashboard

Production dashboard for monitoring health facility performance across weekly EPI reporting periods.

## Features
- **Trend View**: From/To period analysis with performance trend charts, top defaulters heat rank, density map
- **Weekly View**: Single-week facility snapshot with color-coded status cards and historical sparklines
- **Live Google Sheets Sync**: Pull latest data from the connected spreadsheet
- **Composite Follow-up Table**: Filterable, exportable table with last 3 weeks status trajectory
- **Three-Headed Density Map**: High/Low/Inactive density percentages per facility

## Data Source
Connected to Google Sheets: [EPI Weekly Health Facility Performance Tracker](https://docs.google.com/spreadsheets/d/10K0WRDFZs7rAOFJaVnn2xpwu2eGbWNej0-4II1K7EXk/edit)

## Deployment
This site is deployed on **Netlify** via GitHub auto-deploy.

- Push to `main` branch → Netlify auto-builds and deploys
- No build step required — single HTML file with embedded data
- CDN dependencies: ECharts, ag-Grid (loaded from jsdelivr CDN)

## Stack
- Single-file HTML with embedded CSS + JavaScript
- [ECharts](https://echarts.apache.org/) — charts and donut visualizations
- [ag-Grid Community](https://www.ag-grid.com/) — data tables with sorting, filtering, export
- Google Sheets CSV API — live data sync
- Inter font (Google Fonts)
