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
    const response = await fetch('https://currentirrigation.onrender.com/api/status', {
      method: 'GET',
      mode: 'cors',
      credentials: 'include', // If using cookies/auth
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching sensor data:', error);
    throw error;
  }
}

function updateDashboard() {
  // Update local readings
  if (sensorData.climate) {
    document.getElementById('local-temp').textContent = `${sensorData.climate.temperature || '--'}°C`;
    document.getElementById('local-humidity').textContent = `${sensorData.climate.humidity || '--'}%`;
    document.getElementById('local-pressure').textContent = `${sensorData.climate.pressure || '--'} hPa`;
  }
  
  if (sensorData.soil) {
    document.getElementById('local-moisture').textContent = `${sensorData.soil.moisture || '--'} m³/m³`;
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
      credentials: 'include',
      body: JSON.stringify({ action })
    });
    
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    const result = await response.json();
    updatePumpStatus(result.pumpStatus);
  } catch (error) {
    console.error('Error controlling pump:', error);
    showError('Failed to control pump');
  }
}

function updatePumpStatus(status) {
  sensorData.pumpStatus = status;
  pumpStatusElement.textContent = `Pump status: ${status || 'unknown'}`;
  
  const statusElement = document.getElementById('irrigation-status');
  if (status === 'on') {
    statusElement.textContent = "IRRIGATING: Plants need water";
    statusElement.className = "status irrigating";
    pumpStatusElement.style.backgroundColor = '#d4edda';
  } else {
    statusElement.textContent = "NOT IRRIGATING: Optimal moisture levels";
    statusElement.className = "status not-irrigating";
    pumpStatusElement.style.backgroundColor = '#f8d7da';
  }
}

function showError(message) {
  document.querySelectorAll('.loading').forEach(el => {
    el.textContent = message;
    el.style.color = "red";
  });
}