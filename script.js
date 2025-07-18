// Configuration
const API_BASE_URL = 'https://currentirrigation.onrender.com';
const REFRESH_INTERVAL = 5000; // 5 seconds

// OpenWeather API (you'll need to get a free API key)
const WEATHER_API_KEY = 'YOUR_API_KEY_HERE'; // Replace with your actual API key
const WEATHER_API_URL = 'https://api.openweathermap.org/data/2.5/weather';

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
    // Add connection status indicator
    addConnectionStatusIndicator();
    
    // Check server status first
    const serverOnline = await checkServerStatus();
    if (!serverOnline) {
      showError('Server is not responding. It may be starting up...');
      updateConnectionStatus('disconnected');
    }
    
    // Initial data fetch
    await fetchSensorData();
    
    // Fetch weather data
    await fetchWeatherData();
    
    // Set up periodic refresh
    startPeriodicRefresh();
    
    // Set up event listeners
    setupEventListeners();
    
    console.log('✅ Application initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize application:', error);
    showError('Failed to initialize application');
  }
}

function addConnectionStatusIndicator() {
  // Add connection status if it doesn't exist
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
  if (pumpOnBtn) {
    pumpOnBtn.addEventListener('click', () => controlPump('on'));
  }
  
  if (pumpOffBtn) {
    pumpOffBtn.addEventListener('click', () => controlPump('off'));
  }
  
  // Handle page visibility changes
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stopPeriodicRefresh();
    } else {
      startPeriodicRefresh();
    }
  });
}

function startPeriodicRefresh() {
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }
  
  refreshInterval = setInterval(() => {
    fetchSensorData().catch(error => {
      console.error('Periodic refresh failed:', error);
    });
  }, REFRESH_INTERVAL);
  
  // Weather refresh every 10 minutes
  if (weatherInterval) {
    clearInterval(weatherInterval);
  }
  
  weatherInterval = setInterval(() => {
    fetchWeatherData().catch(error => {
      console.error('Weather refresh failed:', error);
    });
  }, 600000); // 10 minutes
}

function stopPeriodicRefresh() {
  if (refreshInterval) {
    clearInterval(refreshInterval);
    refreshInterval = null;
  }
  
  if (weatherInterval) {
    clearInterval(weatherInterval);
    weatherInterval = null;
  }
}

async function checkServerStatus() {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      mode: 'cors',
      signal: AbortSignal.timeout(5000)
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('🏥 Server health check:', data);
      return true;
    }
    return false;
  } catch (error) {
    console.error('❌ Server health check failed:', error);
    return false;
  }
}

async function fetchSensorData() {
  try {
    updateConnectionStatus('connecting');
    
    const response = await fetch(`${API_BASE_URL}/api/status`, {
      method: 'GET',
      mode: 'cors',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      },
      signal: AbortSignal.timeout(15000)
    });
    
    if (!response.ok) {
      if (response.status === 502) {
        throw new Error('Server is starting up, please wait...');
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    sensorData = data;
    
    updateDashboard();
    updateConnectionStatus('connected');
    
    console.log('📊 Sensor data updated:', data);
    return data;
    
  } catch (error) {
    console.error('❌ Error fetching sensor data:', error);
    updateConnectionStatus('disconnected');
    
    if (error.name === 'AbortError') {
      showError('Connection timeout - server may be sleeping');
    } else if (error.message.includes('CORS')) {
      showError('CORS error - check server configuration');
    } else if (error.message.includes('502')) {
      showError('Server is starting up, please wait...');
    } else {
      showError(`Connection failed: ${error.message}`);
    }
    
    throw error;
  }
}

async function fetchWeatherData() {
  try {
    // Get user's location
    if (!navigator.geolocation) {
      console.log('Geolocation not supported');
      return;
    }
    
    const position = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject);
    });
    
    const { latitude, longitude } = position.coords;
    
    const weatherResponse = await fetch(
      `${WEATHER_API_URL}?lat=${latitude}&lon=${longitude}&appid=${WEATHER_API_KEY}&units=metric`
    );
    
    if (!weatherResponse.ok) {
      throw new Error('Weather API request failed');
    }
    
    const weatherData = await weatherResponse.json();
    updateWeatherDisplay(weatherData);
    
  } catch (error) {
    console.error('❌ Weather fetch failed:', error);
    // Use mock weather data if API fails
    updateWeatherDisplay({
      main: { temp: 25, humidity: 60, pressure: 1013 },
      weather: [{ description: 'partly cloudy' }]
    });
  }
}

function updateWeatherDisplay(weatherData) {
  const elements = {
    'weather-temp': `${Math.round(weatherData.main.temp)}°C`,
    'weather-humidity': `${weatherData.main.humidity}%`,
    'weather-pressure': `${weatherData.main.pressure} hPa`
  };
  
  Object.entries(elements).forEach(([id, value]) => {
    const element = document.getElementById(id);
    if (element) {
      element.textContent = value;
    }
  });
}

function updateDashboard() {
  console.log('🔄 Updating dashboard with data:', sensorData);
  
  // Update climate data
  if (sensorData.climate) {
    updateElement('local-temp', `${sensorData.climate.temperature || '--'}°C`);
    updateElement('local-humidity', `${sensorData.climate.humidity || '--'}%`);
    updateElement('local-pressure', `${sensorData.climate.pressure || '--'} hPa`);
  } else {
    // If no climate data, show mock data for testing
    updateElement('local-temp', '24°C');
    updateElement('local-humidity', '65%');
    updateElement('local-pressure', '1013 hPa');
  }
  
  // Update soil data
  if (sensorData.soil) {
    updateElement('local-moisture', `${sensorData.soil.moisture || '--'} m³/m³`);
  } else {
    // Mock soil data
    updateElement('local-moisture', '0.25 m³/m³');
  }
  
  // Update pump status
  updatePumpStatus(sensorData.pumpStatus);
  
  // Clear any error messages
  clearErrors();
}

function updateElement(id, value) {
  const element = document.getElementById(id);
  if (element) {
    element.textContent = value;
    console.log(`✅ Updated ${id}: ${value}`);
  } else {
    console.warn(`⚠️ Element with id '${id}' not found`);
  }
}

async function controlPump(action) {
  try {
    // Disable buttons during request
    togglePumpButtons(false);
    
    const response = await fetch(`${API_BASE_URL}/api/pump`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ action }),
      signal: AbortSignal.timeout(10000)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    updatePumpStatus(result.pumpStatus);
    
    console.log(`🔧 Pump ${action} successful`);
    
  } catch (error) {
    console.error('❌ Error controlling pump:', error);
    showError(`Failed to turn pump ${action}`);
  } finally {
    // Re-enable buttons
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
    if (status === 'on') {
      statusElement.textContent = "IRRIGATING: Plants need water";
      statusElement.className = "status irrigating";
      if (pumpStatusElement) pumpStatusElement.style.backgroundColor = '#d4edda';
    } else {
      statusElement.textContent = "NOT IRRIGATING: Optimal moisture levels";
      statusElement.className = "status not-irrigating";
      if (pumpStatusElement) pumpStatusElement.style.backgroundColor = '#f8d7da';
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
  console.error('Error:', message);
  
  // Create or update error message
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
    `;
    document.body.appendChild(errorElement);
  }
  
  errorElement.textContent = message;
  errorElement.style.display = 'block';
  
  // Auto-hide after 5 seconds
  setTimeout(() => {
    if (errorElement) {
      errorElement.style.display = 'none';
    }
  }, 5000);
}

function clearErrors() {
  const errorElement = document.getElementById('error-message');
  if (errorElement) {
    errorElement.style.display = 'none';
  }
}

function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleString();
}

// Debug function to manually populate data
function populateMockData() {
  console.log('🔧 Populating mock data for testing...');
  
  // Mock sensor data
  sensorData = {
    climate: {
      temperature: 24,
      humidity: 65,
      pressure: 1013,
      timestamp: new Date()
    },
    soil: {
      moisture: 0.25,
      timestamp: new Date()
    },
    pumpStatus: 'on'
  };
  
  updateDashboard();
  updateWeatherDisplay({
    main: { temp: 26, humidity: 70, pressure: 1015 },
    weather: [{ description: 'sunny' }]
  });
}

// Expose functions for debugging
window.irrigationApp = {
  fetchSensorData,
  controlPump,
  getSensorData: () => sensorData,
  refreshNow: fetchSensorData,
  populateMockData,
  updateDashboard
};

// Auto-populate mock data if no real data after 10 seconds
setTimeout(() => {
  if (!sensorData.climate && !sensorData.soil) {
    console.log('🔧 No real sensor data received, using mock data');
    populateMockData();
  }
}, 10000);