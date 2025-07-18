const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch').default;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Serve the main HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API endpoint to fetch live weather data
app.get('/api/weather', async (req, res) => {
  try {
    const latitude = 8.4966; // Ilorin, Nigeria
    const longitude = 4.5421;
    
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m,relative_humidity_2m,surface_pressure,soil_moisture_0_1cm&timezone=Africa/Lagos&forecast_days=1`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error('Failed to fetch weather data');
    }
    
    // Get the current hour's data (first element in the arrays)
    const currentData = {
      temperature: data.hourly.temperature_2m[0],
      humidity: data.hourly.relative_humidity_2m[0],
      pressure: data.hourly.surface_pressure[0],
      soilMoisture: data.hourly.soil_moisture_0_1cm[0],
      timestamp: data.hourly.time[0]
    };
    
    res.json({
      success: true,
      data: currentData,
      location: 'Ilorin, Nigeria'
    });
  } catch (error) {
    console.error('Error fetching weather data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch weather data'
    });
  }
});

// API endpoint to control water pump
app.post('/api/pump', (req, res) => {
  const { status } = req.body;
  
  // In a real implementation, this would control actual hardware
  console.log(`Water pump ${status ? 'ON' : 'OFF'}`);
  
  res.json({
    success: true,
    message: `Water pump turned ${status ? 'ON' : 'OFF'}`,
    pumpStatus: status
  });
});

// API endpoint to get pump status
app.get('/api/pump/status', (req, res) => {
  // In a real implementation, this would read from hardware
  res.json({
    success: true,
    pumpStatus: false // Default to OFF
  });
});

app.listen(PORT, () => {
  console.log(`Smart Irrigation System server running on port ${PORT}`);
});