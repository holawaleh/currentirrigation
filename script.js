// Use consistent URL - ensure it matches exactly what's in Render
const API_BASE_URL = 'https://currentirrigation.onrender.com'; 

// Add retry logic to fetchSensorData
async function fetchSensorData() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/status`, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    const data = await response.json();
    sensorData = data;
    updateDashboard();
  } catch (error) {
    console.error('Fetch error:', error);
    // Add retry after delay
    setTimeout(fetchSensorData, 5000);
  }
}