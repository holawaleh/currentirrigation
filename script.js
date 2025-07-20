// Configuration
const API_BASE_URL = 'https://currentirrigation.onrender.com';
const REFRESH_INTERVAL = 5000; // 5 seconds

// OpenWeather API (get free API key from openweathermap.org)
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
    console.log('🚀 Initializing Smart Irrigation System...');
    
    // Add connection status indicator
    addConnectionStatusIndicator();
    
    // Check server status first
    const serverOnline = await checkServerStatus();
    if (!serverOnline) {
      showError('Server is not responding. It may be starting up...');
      updateConnectionStatus('disconnected');
    } else {
      updateConnectionStatus('connected');
    }
    
    // Initial data fetch
    await fetchSensorData();
    
    // Fetch weather data (if API key is configured)
    if (WEATHER_API_KEY !== 'YOUR_API_KEY_HERE') {
      await fetchWeatherData();
    } else {
      console.log('⚠️ Weather API key not configured, using mock data');
      updateWeatherDisplay({
        main: { temp: 26, humidity: 70, pressure: 1015 },
        weather: [{ description: 'partly cloudy' }]
      });
    }
    
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

  // Add manual refresh button
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
    console.log('🔄 Manual refresh triggered');
  });
  document.body.appendChild(refreshBtn);
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
  
  // Weather refresh every 10 minutes (if API key configured)
  if (weatherInterval) {
    clearInterval(weatherInterval);
  }
  
  if (WEATHER_API_KEY !== 'YOUR_API_KEY_HERE') {
    weatherInterval = setInterval(() => {
      fetchWeatherData().catch(error => {
        console.error('Weather refresh failed:', error);
      });
    }, 600000); // 10 minutes
  }
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
    clearErrors();
    
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
    
    // Use mock data if real data fails
    if (!sensorData.climate && !sensorData.soil) {
      console.log('🔧 Using mock data due to connection failure');
      populateMockData();
    }
    
    throw error;
  }
}

function updateWeatherDisplay(weatherData) {
  const elements = {
    'forecast-temp': `${Math.round(weatherData.main.temp)}°C`,
    'forecast-humidity': `${weatherData.main.humidity}%`,
    'forecast-pressure': `${weatherData.main.pressure} hPa`,
    'forecast-location': weatherData.name,
    'forecast-condition': weatherData.weather[0].description
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

function updateWeatherDisplay(weatherData) {
  const elements = {
    'forecast-temp': `${Math.round(weatherData.main.temp)}°C`,
    'forecast-humidity': `${weatherData.main.humidity}%`,
    'forecast-pressure': `${weatherData.main.pressure} hPa`,
    'forecast-moisture': 'N/A' // Weather API doesn't provide soil moisture
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
  console.log('🔄 Updating dashboard with data:', sensorData);
  
  // Update climate data
  if (sensorData.climate) {
    updateElement('local-temp', `${sensorData.climate.temperature || '--'}°C`);
    updateElement('local-humidity', `${sensorData.climate.humidity || '--'}%`);
    updateElement('local-pressure', 
      sensorData.climate.pressure ? `${sensorData.climate.pressure} hPa` : 'N/A'
    );
  } else {
    // Show placeholder if no data
    updateElement('local-temp', '--°C');
    updateElement('local-humidity', '--%');
    updateElement('local-pressure', '-- hPa');
  }
  
  // Update soil data
  if (sensorData.soil) {
    updateElement('local-moisture', `${sensorData.soil.moisture || '--'}%`);
  } else {
    updateElement('local-moisture', '--%');
  }
  
  // Update pump status
  updatePumpStatus(sensorData.pumpStatus);
  
  // Remove loading classes
  document.querySelectorAll('.loading').forEach(el => {
    el.classList.remove('loading');
  });
}

function updateElement(id, value) {
  const element = document.getElementById(id);
  if (element) {
    element.textContent = value;
    element.classList.remove('loading');
    console.log(`✅ Updated ${id}: ${value}`);
  } else {
    console.warn(`⚠️ Element with id '${id}' not found`);
  }
}

async function controlPump(action) {
  try {
    console.log(`🔧 Attempting to turn pump ${action}`);
    
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
    
    console.log(`✅ Pump ${action} successful`);
    
    // Refresh data to confirm change
    setTimeout(() => fetchSensorData(), 1000);
    
  } catch (error) {
    console.error('❌ Error controlling pump:', error);
    showError(`Failed to turn pump ${action}: ${error.message}`);
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
    statusElement.classList.remove('loading');
    
    if (status === 'on') {
      statusElement.textContent = "IRRIGATING: Pump is running";
      statusElement.className = "status irrigating";
      if (pumpStatusElement) pumpStatusElement.style.backgroundColor = '#d4edda';
    } else {
      statusElement.textContent = "NOT IRRIGATING: Pump is off";
      statusElement.className = "status not-irrigating";
      if (pumpStatusElement) pumpStatusElement.style.backgroundColor = '#f8d7da';
    }
  }

  console.log(`🚰 Pump status updated: ${status}`);
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
  
  // Auto-hide after 10 seconds
  setTimeout(() => {
    if (errorElement) {
      errorElement.style.display = 'none';
    }
  }, 10000);
}

function clearErrors() {
  const errorElement = document.getElementById('error-message');
  if (errorElement) {
    errorElement.style.display = 'none';
  }
}

// Debug function to manually populate data
function populateMockData() {
  console.log('🔧 Populating mock data for testing...');
  
  sensorData = {
    climate: {
      temperature: 24,
      humidity: 65,
      pressure: null,
      timestamp: new Date()
    },
    soil: {
      moisture: 45,
      timestamp: new Date()
    },
    pumpStatus: 'off'
  };
  
  updateDashboard();
  
  // Also update weather forecast with mock data
  updateWeatherDisplay({
    main: { temp: 26, humidity: 70, pressure: 1015 },
    weather: [{ description: 'sunny' }],
    name: 'Mock Location'
  });
}

// Expose functions for debugging
window.irrigationApp = {
  fetchSensorData,
  controlPump,
  getSensorData: () => sensorData,
  refreshNow: fetchSensorData,
  populateMockData,
  updateDashboard,
  testConnection: checkServerStatus
};

// Auto-populate mock data if no real data after 15 seconds
setTimeout(() => {
  if (!sensorData.climate && !sensorData.soil) {
    console.log('🔧 No real sensor data received after 15s, using mock data');
    populateMockData();
  }
}, 15000);

console.log('📱 Smart Irrigation System Frontend Loaded');