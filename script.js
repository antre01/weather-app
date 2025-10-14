const cityInput = document.querySelector(".city-input");
const searchBtn = document.querySelector(".search-button");

const weatherInfoSection = document.querySelector(".weather-info");
const notFoundSection = document.querySelector(".not-found");
const searchCitySection = document.querySelector(".search");

const cityTxt = document.querySelector(".city");
const coordinatesTxt = document.querySelector(".coordinates-value");
const currentDateTxt = document.querySelector(".date");
const currentTimeTxt = document.querySelector(".time");
const weatherImg = document.querySelector(".weather-image");
const tempTxt = document.querySelector(".temp");
const conditionTxt = document.querySelector(".condition");
const feelsLikeTxt = document.querySelector(".feels-like-temp-value");
const pressureTxt = document.querySelector(".pressure-value");
const humidityValueTxt = document.querySelector(".humidity-value");
const windValueTxt = document.querySelector(".wind-value");
const visibilityTxt = document.querySelector(".visibility-value");

const minTempTxt = document.querySelector(".min-temp-value");
const maxTempTxt = document.querySelector(".max-temp-value");

const forecastItemContainer = document.querySelector(
  ".forecast-items-container"
);

searchBtn.addEventListener("click", () => {
  if (cityInput.value.trim() != "") {
    updateWeatherInfo(cityInput.value);
    cityInput.value = "";
    cityInput.blur();
  }
});

cityInput.addEventListener("keydown", (event) => {
  if (event.key == "Enter" && cityInput.value.trim() != "") {
    updateWeatherInfo(cityInput.value);
    cityInput.value = "";
    cityInput.blur();
  }
});

// A function that calls the backend instead of the OpenWeatherMap API directly
async function getFetchData(endPoint, city) {
  // WCall to local backend
  const apiUrl = `http://localhost:3000/api/${endPoint}?city=${city}`;

  const response = await fetch(apiUrl);
  return response.json();
}

function getWeatherIcon(id) {
  if (id <= 232) return "thunderstorm.svg";
  if (id <= 321) return "drizzle.svg";
  if (id <= 531) return "rain.svg";
  if (id <= 622) return "snow.svg";
  if (id <= 781) return "atmosphere.svg";
  if (id <= 800) return "clear.svg";
  else return "clouds.svg";
}

function getCurrentDate() {
  const currentDate = new Date();
  const options = {
    weekday: "short",
    day: "2-digit",
    month: "short",
  };

  return currentDate.toLocaleDateString("en-GB", options);
}

function getLocalTime(timezoneOffset) {
  const currentTime = new Date();
  const localTime = new Date(currentTime.getTime() + timezoneOffset * 1000);

  return localTime.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  });
}

function getWindDirection(degrees) {
  if (degrees === undefined || degrees === null) return "N/A";

  const directions = [
    "N",
    "NNE",
    "NE",
    "ENE",
    "E",
    "ESE",
    "SE",
    "SSE",
    "S",
    "SSW",
    "SW",
    "WSW",
    "W",
    "WNW",
    "NW",
    "NNW",
  ];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
}

function findTemperatureAtSpecificHour(forecastData, targetHour) {
  const todayDate = new Date().toISOString().split("T")[0];
  let targetEntry = null;
  let minTimeDiff = Infinity;

  forecastData.list.forEach((entry) => {
    if (entry.dt_txt.includes(todayDate)) {
      const entryTime = new Date(entry.dt_txt);
      const entryHour = entryTime.getHours();

      // If find the exact time, return it immediately
      if (entryHour === targetHour) {
        targetEntry = entry;
        minTimeDiff = 0;
        return;
      }

      // If there is no exact time, look for the nearest one
      const timeDiff = Math.abs(entryHour - targetHour);
      if (timeDiff < minTimeDiff) {
        minTimeDiff = timeDiff;
        targetEntry = entry;
      }
    }
  });

  return targetEntry;
}

// Function for getting min/max temperature for today
async function getTodayMaxTemp(city) {
  const forecastData = await getFetchData("forecast", city);

  // Looking for the temperature at 3:00 (min) and 15:00 (max)
  const minTempEntry = findTemperatureAtSpecificHour(forecastData, 3); 
  const maxTempEntry = findTemperatureAtSpecificHour(forecastData, 15);

  return {
    minTemp: minTempEntry ? minTempEntry.main.temp : null,
    maxTemp: maxTempEntry ? maxTempEntry.main.temp : null,
    minTempTime: minTempEntry ? new Date(minTempEntry.dt_txt).getHours() : null,
    maxTempTime: maxTempEntry ? new Date(maxTempEntry.dt_txt).getHours() : null,
  };
}

async function updateWeatherInfo(city) {
  const weatherData = await getFetchData("weather", city);
  console.log(weatherData);

  if (weatherData.cod != 200) {
    showDisplaySection(notFoundSection);
    return;
  }

  const {
    name: cityName,
    coord: { lat, lon },
    sys: { country },
    main: { temp, feels_like, pressure, humidity },
    weather: [{ id, main }],
    wind: { speed, deg },
    visibility,
    timezone,
  } = weatherData;

  cityTxt.textContent = `${cityName}, ${country}`;

  const latDirection = lat >= 0 ? "N" : "S";
  const lonDirection = lon >= 0 ? "E" : "W";
  coordinatesTxt.textContent = `${Math.abs(lat).toFixed(
    4
  )}°${latDirection}, ${Math.abs(lon).toFixed(4)}°${lonDirection}`;

  tempTxt.textContent = Math.round(temp) + "°C";
  conditionTxt.textContent = main;
  feelsLikeTxt.textContent = Math.round(feels_like) + "°C";
  pressureTxt.textContent = pressure + " hPa";
  humidityValueTxt.textContent = humidity + "%";
  windValueTxt.textContent =
    Math.round(speed) + " m/s" + " " + getWindDirection(deg);
  visibilityTxt.textContent = (visibility / 1000).toFixed(1) + " km";

  currentDateTxt.textContent = getCurrentDate();
  currentTimeTxt.textContent = `${getLocalTime(timezone)}`;
  weatherImg.src = `assets/weather/${getWeatherIcon(id)}`;

  // Download and display the maximum temperature
  const todayTemps = await getTodayMaxTemp(city);

  // Check whether the maximum temperature is lower than the current one
  let displayMaxTemp = todayTemps.maxTemp;

  if (todayTemps.maxTemp !== null && todayTemps.maxTemp < temp) {
    displayMaxTemp = temp;
  }

  // Display the maximum temperature if the element exists
  if (maxTempTxt && displayMaxTemp !== null) {
    maxTempTxt.textContent = `${Math.round(displayMaxTemp)}°C`;
  }

  await updateForecastInfo(city);
  showDisplaySection(weatherInfoSection);
}

async function updateForecastInfo(city) {
  const forecastsData = await getFetchData("forecast", city);
  const timeTaken = "12:00:00";
  const todayDate = new Date().toISOString().split("T")[0];

  forecastItemContainer.innerHTML = "";
  forecastsData.list.forEach((forecastWeather) => {
    if (
      forecastWeather.dt_txt.includes(timeTaken) &&
      !forecastWeather.dt_txt.includes(todayDate)
    ) {
      updateForecastItems(forecastWeather);
    }
  });
}

function updateForecastItems(weatherData) {
  console.log(weatherData);
  const {
    dt_txt: date,
    weather: [{ id }],
    main: { temp },
  } = weatherData;

  const dateTaken = new Date(date);
  const dateOption = {
    day: "2-digit",
    month: "short",
  };
  const dateResult = dateTaken.toLocaleDateString("en-US", dateOption);

  const forecastItem = `
      <div class="forecast-item">
        <h5 class="forecast-date">${dateResult}</h5>
        <img src="assets/weather/${getWeatherIcon(
          id
        )}" alt="" class="forecast-img">
        <h5 class="forecast temp">${Math.round(temp)} °C</h5>
      </div>
    `;

  forecastItemContainer.insertAdjacentHTML("beforeend", forecastItem);
}

function showDisplaySection(section) {
  [weatherInfoSection, searchCitySection, notFoundSection].forEach(
    (section) => (section.style.display = "none")
  );

  section.style.display = "block";
}