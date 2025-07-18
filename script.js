// Coordinates for the location (example: Ilorin, Nigeria)
const latitude = 8.4966;
const longitude = 4.5421;
const API_BASE_URL = 'http://localhost:3000'; // Change to your server address

// DOM Elements
const pumpOnBtn = document.getElementById('pump-on');
const pumpOffBtn = document.getElementById('pump-off');
const pumpStatusElement = document.getElementById('pump-status');

// Fetch weather data from Open-Meteo API
async function fetchWeatherData() {
  try {
    const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m,relativehumidity_2m,pressure_msl&current_weather=true`);
    const data = await response.json();

    if (data && data.hourly && data.current_weather) {
      updateForecastData(data);
      fetchLocalSensorData();
    }
  } catch (error) {
    console.error("Error fetching weather data:", error);
    document.querySelectorAll('.loading').forEach(el => {
      el.textContent = "Error loading data";
      el.style.color = "red";
    });
  }
}

// Update forecast data from API
function updateForecastData(data) {
  const hourly = data.hourly;
  const now = new Date();
  const currentHour = now.getHours();

  // Find the index for the current hour
  const timeIndex = hourly.time.findIndex(t => {
    const time = new Date(t);
    return time.getHours() === currentHour;
  });

  if (timeIndex !== -1) {
    document.getElementById('forecast-temp').textContent = `${hourly.temperature_2m[timeIndex]}°C`;
    document.getElementById('forecast-humidity').textContent = `${hourly.relativehumidity_2m[timeIndex]}%`;
    document.getElementById('forecast-pressure').textContent = `${Math.round(hourly.pressure_msl[timeIndex])} hPa`;

    // Soil moisture isn't in the API, so we'll simulate it based on humidity
    const simulatedMoisture = (hourly.relativehumidity_2m[timeIndex] / 100 * 0.3).toFixed(3);
    document.getElementById('forecast-moisture').textContent = `${simulatedMoisture} m³/m³`;
  }
}

// Fetch local sensor data from your server
async function fetchLocalSensorData() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/status`);
    const data = await response.json();

    if (data.climate) {
      document.getElementById('local-temp').textContent = `${data.climate.temperature}°C`;
      document.getElementById('local-humidity').textContent = `${data.climate.humidity}%`;
      document.getElementById('local-pressure').textContent = `${data.climate.pressure} hPa`;
    }

    if (data.soil) {
      document.getElementById('local-moisture').textContent = `${data.soil.moisture} m³/m³`;
    }

    if (data.pumpStatus) {
      updatePumpStatus(data.pumpStatus);
    }

    determineIrrigationStatus();
  } catch (error) {
    console.error("Error fetching local sensor data:", error);
    simulateLocalSensorData(); // Fallback to simulated data
  }
}

// Fallback to simulated data if API fails
function simulateLocalSensorData() {
  const forecastTemp = parseFloat(document.getElementById('forecast-temp').textContent) || 25;
  const forecastHumidity = parseFloat(document.getElementById('forecast-humidity').textContent) || 50;
  const forecastPressure = parseFloat(document.getElementById('forecast-pressure').textContent) || 1013;
  const forecastMoisture = parseFloat(document.getElementById('forecast-moisture').textContent) || 0.15;

  // Add small random variations
  const localTemp = (forecastTemp + (Math.random() * 2 - 1)).toFixed(1);
  const localHumidity = Math.min(100, Math.max(0, forecastHumidity + (Math.random() * 5 - 2.5))).toFixed(1);
  const localPressure = (forecastPressure + (Math.random() * 2 - 1)).toFixed(0);
  const localMoisture = Math.max(0, Math.min(0.3, forecastMoisture + (Math.random() * 0.05 - 0.025))).toFixed(3);

  document.getElementById('local-temp').textContent = `${localTemp}°C`;
  document.getElementById('local-humidity').textContent = `${localHumidity}%`;
  document.getElementById('local-pressure').textContent = `${localPressure} hPa`;
  document.getElementById('local-moisture').textContent = `${localMoisture} m³/m³`;
}

// Determine irrigation status based on conditions
function determineIrrigationStatus() {
  const statusElement = document.getElementById('irrigation-status');
  const moisture = parseFloat(document.getElementById('local-moisture').textContent);
  const temp = parseFloat(document.getElementById('local-temp').textContent);
  const humidity = parseFloat(document.getElementById('local-humidity').textContent);

  // Simple logic for demonstration
  if (moisture < 0.1 || (temp > 30 && humidity < 60)) {
    statusElement.textContent = "IRRIGATING: Plants need water";
    statusElement.className = "status irrigating";
    controlPump('on');
  } else {
    statusElement.textContent = "NOT IRRIGATING: Optimal moisture levels";
    statusElement.className = "status not-irrigating";
    controlPump('off');
  }
}

// Control pump via API
async function controlPump(action) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/pump`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ action })
    });
    
    const result = await response.json();
    updatePumpStatus(result.pumpStatus);
    return result;
  } catch (error) {
    console.error('Error controlling pump:', error);
    pumpStatusElement.textContent = 'Pump status: Error';
  }
}

// Update pump status display
function updatePumpStatus(status) {
  pumpStatusElement.textContent = `Pump status: ${status}`;
  if (status === 'on') {
    pumpStatusElement.style.backgroundColor = '#d4edda';
    pumpStatusElement.style.color = '#155724';
  } else {
    pumpStatusElement.style.backgroundColor = '#f8d7da';
    pumpStatusElement.style.color = '#721c24';
  }
}

// Event listeners for manual pump control
pumpOnBtn.addEventListener('click', () => controlPump('on'));
pumpOffBtn.addEventListener('click', () => controlPump('off'));

// Initial data fetch
fetchWeatherData();

// Refresh data every 30 seconds
setInterval(fetchWeatherData, 30 * 1000);
// Refresh local data more frequently (every 5 seconds)
setInterval(fetchLocalSensorData, 5 * 1000);