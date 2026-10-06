# FloodGuard - Karnataka Flood Early Warning System

Live project: https://floodguards.netlify.app/

## Project Status
The dashboard provides five independent disaster prediction pages. Each page submits hazard-specific inputs to its corresponding trained model through the Flask prediction service.

## What Works
- Separate flood, earthquake, landslide, cyclone, and drought prediction dashboards
- Hazard-specific inputs, model risk results, session assessment charts, and risk alerts
- Risk classification into `low`, `medium`, and `high`
- Rainfall and weather visual pages
- River and evacuation map pages
- Alerts page UI

## Model Predictions
Each dashboard submits its own parameter set to `/api/disaster-prediction`. The Next.js API route forwards the request to the parent project's Flask endpoint, which runs only the selected disaster model and returns its probability and risk level. These are estimates, not official warnings.

## Main Routes
- `/flood` : flood prediction dashboard
- `/earthquake` : earthquake prediction dashboard
- `/landslide` : landslide prediction dashboard
- `/cyclone` : cyclone prediction dashboard
- `/drought` : drought prediction dashboard
- `/` : redirects to `/flood`
- `/prediction` : redirects to `/flood` for compatibility
- `/rainfall` : rainfall and weather views
- `/rivers` : river monitoring map
- `/evacuation` : evacuation support map
- `/alerts` : alert view

## Tech Stack
- Next.js 14
- React 18
- Tailwind CSS
- Leaflet / React-Leaflet
- Recharts

## Environment Variables
Frontend variables:

```env
NEXT_PUBLIC_OPENWEATHER_API_KEY=your_openweather_key
NEXT_PUBLIC_MAP_API_KEY=optional_map_key
NEXT_PUBLIC_API_TIMEOUT_MS=15000
```

For model predictions, configure the server-side Flask API base URL:

```env
DISASTER_BACKEND_URL=http://127.0.0.1:5000
```

Notes:
- `NEXT_PUBLIC_OPENWEATHER_API_KEY` is used by rainfall/weather pages.
- `DISASTER_BACKEND_URL` points to the parent project's Flask service and must be reachable by the Next.js server.

## Local Development
```bash
npm install
npm run dev
```

Run the parent project's `start-dashboard.ps1` to start both the Next.js frontend and Flask prediction service. Running `npm run dev` alone starts only the frontend, so model predictions will remain unavailable until Flask is running. For a separately hosted Flask API, set `DISASTER_BACKEND_URL` to its base URL.

Production build:
```bash
npm run build
```

## Deployment
Hosted on Netlify:
- Build command: `npm ci && npm run build`
- Publish directory: `.next`
- Node version: `20`
- Configure `DISASTER_BACKEND_URL` to a reachable Flask deployment to enable predictions.

## Screenshots

### Home / Dashboard
![Dashboard](Pictures/Dashboard.png)
### Rainfall View
![Rainfall](Pictures/Rainfall_Monitoring.png)

### Rivers / Maps
![Rivers](Pictures/River_Monitoring.png)

### Bot Alert
![Bot Alert](Pictures/Bot_Alert.jpeg)

### Prediction Page
![Prediction](Pictures/Flood_Prediction1.png)
![Prediction](Pictures/Flood_Prediction2.png)

### Alerts / Warnings
![Alerts](Pictures/Alerts_&_Warnings.png)

## Repository Notes
- There is only one README file in this repository: `README.md`.
- Legacy backend and integration documents are kept in the repo for reference.

