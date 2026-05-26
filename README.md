# SkyCast Weather

`SkyCast Weather` is a polished weather app built with `React` and `Vite`. It fetches live data from the `OpenWeatherMap` API, detects the user's current location, and renders a dynamic animated interface that visually changes for clear skies, clouds, rain, storms, snow, and mist.

## Student Info
- Name: `Yohannes Dawit`
- Group: `G3`
- Track: `Frontend`

## End Product
- Animated real-time weather scenes that react to live weather codes
- Search by city or load weather from the user's current location
- Weather details including temperature, feels-like, humidity, wind speed, visibility, pressure, sunrise, and sunset
- Responsive glassmorphism UI optimized for desktop and mobile
- Production-ready Vercel setup with environment variable guidance

## Tech Stack
- `React 19`
- `Vite`
- Plain `CSS` animations
- `OpenWeatherMap API`
- `Vercel`

## Local Setup
1. Install dependencies:

```bash
npm install
```

2. Create a local environment file:

```bash
cp .env.example .env
```

3. Add your OpenWeather API key in `.env`:

```env
VITE_APP_ID=your_openweathermap_api_key_here
```

4. Start the development server:

```bash
npm run dev
```

## Production Build

```bash
npm run build
```

## Vercel Deployment
1. Push the repository to GitHub.
2. Import the project into [Vercel](https://vercel.com/).
3. In Vercel project settings, add this environment variable:

```env
VITE_APP_ID=your_openweathermap_api_key_here
```

4. Deploy the project.

This repo already includes `vercel.json`, so Vercel knows the framework, install command, build command, and output directory.

## Important Security Note
- Do not commit real API keys to Git.
- If a key was already committed before, rotate it in your OpenWeather dashboard and replace it with a new one in Vercel and your local `.env`.

## Project Structure

```text
src/
  App.jsx
  main.jsx
  index.css
  assets/
  Components/
    Weather.jsx
    Weather.css
public/
  robots.txt
  site.webmanifest
vercel.json
```

## Features
- Current location weather on first load
- City search with cleaner error handling
- Animated day and night scenes
- Weather-state backgrounds for clear, cloudy, mist, drizzle, rain, storm, and snow
- Responsive card layout and live status messaging
- Manifest and metadata for a more complete deployed product

## Future Improvements
- 5-day forecast
- Hourly forecast chart
- Favorite cities
- Unit switching between Celsius and Fahrenheit
- Better branded favicon and social preview image
