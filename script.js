const form = document.getElementById("weather-form");
const cityInput = document.getElementById("city-input");
const message = document.getElementById("message");
const result = document.getElementById("weather-result");
const locationBtn = document.getElementById("location-btn");

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const city = cityInput.value.trim();

  if (!city) {
    showMessage("Please enter a city name.");
    return;
  }

  try {
    setLoading("Searching for city...");

    const geoURL =
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;

    const geoResponse = await fetch(geoURL);

    if (!geoResponse.ok) {
      throw new Error("Unable to search for the city.");
    }

    const geoData = await geoResponse.json();

    if (!geoData.results || geoData.results.length === 0) {
      throw new Error("City not found. Please check the spelling.");
    }

    const place = geoData.results[0];
    const placeName = [place.name, place.admin1, place.country]
      .filter(Boolean)
      .filter((value, index, array) => array.indexOf(value) === index)
      .join(", ");

    await getWeather(place.latitude, place.longitude, placeName);
  } catch (error) {
    showMessage(error.message || "Something went wrong. Please try again.");
  }
});

async function getWeather(latitude, longitude, placeName) {
  try {
    setLoading("Getting weather information...");

    const weatherURL =
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code&timezone=auto`;

    const response = await fetch(weatherURL);

    if (!response.ok) {
      throw new Error("Unable to get weather data. Try again.");
    }

    const data = await response.json();

    if (!data.current) {
      throw new Error("Weather information is unavailable.");
    }

    displayWeather(data.current, placeName);
  } catch (error) {
    showMessage(error.message || "Unable to load weather.");
  }
}

function getWeatherInfo(code) {
  if (code === 0) {
    return { icon: "☀️", text: "Clear Sky", theme: "sunny" };
  }

  if (code === 1) {
    return { icon: "🌤️", text: "Mainly Clear", theme: "sunny" };
  }

  if (code === 2) {
    return { icon: "⛅", text: "Partly Cloudy", theme: "cloudy" };
  }

  if (code === 3 || code === 45 || code === 48) {
    return { icon: "☁️", text: "Cloudy / Foggy", theme: "cloudy" };
  }

  if ([51, 53, 55, 56, 57].includes(code)) {
    return { icon: "🌦️", text: "Drizzle", theme: "rainy" };
  }

  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) {
    return { icon: "🌧️", text: "Rainy", theme: "rainy" };
  }

  if ([71, 73, 75, 77, 85, 86].includes(code)) {
    return { icon: "❄️", text: "Snowy", theme: "snowy" };
  }

  if ([95, 96, 99].includes(code)) {
    return { icon: "⛈️", text: "Thunderstorm", theme: "rainy" };
  }

  return { icon: "🌡️", text: "Unknown Conditions", theme: "cloudy" };
}

function displayWeather(current, placeName) {
  const weather = getWeatherInfo(current.weather_code);

  document.getElementById("city-name").textContent = placeName;
  document.getElementById("weather-icon").textContent = weather.icon;
  document.getElementById("condition").textContent = weather.text;
  document.getElementById("temperature").textContent =
    `${Math.round(current.temperature_2m)}°C`;
  document.getElementById("humidity").textContent =
    `${current.relative_humidity_2m}%`;
  document.getElementById("feels-like").textContent =
    `${Math.round(current.apparent_temperature)}°C`;

  document.body.className =
    current.is_day === 0 ? "night" : weather.theme;

  result.hidden = false;
  message.textContent = "";
}

function setLoading(text) {
  message.textContent = text;
  result.hidden = true;
}

function showMessage(text) {
  message.textContent = text;
  result.hidden = true;
}

// Additional challenge: detect current location
locationBtn.addEventListener("click", () => {
  if (!navigator.geolocation) {
    showMessage("Your browser does not support location detection.");
    return;
  }

  setLoading("Detecting your location...");

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const { latitude, longitude } = position.coords;
      await getWeather(latitude, longitude, "Your Current Location");
    },
    () => {
      showMessage(
        "Location access denied or unavailable. Please allow location access."
      );
    },
    { timeout: 10000 }
  );
});