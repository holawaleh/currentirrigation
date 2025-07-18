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

// DOM Elements
const pumpOnBtn = document.getElementById('pump-on');
const pumpOffBtn = document.getElementById('pump-off');
const pumpStatusElement = document.getElementById('pump-status');
const connectionStatus = document.getElementById('connection-status');

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
  initializeApp();
});

async function initializeApp() {
  try {
    // Add connection status indicator
    addConnectionStatusIndicator();
    
    // Initial data fetch
    await fetchSensorData();
    
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
  if (!connectionStatus) {
    const statusDiv = document.createElement('div');
    statusDiv.id = 'connection-status';
    statusDiv.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      padding: 5px 10px;
      border-radius: 5px;
      font-size: 12px;
      color: white;
      z-index: 1000;
    `;
    document.body.appendChild(statusDiv);
  }
}

function setupEventListeners() {
  if (pumpOnBtn) {
    pumpOnBtn.addEventListener('click', () => controlPump('on'));
  }
  
  if (pumpOffBtn) {
    pumpOffBtn.addEventListener('click', () => controlPump('off'));
  }
  
  // Add manual refresh button
  const refreshBtn = document.getElementById('refresh-btn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', fetchSensorData);
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
}

function stopPeriodicRefresh() {
  if (refreshInterval) {
    clearInterval(refreshInterval);
    refreshInterval = null;
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
      },
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });
    
    if (!response.ok) {
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
      showError('Connection timeout');
    } else {
      showError('Failed to fetch sensor data');
    }
    
    throw error;
  }
}

function updateDashboard() {
  // Update climate data
  if (sensorData.climate) {
    updateElement('local-temp', `${sensorData.climate.temperature || '--'}°C`);
    updateElement('local-humidity', `${sensorData.climate.humidity || '--'}%`);
    updateElement('local-pressure', `${sensorData.climate.pressure || '--'} hPa`);
    
    // Update timestamp if available
    if (sensorData.climate.timestamp) {
      updateElement('climate-timestamp', `Last updated: ${formatTimestamp(sensorData.climate.timestamp)}`);
    }
  }
  
  // Update soil data
  if (sensorData.soil) {
    updateElement('local-moisture', `${sensorData.soil.moisture || '--'} m³/m³`);
    
    if (sensorData.soil.timestamp) {
      updateElement('soil-timestamp', `Last updated: ${formatTimestamp(sensorData.soil.timestamp)}`);
    }
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
      top: 50px;
      right: 10px;
      padding: 10px;
      background-color: #f8d7da;
      color: #721c24;
      border: 1px solid #f5c6cb;
      border-radius: 5px;
      z-index: 1000;
      max-width: 300px;
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

// Expose functions for debugging
window.irrigationApp = {
  fetchSensorData,
  controlPump,
  getSensorData: () => sensorData,
  refreshNow: fetchSensorData
};