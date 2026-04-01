import { useEffect, useMemo, useState } from 'react'
import './Weather.css'
import clearIcon from '../assets/clear.png'
import cloudIcon from '../assets/cloud.png'
import drizzleIcon from '../assets/drizzle.png'
import rainIcon from '../assets/rain.png'
import snowIcon from '../assets/snow.png'
import windIcon from '../assets/wind.png'
import humidityIcon from '../assets/humidity.png'

const iconMap = {
  '01d': clearIcon,
  '01n': clearIcon,
  '02d': cloudIcon,
  '02n': cloudIcon,
  '03d': cloudIcon,
  '03n': cloudIcon,
  '04d': cloudIcon,
  '04n': cloudIcon,
  '09d': drizzleIcon,
  '09n': drizzleIcon,
  '10d': rainIcon,
  '10n': rainIcon,
  '11d': rainIcon,
  '11n': rainIcon,
  '13d': snowIcon,
  '13n': snowIcon,
  '50d': cloudIcon,
  '50n': cloudIcon,
}

const formatTimezoneDate = (timestamp, options) =>
  new Intl.DateTimeFormat('en-US', {
    ...options,
    timeZone: 'UTC',
  }).format(timestamp)

const createTimeString = (timezoneOffset, options) => {
  const shiftedDate = new Date(Date.now() + timezoneOffset * 1000)

  return formatTimezoneDate(shiftedDate, options)
}

const createUnixTimeString = (unixTimestamp, timezoneOffset, options) => {
  const shiftedDate = new Date((unixTimestamp + timezoneOffset) * 1000)

  return formatTimezoneDate(shiftedDate, options)
}

const getSceneConfig = (iconCode = '01d') => {
  const normalizedCode = iconCode.toLowerCase()
  const weatherFamily = normalizedCode.slice(0, 2)
  const isNight = normalizedCode.endsWith('n')
  const baseScene = {
    className: isNight ? 'scene-clear-night' : 'scene-clear-day',
    headline: isNight ? 'Quiet night sky' : 'Bright open sky',
    helper: isNight ? 'Stable conditions with calm visibility.' : 'Clear air and soft daylight.',
    cloudCount: isNight ? 2 : 3,
    starCount: isNight ? 18 : 0,
    rainCount: 0,
    snowCount: 0,
    mistBands: 0,
    showLightning: false,
    showSun: !isNight,
    showMoon: isNight,
  }

  switch (weatherFamily) {
    case '02':
    case '03':
    case '04':
      return {
        ...baseScene,
        className: isNight ? 'scene-clouds-night' : 'scene-clouds-day',
        headline: 'Layered cloud cover',
        helper: 'Clouds are moving across the skyline.',
        cloudCount: 5,
      }
    case '09':
      return {
        ...baseScene,
        className: isNight ? 'scene-drizzle-night' : 'scene-drizzle-day',
        headline: 'Light drizzle in motion',
        helper: 'Soft rain bands and dense clouds across the scene.',
        cloudCount: 5,
        rainCount: 26,
      }
    case '10':
      return {
        ...baseScene,
        className: isNight ? 'scene-rain-night' : 'scene-rain-day',
        headline: 'Active rainfall',
        helper: 'Steady rain with stronger cloud movement.',
        cloudCount: 6,
        rainCount: 38,
      }
    case '11':
      return {
        ...baseScene,
        className: isNight ? 'scene-storm-night' : 'scene-storm-day',
        headline: 'Storm front nearby',
        helper: 'Heavy clouds, rain streaks, and lightning flashes.',
        cloudCount: 7,
        rainCount: 46,
        showLightning: true,
      }
    case '13':
      return {
        ...baseScene,
        className: isNight ? 'scene-snow-night' : 'scene-snow-day',
        headline: 'Snowfall across the city',
        helper: 'Cold air, soft flakes, and frosted light.',
        cloudCount: 5,
        snowCount: 28,
      }
    case '50':
      return {
        ...baseScene,
        className: isNight ? 'scene-mist-night' : 'scene-mist-day',
        headline: 'Mist in the atmosphere',
        helper: 'Visibility is reduced by fog and suspended moisture.',
        cloudCount: 4,
        mistBands: 4,
      }
    default:
      return baseScene
  }
}

const Weather = () => {
  const [query, setQuery] = useState('')
  const [weatherData, setWeatherData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  const scene = useMemo(
    () => getSceneConfig(weatherData?.code),
    [weatherData?.code],
  )

  const updateWeather = (data) => {
    const code = data.weather?.[0]?.icon?.toLowerCase() || '01d'

    setWeatherData({
      code,
      icon: iconMap[code] || clearIcon,
      temperature: Math.round(data.main.temp),
      feelsLike: Math.round(data.main.feels_like),
      humidity: data.main.humidity,
      windSpeed: data.wind.speed.toFixed(1),
      visibility: (data.visibility / 1000).toFixed(1),
      pressure: data.main.pressure,
      clouds: data.clouds?.all ?? 0,
      description: data.weather?.[0]?.description ?? 'Clear sky',
      location: data.name,
      country: data.sys?.country ?? '',
      timezone: data.timezone ?? 0,
      sunrise: data.sys?.sunrise ?? 0,
      sunset: data.sys?.sunset ?? 0,
    })
    setQuery(data.name)
    setErrorMessage('')
  }

  const fetchWeather = async ({ city, lat, lon }) => {
    const apiKey = import.meta.env.VITE_APP_ID

    if (!apiKey) {
      setErrorMessage('Weather API key is missing. Add VITE_APP_ID to your environment.')
      setIsLoading(false)
      return
    }

    const baseUrl = 'https://api.openweathermap.org/data/2.5/weather'
    const searchParams = new URLSearchParams({
      units: 'metric',
      appid: apiKey,
    })

    if (city) {
      searchParams.set('q', city)
    } else if (typeof lat === 'number' && typeof lon === 'number') {
      searchParams.set('lat', lat)
      searchParams.set('lon', lon)
    } else {
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch(`${baseUrl}?${searchParams.toString()}`)
      const data = await response.json()

      if (Number(data.cod) !== 200) {
        setErrorMessage(city ? 'City not found. Try another search.' : 'Unable to load weather for your location.')
        return
      }

      updateWeather(data)
    } catch (error) {
      console.error('Error fetching weather data:', error)
      setErrorMessage('Something went wrong while loading the weather.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCitySearch = async (event) => {
    event.preventDefault()

    const trimmedQuery = query.trim()
    if (!trimmedQuery) {
      setErrorMessage('Please enter a city name.')
      return
    }

    await fetchWeather({ city: trimmedQuery })
  }

  const requestCurrentLocation = () => {
    if (!navigator.geolocation) {
      fetchWeather({ city: 'London' })
      return
    }

    setErrorMessage('')
    setIsLoading(true)

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        fetchWeather({ lat: coords.latitude, lon: coords.longitude })
      },
      (error) => {
        console.warn('Geolocation unavailable, falling back to London.', error)
        setErrorMessage('Location access denied. Showing London instead.')
        fetchWeather({ city: 'London' })
      },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  useEffect(() => {
    requestCurrentLocation()
  }, [])

  const localTime = weatherData
    ? createTimeString(weatherData.timezone, {
        hour: 'numeric',
        minute: '2-digit',
      })
    : '--:--'

  const localDate = weatherData
    ? createTimeString(weatherData.timezone, {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
      })
    : 'Weather overview'

  const sunriseTime = weatherData
    ? createUnixTimeString(weatherData.sunrise, weatherData.timezone, {
        hour: 'numeric',
        minute: '2-digit',
      })
    : '--'

  const sunsetTime = weatherData
    ? createUnixTimeString(weatherData.sunset, weatherData.timezone, {
        hour: 'numeric',
        minute: '2-digit',
      })
    : '--'

  return (
    <section className={`weather-scene ${scene.className}`}>
      <div className="scene-gradient" />
      <div className="scene-glow scene-glow-left" />
      <div className="scene-glow scene-glow-right" />

      {scene.showSun && <div className="celestial-body sun" />}
      {scene.showMoon && <div className="celestial-body moon" />}

      {scene.starCount > 0 && (
        <div className="stars-layer" aria-hidden="true">
          {Array.from({ length: scene.starCount }).map((_, index) => (
            <span
              key={`star-${index}`}
              className="star"
              style={{
                '--star-left': `${(index * 11) % 100}%`,
                '--star-top': `${10 + ((index * 17) % 35)}%`,
                '--star-delay': `${(index % 6) * 0.6}s`,
              }}
            />
          ))}
        </div>
      )}

      <div className="cloud-layer cloud-layer-back" aria-hidden="true">
        {Array.from({ length: Math.max(2, scene.cloudCount - 2) }).map((_, index) => (
          <span
            key={`back-cloud-${index}`}
            className="cloud cloud-small"
            style={{
              '--cloud-top': `${12 + index * 11}%`,
              '--cloud-width': `${120 + index * 26}px`,
              '--cloud-height': `${52 + index * 6}px`,
              '--cloud-duration': `${32 + index * 5}s`,
              '--cloud-delay': `-${index * 7}s`,
            }}
          />
        ))}
      </div>

      <div className="cloud-layer cloud-layer-front" aria-hidden="true">
        {Array.from({ length: scene.cloudCount }).map((_, index) => (
          <span
            key={`front-cloud-${index}`}
            className="cloud"
            style={{
              '--cloud-top': `${18 + ((index * 9) % 42)}%`,
              '--cloud-width': `${140 + (index % 3) * 34}px`,
              '--cloud-height': `${58 + (index % 4) * 8}px`,
              '--cloud-duration': `${24 + index * 4}s`,
              '--cloud-delay': `-${index * 5}s`,
            }}
          />
        ))}
      </div>

      {scene.mistBands > 0 && (
        <div className="mist-layer" aria-hidden="true">
          {Array.from({ length: scene.mistBands }).map((_, index) => (
            <span
              key={`mist-${index}`}
              className="mist-band"
              style={{
                '--mist-top': `${24 + index * 14}%`,
                '--mist-delay': `${index * 1.6}s`,
              }}
            />
          ))}
        </div>
      )}

      {scene.rainCount > 0 && (
        <div className="precipitation rain-layer" aria-hidden="true">
          {Array.from({ length: scene.rainCount }).map((_, index) => (
            <span
              key={`rain-${index}`}
              className="rain-drop"
              style={{
                '--drop-left': `${(index * 7) % 100}%`,
                '--drop-delay': `${(index % 8) * 0.25}s`,
                '--drop-duration': `${0.9 + (index % 5) * 0.12}s`,
              }}
            />
          ))}
        </div>
      )}

      {scene.snowCount > 0 && (
        <div className="precipitation snow-layer" aria-hidden="true">
          {Array.from({ length: scene.snowCount }).map((_, index) => (
            <span
              key={`snow-${index}`}
              className="snow-flake"
              style={{
                '--flake-left': `${(index * 9) % 100}%`,
                '--flake-delay': `${(index % 9) * 0.45}s`,
                '--flake-duration': `${5 + (index % 6) * 0.7}s`,
              }}
            />
          ))}
        </div>
      )}

      {scene.showLightning && (
        <div className="lightning-layer" aria-hidden="true">
          <span className="lightning-flash" />
          <span className="lightning-bolt" />
        </div>
      )}

      <div className="weather-shell">
        <div className={`weather-card ${isLoading ? 'is-loading' : ''}`}>
          <div className="weather-card__header">
            <div>
              <p className="eyebrow">Real-time conditions</p>
              <h1>{weatherData ? `${weatherData.location}, ${weatherData.country}` : 'Weather Motion UI'}</h1>
            </div>
            <div className="time-chip">
              <span>{localTime}</span>
              <small>{localDate}</small>
            </div>
          </div>

          <form className="search-panel" onSubmit={handleCitySearch}>
            <label className="search-input">
              <span className="sr-only">Search city</span>
              <input
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search city, e.g. Addis Ababa"
              />
            </label>

            <div className="search-actions">
              <button type="submit" className="primary-button" disabled={isLoading}>
                {isLoading ? 'Loading...' : 'Search'}
              </button>
              <button
                type="button"
                className="ghost-button"
                onClick={requestCurrentLocation}
                disabled={isLoading}
              >
                My location
              </button>
            </div>
          </form>

          {errorMessage && <p className="status-message">{errorMessage}</p>}

          <div className="hero-panel">
            <div className="hero-copy">
              <p className="hero-copy__label">{scene.headline}</p>
              <p className="hero-copy__text">{scene.helper}</p>
            </div>
            {weatherData && (
              <div className="condition-pill">
                <span>{weatherData.description}</span>
                <strong>{weatherData.clouds}% clouds</strong>
              </div>
            )}
          </div>

          {weatherData ? (
            <>
              <div className="weather-main">
                <div className="temperature-block">
                  <img src={weatherData.icon} alt={weatherData.description} className="weather-icon" />
                  <div>
                    <p className="temperature">{weatherData.temperature}°</p>
                    <p className="temperature-meta">Feels like {weatherData.feelsLike}°C</p>
                  </div>
                </div>

                <div className="forecast-card">
                  <p>Sunrise</p>
                  <strong>{sunriseTime}</strong>
                  <p>Sunset</p>
                  <strong>{sunsetTime}</strong>
                </div>
              </div>

              <div className="weather-metrics">
                <article className="metric-card">
                  <img src={humidityIcon} alt="Humidity icon" />
                  <div>
                    <span>Humidity</span>
                    <strong>{weatherData.humidity}%</strong>
                  </div>
                </article>

                <article className="metric-card">
                  <img src={windIcon} alt="Wind icon" />
                  <div>
                    <span>Wind speed</span>
                    <strong>{weatherData.windSpeed} m/s</strong>
                  </div>
                </article>

                <article className="metric-card">
                  <div className="metric-card__badge">VIS</div>
                  <div>
                    <span>Visibility</span>
                    <strong>{weatherData.visibility} km</strong>
                  </div>
                </article>

                <article className="metric-card">
                  <div className="metric-card__badge">AIR</div>
                  <div>
                    <span>Pressure</span>
                    <strong>{weatherData.pressure} hPa</strong>
                  </div>
                </article>
              </div>
            </>
          ) : (
            <div className="empty-state">
              <p>Search for a city or use your current location to load live weather visuals.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

export default Weather
