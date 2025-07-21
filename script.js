// Configuration
const API_BASE_URL = 'https://currentirrigation.onrender.com';
const REFRESH_INTERVAL = 5000; // 5 seconds

// Global state
let sensorData = {
  climate: null,
  soil: null,
  pumpStatus: 'off'
};

let refreshInterval;
let weatherInterval;

// DOM Elements
const pumpOnBtn = document.getElementById('pump-on');
const pumpOffBtn = document.getElementById('pump-off');
const pumpStatusElement = document.getElementById('pump-status');

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
  initializeApp();
});

async function initializeApp() {
  try {
    console.log('🚀 Initializing Smart Irrigation System...');
    
    addConnectionStatusIndicator();
    
    const serverOnline = await checkServerStatus();
    if (!serverOnline) {
      showError('Server is not responding. It may be starting up...');
      updateConnectionStatus('disconnected');
    } else {
      updateConnectionStatus('connected');
    }

    await fetchSensorData();
    await fetchWeatherData();

    startPeriodicRefresh();
    setupEventListeners();

    console.log('✅ Application initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize application:', error);
    showError('Failed to initialize application');
  }
}

function addConnectionStatusIndicator() {
  let statusElement = document.getElementById('connection-status');
  if (!statusElement) {
    statusElement = document.createElement('div');
    statusElement.id = 'connection-status';
    statusElement.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      padding: 8px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: bold;
      color: white;
      z-index: 1000;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    `;
    document.body.appendChild(statusElement);
  }
}

function setupEventListeners() {
  if (pumpOnBtn) pumpOnBtn.addEventListener('click', () => controlPump('on'));
  if (pumpOffBtn) pumpOffBtn.addEventListener('click', () => controlPump('off'));

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopPeriodicRefresh();
    else startPeriodicRefresh();
  });

  const refreshBtn = document.createElement('button');
  refreshBtn.textContent = '🔄 Refresh';
  refreshBtn.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    padding: 10px;
    background: #007bff;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    z-index: 1000;
  `;
  refreshBtn.addEventListener('click', () => {
    fetchSensorData();
    fetchWeatherData();
    console.log('🔄 Manual refresh triggered');
  });
  document.body.appendChild(refreshBtn);
}

function startPeriodicRefresh() {
  if (refreshInterval) clearInterval(refreshInterval);
  refreshInterval = setInterval(() => {
    fetchSensorData().catch(console.error);
    fetchWeatherData().catch(console.error);
  }, REFRESH_INTERVAL);
}

function stopPeriodicRefresh() {
  if (refreshInterval) clearInterval(refreshInterval);
  refreshInterval = null;
}

async function checkServerStatus() {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      mode: 'cors',
      signal: AbortSignal.timeout(5000)
    });
    if (response.ok) return true;
    return false;
  } catch (error) {
    console.error('❌ Server health check failed:', error);
    return false;
  }
}

async function fetchSensorData() {
  try {
    updateConnectionStatus('connecting');
    const response = await fetch(`${API_BASE_URL}/api/sensor-data`, {
      method: 'GET',
      mode: 'cors',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      },
      signal: AbortSignal.timeout(15000)
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    
    const data = await response.json();
    sensorData = data;
    updateDashboard();
    updateConnectionStatus('connected');
    clearErrors();
    return data;
  } catch (error) {
    console.error('❌ Error fetching sensor data:', error);
    updateConnectionStatus('disconnected');
    showError(`Connection failed: ${error.message}`);
    
    if (!sensorData.climate && !sensorData.soil) {
      populateMockData();
    }
    throw error;
  }
}

// ✅ NEW FUNCTION TO FETCH FROM OPEN-METEO
async function fetchWeatherData() {
  try {
    const response = await fetch('https://api.open-meteo.com/v1/forecast?latitude=8.4966&longitude=4.5421&hourly=soil_moisture_3_to_9cm&current=temperature_2m,relative_humidity_2m');
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    
    const weatherData = await response.json();
    const temp = weatherData.current.temperature_2m;
    const humidity = weatherData.current.relative_humidity_2m;

    const timeIndex = weatherData.hourly.time.findIndex(t => t === weatherData.current.time);
    const soilMoisture = weatherData.hourly.soil_moisture_3_to_9cm[timeIndex] || null;

    updateWeatherDisplay({
      temperature: temp,
      humidity: humidity,
      soil_moisture: soilMoisture
    });
  } catch (error) {
    console.error('❌ Failed to fetch weather data:', error);
    showError(`Weather fetch error: ${error.message}`);
  }
}

function updateWeatherDisplay(data) {
  const elements = {
    'forecast-temp': `${Math.round(data.temperature)}°C`,
    'forecast-humidity': `${data.humidity}%`,
    'forecast-moisture': data.soil_moisture ? `${(data.soil_moisture * 100).toFixed(1)}%` : 'N/A'
  };

  Object.entries(elements).forEach(([id, value]) => {
    const element = document.getElementById(id);
    if (element) {
      element.textContent = value;
      element.classList.remove('loading');
    }
  });
  console.log('🌤️ Weather display updated');
}

function updateDashboard() {
  if (sensorData.climate) {
    updateElement('local-temp', `${sensorData.climate.temperature || '--'}°C`);
    updateElement('local-humidity', `${sensorData.climate.humidity || '--'}%`);
    updateElement('local-pressure', sensorData.climate.pressure ? `${sensorData.climate.pressure} hPa` : 'N/A');
  } else {
    updateElement('local-temp', '--°C');
    updateElement('local-humidity', '--%');
    updateElement('local-pressure', '-- hPa');
  }

  if (sensorData.soil) {
    updateElement('local-moisture', `${sensorData.soil.moisture || '--'}%`);
  } else {
    updateElement('local-moisture', '--%');
  }

  updatePumpStatus(sensorData.pumpStatus);
  document.querySelectorAll('.loading').forEach(el => el.classList.remove('loading'));
}

function updateElement(id, value) {
  const element = document.getElementById(id);
  if (element) {
    element.textContent = value;
    element.classList.remove('loading');
    console.log(`✅ Updated ${id}: ${value}`);
  }
}

async function controlPump(action) {
  try {
    console.log(`🔧 Attempting to turn pump ${action}`);
    togglePumpButtons(false);

    const response = await fetch(`${API_BASE_URL}/api/pump`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ action }),
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);

    const result = await response.json();
    updatePumpStatus(result.pumpStatus);
    setTimeout(() => fetchSensorData(), 1000);
  } catch (error) {
    console.error('❌ Error controlling pump:', error);
    showError(`Failed to turn pump ${action}: ${error.message}`);
  } finally {
    togglePumpButtons(true);
  }
}

function togglePumpButtons(enabled) {
  if (pumpOnBtn) pumpOnBtn.disabled = !enabled;
  if (pumpOffBtn) pumpOffBtn.disabled = !enabled;
}

function updatePumpStatus(status) {
  sensorData.pumpStatus = status;

  if (pumpStatusElement) {
    pumpStatusElement.textContent = `Pump status: ${status || 'unknown'}`;
  }

  const statusElement = document.getElementById('irrigation-status');
  if (statusElement) {
    statusElement.classList.remove('loading');
    if (status === 'on') {
      statusElement.textContent = "IRRIGATING: Pump is running";
      statusElement.className = "status irrigating";
      pumpStatusElement.style.backgroundColor = '#d4edda';
    } else {
      statusElement.textContent = "NOT IRRIGATING: Pump is off";
      statusElement.className = "status not-irrigating";
      pumpStatusElement.style.backgroundColor = '#f8d7da';
    }
  }
}

function updateConnectionStatus(status) {
  const statusElement = document.getElementById('connection-status');
  if (!statusElement) return;

  switch (status) {
    case 'connected':
      statusElement.textContent = '🟢 Connected';
      statusElement.style.backgroundColor = '#28a745';
      break;
    case 'connecting':
      statusElement.textContent = '🟡 Connecting...';
      statusElement.style.backgroundColor = '#ffc107';
      break;
    case 'disconnected':
      statusElement.textContent = '🔴 Disconnected';
      statusElement.style.backgroundColor = '#dc3545';
      break;
  }
}

function showError(message) {
  let errorElement = document.getElementById('error-message');
  if (!errorElement) {
    errorElement = document.createElement('div');
    errorElement.id = 'error-message';
    errorElement.style.cssText = `
      position: fixed;
      top: 60px;
      right: 10px;
      padding: 10px 15px;
      background-color: #f8d7da;
      color: #721c24;
      border: 1px solid #f5c6cb;
      border-radius: 8px;
      z-index: 1000;
      max-width: 300px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
      font-size: 14px;
    `;
    document.body.appendChild(errorElement);
  }
  errorElement.textContent = message;
  errorElement.style.display = 'block';
  setTimeout(() => errorElement.style.display = 'none', 10000);
}

function clearErrors() {
  const errorElement = document.getElementById('error-message');
  if (errorElement) errorElement.style.display = 'none';
}

function populateMockData() {
  sensorData = {
    climate: { temperature: 24, humidity: 65, pressure: null, timestamp: new Date() },
    soil: { moisture: 45, timestamp: new Date() },
    pumpStatus: 'off'
  };
  updateDashboard();
  updateWeatherDisplay({
    temperature: 26,
    humidity: 70,
    soil_moisture: 0.35
  });
}

// Debug tools
window.irrigationApp = {
  fetchSensorData,
  controlPump,
  getSensorData: () => sensorData,
  refreshNow: fetchSensorData,
  populateMockData,
  updateDashboard,
  testConnection: checkServerStatus
};

// Auto-fallback to mock data if no real data
setTimeout(() => {
  if (!sensorData.climate && !sensorData.soil) {
    console.log('🔧 No real sensor data received after 15s, using mock data');
    populateMockData();
  }
}, 15000);

console.log('📱 Smart Irrigation System Frontend Loaded');
