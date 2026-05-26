import { useCallback, useEffect, useMemo, useState } from 'react'
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

const createTimeString = (timezoneOffset, options) =>
  formatTimezoneDate(new Date(Date.now() + timezoneOffset * 1000), options)

const createUnixTimeString = (unixTimestamp, timezoneOffset, options) =>
  formatTimezoneDate(new Date((unixTimestamp + timezoneOffset) * 1000), options)

const createDateKey = (unixTimestamp, timezoneOffset) =>
  new Date((unixTimestamp + timezoneOffset) * 1000).toISOString().slice(0, 10)

const getWeatherDetails = (weatherEntry) => {
  const code = weatherEntry?.icon?.toLowerCase() || '01d'

  return {
    code,
    icon: iconMap[code] || clearIcon,
    description: weatherEntry?.description ?? 'Clear sky',
  }
}

const getSceneConfig = (iconCode = '01d') => {
  const normalizedCode = iconCode.toLowerCase()
  const weatherFamily = normalizedCode.slice(0, 2)
  const isNight = normalizedCode.endsWith('n')
  const baseScene = {
    className: isNight ? 'scene-clear-night' : 'scene-clear-day',
    headline: isNight ? 'Quiet night atmosphere' : 'Bright and airy forecast',
    helper: isNight
      ? 'A calm, cinematic night interface inspired by the iPhone weather app.'
      : 'A softer glassmorphism forecast screen with real-time motion.',
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
        helper: 'Dense clouds and soft depth make the forecast feel more alive.',
        cloudCount: 5,
      }
    case '09':
      return {
        ...baseScene,
        className: isNight ? 'scene-drizzle-night' : 'scene-drizzle-day',
        headline: 'Light rain in motion',
        helper: 'Thin rain streaks and moving clouds across the whole view.',
        cloudCount: 5,
        rainCount: 26,
      }
    case '10':
      return {
        ...baseScene,
        className: isNight ? 'scene-rain-night' : 'scene-rain-day',
        headline: 'Steady rainfall',
        helper: 'A deeper gradient and stronger atmospheric movement.',
        cloudCount: 6,
        rainCount: 38,
      }
    case '11':
      return {
        ...baseScene,
        className: isNight ? 'scene-storm-night' : 'scene-storm-day',
        headline: 'Storm conditions',
        helper: 'Lightning flashes and heavier rain drive the mood.',
        cloudCount: 7,
        rainCount: 46,
        showLightning: true,
      }
    case '13':
      return {
        ...baseScene,
        className: isNight ? 'scene-snow-night' : 'scene-snow-day',
        headline: 'Snowfall through the day',
        helper: 'Soft flakes, frosted light, and a cleaner winter palette.',
        cloudCount: 5,
        snowCount: 28,
      }
    case '50':
      return {
        ...baseScene,
        className: isNight ? 'scene-mist-night' : 'scene-mist-day',
        headline: 'Mist and reduced visibility',
        helper: 'Layered fog bands make the whole interface feel atmospheric.',
        cloudCount: 4,
        mistBands: 4,
      }
    default:
      return baseScene
  }
}

const buildHourlyForecast = (currentData, forecastList, timezoneOffset) => {
  const currentWeather = getWeatherDetails(currentData.weather?.[0])
  const upcomingHours = forecastList.slice(0, 7).map((entry) => {
    const details = getWeatherDetails(entry.weather?.[0])

    return {
      label: createUnixTimeString(entry.dt, timezoneOffset, { hour: 'numeric' }),
      temp: Math.round(entry.main.temp),
      rainChance: Math.round((entry.pop ?? 0) * 100),
      icon: details.icon,
      description: details.description,
    }
  })

  return [
    {
      label: 'Now',
      temp: Math.round(currentData.main.temp),
      rainChance: 0,
      icon: currentWeather.icon,
      description: currentWeather.description,
      isNow: true,
    },
    ...upcomingHours,
  ]
}

const buildDailyForecast = (currentData, forecastList, timezoneOffset) => {
  const todayKey = createDateKey(currentData.dt, timezoneOffset)
  const groupedEntries = forecastList.reduce((accumulator, entry) => {
    const key = createDateKey(entry.dt, timezoneOffset)

    if (!accumulator[key]) {
      accumulator[key] = []
    }

    accumulator[key].push(entry)
    return accumulator
  }, {})

  return Object.entries(groupedEntries)
    .filter(([key]) => key !== todayKey)
    .slice(0, 4)
    .map(([key, entries], index) => {
      const middayEntry =
        entries.find((entry) => {
          const hour = Number(createUnixTimeString(entry.dt, timezoneOffset, { hour: 'numeric', hour12: false }))
          return hour >= 12 && hour <= 15
        }) || entries[Math.floor(entries.length / 2)]
      const details = getWeatherDetails(middayEntry.weather?.[0])
      const minTemp = Math.round(Math.min(...entries.map((entry) => entry.main.temp_min)))
      const maxTemp = Math.round(Math.max(...entries.map((entry) => entry.main.temp_max)))
      const rainChance = Math.round(Math.max(...entries.map((entry) => (entry.pop ?? 0) * 100)))

      return {
        key,
        label: index === 0 ? 'Tomorrow' : createUnixTimeString(middayEntry.dt, timezoneOffset, { weekday: 'long' }),
        shortLabel: createUnixTimeString(middayEntry.dt, timezoneOffset, { weekday: 'short' }),
        date: createUnixTimeString(middayEntry.dt, timezoneOffset, { month: 'short', day: 'numeric' }),
        icon: details.icon,
        description: details.description,
        minTemp,
        maxTemp,
        rainChance,
      }
    })
}

const buildTodayRange = (currentData, forecastList, timezoneOffset) => {
  const todayKey = createDateKey(currentData.dt, timezoneOffset)
  const todayEntries = forecastList.filter((entry) => createDateKey(entry.dt, timezoneOffset) === todayKey)
  const temperatures = [
    currentData.main.temp,
    currentData.main.temp_min,
    currentData.main.temp_max,
    ...todayEntries.flatMap((entry) => [entry.main.temp_min, entry.main.temp_max]),
  ]

  return {
    low: Math.round(Math.min(...temperatures)),
    high: Math.round(Math.max(...temperatures)),
  }
}

const Weather = () => {
  const [query, setQuery] = useState('')
  const [weatherData, setWeatherData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  const scene = useMemo(() => getSceneConfig(weatherData?.code), [weatherData?.code])

  const setWeatherPackage = useCallback((currentData, forecastData) => {
    const currentDetails = getWeatherDetails(currentData.weather?.[0])
    const timezoneOffset = currentData.timezone ?? 0
    const forecastList = forecastData.list ?? []
    const hourly = buildHourlyForecast(currentData, forecastList, timezoneOffset)
    const daily = buildDailyForecast(currentData, forecastList, timezoneOffset)
    const todayRange = buildTodayRange(currentData, forecastList, timezoneOffset)

    setWeatherData({
      code: currentDetails.code,
      icon: currentDetails.icon,
      description: currentDetails.description,
      temperature: Math.round(currentData.main.temp),
      feelsLike: Math.round(currentData.main.feels_like),
      humidity: currentData.main.humidity,
      windSpeed: currentData.wind.speed.toFixed(1),
      visibility: (currentData.visibility / 1000).toFixed(1),
      pressure: currentData.main.pressure,
      clouds: currentData.clouds?.all ?? 0,
      location: currentData.name,
      country: currentData.sys?.country ?? '',
      timezone: timezoneOffset,
      sunrise: currentData.sys?.sunrise ?? 0,
      sunset: currentData.sys?.sunset ?? 0,
      low: todayRange.low,
      high: todayRange.high,
      hourly,
      daily,
    })

    setQuery(currentData.name)
    setErrorMessage('')
  }, [])

  const fetchWeather = useCallback(async ({ city, lat, lon }) => {
    const apiKey = import.meta.env.VITE_APP_ID

    if (!apiKey) {
      setErrorMessage('Weather API key is missing. Add VITE_APP_ID to your environment.')
      setIsLoading(false)
      return
    }

    const sharedParams = new URLSearchParams({
      units: 'metric',
      appid: apiKey,
    })

    if (city) {
      sharedParams.set('q', city)
    } else if (typeof lat === 'number' && typeof lon === 'number') {
      sharedParams.set('lat', lat)
      sharedParams.set('lon', lon)
    } else {
      return
    }

    setIsLoading(true)

    try {
      const currentUrl = `https://api.openweathermap.org/data/2.5/weather?${sharedParams.toString()}`
      const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?${sharedParams.toString()}`
      const [currentResponse, forecastResponse] = await Promise.all([
        fetch(currentUrl),
        fetch(forecastUrl),
      ])
      const [currentData, forecastData] = await Promise.all([
        currentResponse.json(),
        forecastResponse.json(),
      ])

      if (Number(currentData.cod) !== 200) {
        setErrorMessage(city ? 'City not found. Try another search.' : 'Unable to load weather for your location.')
        return
      }

      if (Number(forecastData.cod) !== 200) {
        setErrorMessage('Current weather loaded, but forecast is temporarily unavailable.')
        return
      }

      setWeatherPackage(currentData, forecastData)
    } catch (error) {
      console.error('Error fetching weather data:', error)
      setErrorMessage('Something went wrong while loading the weather.')
    } finally {
      setIsLoading(false)
    }
  }, [setWeatherPackage])

  const handleCitySearch = async (event) => {
    event.preventDefault()

    const trimmedQuery = query.trim()
    if (!trimmedQuery) {
      setErrorMessage('Please enter a city name.')
      return
    }

    await fetchWeather({ city: trimmedQuery })
  }

  const requestCurrentLocation = useCallback(() => {
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
  }, [fetchWeather])

  useEffect(() => {
    requestCurrentLocation()
  }, [requestCurrentLocation])

  const localTime = weatherData
    ? createTimeString(weatherData.timezone, { hour: 'numeric', minute: '2-digit' })
    : '--:--'
  const localDate = weatherData
    ? createTimeString(weatherData.timezone, { weekday: 'long', month: 'short', day: 'numeric' })
    : 'Weather overview'
  const sunriseTime = weatherData
    ? createUnixTimeString(weatherData.sunrise, weatherData.timezone, { hour: 'numeric', minute: '2-digit' })
    : '--'
  const sunsetTime = weatherData
    ? createUnixTimeString(weatherData.sunset, weatherData.timezone, { hour: 'numeric', minute: '2-digit' })
    : '--'
  const tomorrowForecast = weatherData?.daily?.[0]

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
        <div className={`weather-card iphone-card ${isLoading ? 'is-loading' : ''}`}>
          <header className="weather-card__header">
            <div>
              <p className="eyebrow">iPhone-style forecast</p>
              <h1>{weatherData ? `${weatherData.location}, ${weatherData.country}` : 'SkyCast Weather'}</h1>
            </div>
            <button type="button" className="location-pill" onClick={requestCurrentLocation} disabled={isLoading}>
              Use my location
            </button>
          </header>

          <form className="search-panel search-panel--iphone" onSubmit={handleCitySearch}>
            <label className="search-input">
              <span className="sr-only">Search city</span>
              <input
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search city like Addis Ababa"
              />
            </label>

            <div className="search-actions">
              <button type="submit" className="primary-button" disabled={isLoading}>
                {isLoading ? 'Loading...' : 'Search'}
              </button>
            </div>
          </form>

          {errorMessage && (
            <p className="status-message" role="status" aria-live="polite">
              {errorMessage}
            </p>
          )}

          {isLoading && (
            <p className="status-message status-message--info" role="status" aria-live="polite">
              Fetching live weather and forecast data...
            </p>
          )}

          <div className="hero-panel hero-panel--iphone">
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
              <section className="summary-panel">
                <div className="summary-main">
                  <p className="summary-location">{weatherData.location}</p>
                  <p className="summary-date">{localDate}</p>
                  <p className="summary-time">{localTime}</p>

                  <div className="summary-temp-row">
                    <img src={weatherData.icon} alt={weatherData.description} className="weather-icon weather-icon--large" />
                    <div>
                      <p className="temperature">{weatherData.temperature}°</p>
                      <p className="temperature-meta temperature-meta--strong">{weatherData.description}</p>
                    </div>
                  </div>

                  <p className="hero-range">
                    H:{weatherData.high}° L:{weatherData.low}° · Feels like {weatherData.feelsLike}°
                  </p>
                </div>

                <div className="summary-side">
                  <article className="mini-glass-card">
                    <span>Sunrise</span>
                    <strong>{sunriseTime}</strong>
                    <span>Sunset</span>
                    <strong>{sunsetTime}</strong>
                  </article>

                  {tomorrowForecast && (
                    <article className="mini-glass-card">
                      <span>Tomorrow</span>
                      <strong>{tomorrowForecast.maxTemp}° / {tomorrowForecast.minTemp}°</strong>
                      <small>{tomorrowForecast.description}</small>
                    </article>
                  )}
                </div>
              </section>

              <section className="glass-section">
                <div className="section-header">
                  <div>
                    <p className="section-eyebrow">Full day hours</p>
                    <h2>Today by hour</h2>
                  </div>
                  <p>Next 24 hours</p>
                </div>

                <div className="hourly-scroll">
                  {weatherData.hourly.map((hour) => (
                    <article key={`${hour.label}-${hour.temp}`} className={`hour-card ${hour.isNow ? 'is-now' : ''}`}>
                      <p>{hour.label}</p>
                      <img src={hour.icon} alt={hour.description} className="hour-card__icon" />
                      <strong>{hour.temp}°</strong>
                      <span>{hour.rainChance}% rain</span>
                    </article>
                  ))}
                </div>
              </section>

              <section className="content-grid">
                <div className="glass-section">
                  <div className="section-header">
                    <div>
                      <p className="section-eyebrow">Current details</p>
                      <h2>Weather metrics</h2>
                    </div>
                  </div>

                  <div className="weather-metrics weather-metrics--compact">
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
                </div>

                <div className="glass-section">
                  <div className="section-header">
                    <div>
                      <p className="section-eyebrow">Separate daily outlook</p>
                      <h2>Next day weather</h2>
                    </div>
                    <p>{weatherData.daily.length} days ahead</p>
                  </div>

                  <div className="daily-list">
                    {weatherData.daily.map((day) => (
                      <article key={day.key} className={`day-card ${day.label === 'Tomorrow' ? 'is-tomorrow' : ''}`}>
                        <div className="day-card__title">
                          <strong>{day.label}</strong>
                          <span>{day.date}</span>
                        </div>
                        <img src={day.icon} alt={day.description} className="day-card__icon" />
                        <div className="day-card__meta">
                          <strong>{day.maxTemp}° / {day.minTemp}°</strong>
                          <span>{day.rainChance}% rain</span>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              </section>
            </>
          ) : (
            <div className="empty-state">
              <p>Search for a city or use your current location to load the redesigned weather experience.</p>
            </div>
          )}

          <footer className="weather-footer">
            <p>Live weather data powered by OpenWeather.</p>
            <p>Hourly timeline and next-day forecast included.</p>
          </footer>
        </div>
      </div>
    </section>
  )
}

export default Weather
