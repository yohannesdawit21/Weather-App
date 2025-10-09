import React, { useEffect, useRef, useState } from 'react'
import './Weather.css'
import clear_icon from '../assets/clear.png'
import cloud_icon from '../assets/cloud.png'
import drizzle_icon from '../assets/drizzle.png'
import rain_icon from '../assets/rain.png'
import snow_icon from '../assets/snow.png'
import wind_icon from '../assets/wind.png'
import humidity_icon from '../assets/humidity.png'

const Weather = () => {
  const inputRef = useRef();
  const [weatherData, setWeatherData] = useState(null);

  const allIcons = {
    "01d": clear_icon, "01n": clear_icon,
    "02d": cloud_icon, "02n": cloud_icon,
    "03d": cloud_icon, "03n": cloud_icon,
    "04d": cloud_icon, "04n": cloud_icon,
    "09d": drizzle_icon, "09n": drizzle_icon,
    "10d": rain_icon, "10n": rain_icon,
    "11d": rain_icon, "11n": rain_icon,
    "13d": snow_icon, "13n": snow_icon,
    "50d": cloud_icon, "50n": cloud_icon,
  };

  // 🔹 Search by city name
  const search = async (city) => {
    if (city === "") {
      alert("Please enter a city name");
      return;
    }
    try {
      const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${import.meta.env.VITE_APP_ID}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.cod !== 200) {
        setWeatherData(false);
        alert("City not found");
        return;
      }

      updateWeather(data);
    } catch (error) {
      console.error("Error fetching city weather:", error);
      setWeatherData(false);
      alert("Something went wrong. Try again!");
    }
  };

  // 🔹 Search by coordinates
  const searchByCoords = async (lat, lon) => {
    try {
      const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${import.meta.env.VITE_APP_ID}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.cod !== 200) {
        setWeatherData(false);
        return;
      }

      updateWeather(data);
    } catch (error) {
      console.error("Error fetching location weather:", error);
    }
  };

  // 🔹 Extract weather info and set state
  const updateWeather = (data) => {
    const code = data.weather?.[0]?.icon?.toLowerCase() || "01d";
    const icon = allIcons[code] || clear_icon;

    setWeatherData({
      humidity: data.main.humidity,
      windSpeed: data.wind.speed,
      temperature: Math.floor(data.main.temp),
      location: data.name,
      icon: icon,
      code: code
    });
  };

  // 🔹 On first load → detect location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          searchByCoords(latitude, longitude);
        },
        (err) => {
          console.warn("Geolocation denied, fallback to London:", err);
          search("London"); // fallback
        }
      );
    } else {
      search("London"); // fallback
    }
  }, []);

  return (
    <div className="weather-container">
      {/* === Animated Background Elements === */}
      <div className="cloud"></div>
      <div className="cloud" style={{ top: "25%", animationDelay: "10s" }}></div>

      <div className="sun"></div>

      {/* Snow Animation */}
      {weatherData && weatherData.code?.startsWith("13") && (
        <div className="snowfall">
          {Array.from({ length: 15 }).map((_, i) => (
            <div key={i} className="snow"></div>
          ))}
        </div>
      )}

      {/* === Weather Card === */}
      <div className='Weather'>
        <div className="search-bar">
          <input
            ref={inputRef}
            type="text"
            placeholder="City ex. Addis Ababa"
            onKeyDown={(e) => e.key === "Enter" && search(inputRef.current.value)}
          />
          <button onClick={() => search(inputRef.current.value)}>Search</button>
        </div>

        {weatherData ? (
          <>
            <img src={weatherData.icon} alt="weather-icon" className='weather-icon' />
            <p className='temperature'>{weatherData.temperature}°C</p>
            <p className='location'>{weatherData.location}</p>
            <div className="weather-data">
              <div className="col">
                <img src={humidity_icon} alt="humidity" />
                <div>
                  <p>{weatherData.humidity}%</p>
                  <p>Humidity</p>
                </div>
              </div>
              <div className="col">
                <img src={wind_icon} alt="wind" />
                <div>
                  <p>{weatherData.windSpeed} m/s</p>
                  <p>Wind Speed</p>
                </div>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  )
}

export default Weather
