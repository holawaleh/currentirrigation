// Configuration
const API_BASE_URL = 'https://currentirrigation.onrender.com';
let sensorData = {
  climate: null,
  soil: null,
  pumpStatus: 'off'
};

// DOM Elements
const pumpOnBtn = document.getElementById('pump-on');
const pumpOffBtn = document.getElementById('pump-off');
const pumpStatusElement = document.getElementById('pump-status');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  fetchSensorData();
  setInterval(fetchSensorData, 5000); // Refresh every 5 seconds
  
  pumpOnBtn.addEventListener('click', () => controlPump('on'));
  pumpOffBtn.addEventListener('click', () => controlPump('off'));
});

async function fetchSensorData() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/status`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    sensorData = await response.json();
    updateDashboard();
  } catch (error) {
    console.error('Error fetching sensor data:', error);
    document.querySelectorAll('.loading').forEach(el => {
      el.textContent = "Error loading data";
      el.style.color = "red";
    });
  }
}

function updateDashboard() {
  // Update forecast data
  if (sensorData.climate) {
    document.getElementById('local-temp').textContent = `${sensorData.climate.temperature}°C`;
    document.getElementById('local-humidity').textContent = `${sensorData.climate.humidity}%`;
    document.getElementById('local-pressure').textContent = `${sensorData.climate.pressure || '--'} hPa`;
  }
  
  if (sensorData.soil) {
    document.getElementById('local-moisture').textContent = `${sensorData.soil.moisture} m³/m³`;
  }
  
  updatePumpStatus(sensorData.pumpStatus);
}

async function controlPump(action) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/pump`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ action })
    });
    
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    const result = await response.json();
    updatePumpStatus(result.pumpStatus);
  } catch (error) {
    console.error('Error controlling pump:', error);
    pumpStatusElement.textContent = 'Error controlling pump';
  }
}

function updatePumpStatus(status) {
  sensorData.pumpStatus = status;
  pumpStatusElement.textContent = `Pump status: ${status}`;
  
  if (status === 'on') {
    document.getElementById('irrigation-status').textContent = "IRRIGATING: Plants need water";
    document.getElementById('irrigation-status').className = "status irrigating";
    pumpStatusElement.style.backgroundColor = '#d4edda';
  } else {
    document.getElementById('irrigation-status').textContent = "NOT IRRIGATING: Optimal moisture levels";
    document.getElementById('irrigation-status').className = "status not-irrigating";
    pumpStatusElement.style.backgroundColor = '#f8d7da';
  }
}