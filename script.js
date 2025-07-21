const API_BASE = "https://currentirrigation.onrender.com/api";
const METEO_API = "https://api.open-meteo.com/v1/forecast?latitude=8.4966&longitude=4.5421&hourly=soil_moisture_3_to_9cm,precipitation_probability&current=temperature_2m,relative_humidity_2m&timezone=auto";

async function fetchSensorData() {
  try {
    const [dhtRes, moistureRes, pumpRes] = await Promise.all([
      fetch(`${API_BASE}/sensors/dht`),
      fetch(`${API_BASE}/sensors/moisture`),
      fetch(`${API_BASE}/pump/status`)
    ]);

    const dht = await dhtRes.json();
    const moisture = await moistureRes.json();
    const pump = await pumpRes.json();

    document.getElementById("temp").textContent = `🌡️ Temperature: ${dht.temperature} °C`;
    document.getElementById("humidity").textContent = `💧 Humidity: ${dht.humidity} %`;
    document.getElementById("moisture").textContent = `🌱 Moisture: ${moisture.moisture}`;
    document.getElementById("pumpStatus").textContent = `🚰 Pump Status: ${pump.status}`;
  } catch (err) {
    console.error("❌ Sensor fetch failed", err);
  }
}

async function fetchForecastData() {
  try {
    const res = await fetch(METEO_API);
    const data = await res.json();

    // Current forecast
    const forecastTemp = data.current.temperature_2m;
    const forecastHumidity = data.current.relative_humidity_2m;

    // Hourly forecast
    const soilMoisture = data.hourly.soil_moisture_3_to_9cm?.[0];
    const rainProb = data.hourly.precipitation_probability?.[0];

    document.getElementById("forecastTemp").textContent = `🌡️ Forecast Temp: ${forecastTemp} °C`;
    document.getElementById("forecastHumidity").textContent = `💧 Forecast Humidity: ${forecastHumidity} %`;
    document.getElementById("forecastSoil").textContent = `🌱 Soil Moisture (3–9cm): ${soilMoisture}`;
    document.getElementById("forecastRain").textContent = `🌧️ Rain Probability: ${rainProb} %`;
  } catch (err) {
    console.error("❌ Forecast fetch failed", err);
  }
}

// Initial fetch + repeat every 5 seconds
fetchSensorData();
fetchForecastData();
setInterval(fetchSensorData, 5000);
setInterval(fetchForecastData, 60000); // Forecast update every minute
