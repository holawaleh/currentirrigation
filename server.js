// server.js
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static files from public directory
app.use(express.static('public'));

// Store latest sensor data (in production, use a database)
let latestSensorData = null;

// Endpoint to receive sensor data from ESP8266 (your device)
app.post('/api/arduino/sensors', (req, res) => {
  try {
    const { temperature, humidity, moisture } = req.body;
    
    // Validate the incoming data
    if (typeof temperature !== 'number' || typeof humidity !== 'number' || typeof moisture !== 'number') {
      return res.status(400).json({ 
        error: 'Invalid data format. Expected numbers for temperature, humidity, and moisture.' 
      });
    }
    
    // Store the sensor data with timestamp
    latestSensorData = {
      temperature,
      humidity,
      moisture,
      timestamp: new Date().toISOString()
    };
    
    console.log('📡 Received ESP8266 sensor data:', latestSensorData);
    
    res.status(200).json({ 
      success: true, 
      message: 'ESP8266 sensor data received successfully',
      receivedAt: latestSensorData.timestamp,
      data: latestSensorData
    });
    
  } catch (error) {
    console.error('❌ Error processing ESP8266 sensor data:', error);
    res.status(500).json({ error: 'Failed to process sensor data' });
  }
});

// Endpoint to get the latest sensor data
app.get('/api/sensor-data', (req, res) => {
  if (!latestSensorData) {
    return res.status(404).json({ 
      error: 'No sensor data available',
      message: 'No data has been received from ESP8266 yet.'
    });
  }
  
  res.json(latestSensorData);
});

// Proxy to fetch weather data (your existing endpoint)
app.get('/api/weather', async (req, res) => {
  try {
    const weatherUrl = 'https://api.open-meteo.com/v1/forecast?latitude=8.4966&longitude=4.5421&hourly=soil_moisture_3_to_9cm,precipitation_probability&current=temperature_2m,relative_humidity_2m';
    const response = await fetch(weatherUrl);
    const data = await response.json();

    const weatherData = {
      temperature: data.current?.temperature_2m ?? null,
      humidity: data.current?.relative_humidity_2m ?? null,
      soilMoisture: data.hourly?.soil_moisture_3_to_9cm?.[0] ?? null,
      precipitationProbability: data.hourly?.precipitation_probability?.[0] ?? null,
      timestamp: data.current?.time ?? new Date().toISOString()
    };

    res.json(weatherData);
  } catch (error) {
    console.error('Weather fetch failed:', error);
    res.status(500).json({ error: 'Failed to fetch weather data' });
  }
});

// NEW: Combined endpoint to get both ESP8266 sensor data and weather data
app.get('/api/combined-data', async (req, res) => {
  try {
    // Get weather data from Open-Meteo API
    const weatherUrl = 'https://api.open-meteo.com/v1/forecast?latitude=8.4966&longitude=4.5421&hourly=soil_moisture_3_to_9cm,precipitation_probability&current=temperature_2m,relative_humidity_2m';
    const weatherResponse = await fetch(weatherUrl);
    const weatherData = await weatherResponse.json();
    
    const combinedData = {
      // ESP8266 sensor data
      sensorData: latestSensorData ? {
        temperature: latestSensorData.temperature,
        humidity: latestSensorData.humidity,
        moisture: latestSensorData.moisture,
        timestamp: latestSensorData.timestamp
      } : null,
      
      // Weather API data
      weatherData: {
        temperature: weatherData.current?.temperature_2m ?? null,
        humidity: weatherData.current?.relative_humidity_2m ?? null,
        soilMoisture: weatherData.hourly?.soil_moisture_3_to_9cm?.[0] ?? null,
        precipitationProbability: weatherData.hourly?.precipitation_probability?.[0] ?? null,
        timestamp: weatherData.current?.time ?? new Date().toISOString()
      },
      
      // Comparison/Analysis
      comparison: latestSensorData ? {
        temperatureDiff: latestSensorData.temperature - (weatherData.current?.temperature_2m ?? 0),
        humidityDiff: latestSensorData.humidity - (weatherData.current?.relative_humidity_2m ?? 0),
        lastSensorUpdate: latestSensorData.timestamp,
        dataAge: Math.round((new Date() - new Date(latestSensorData.timestamp)) / 1000 / 60) // minutes
      } : null,
      
      lastUpdated: new Date().toISOString()
    };
    
    res.json(combinedData);
  } catch (error) {
    console.error('Failed to fetch combined data:', error);
    res.status(500).json({ error: 'Failed to fetch combined data' });
  }
});

// NEW: Dashboard endpoint - formatted for easy display
app.get('/api/dashboard', async (req, res) => {
  try {
    // Get weather data
    const weatherUrl = 'https://api.open-meteo.com/v1/forecast?latitude=8.4966&longitude=4.5421&hourly=soil_moisture_3_to_9cm,precipitation_probability&current=temperature_2m,relative_humidity_2m';
    const weatherResponse = await fetch(weatherUrl);
    const weatherData = await weatherResponse.json();
    
    const dashboard = {
      status: latestSensorData ? 'online' : 'offline',
      lastUpdate: latestSensorData?.timestamp || null,
      
      // Current readings
      current: {
        sensor: latestSensorData ? {
          temperature: `${latestSensorData.temperature}°C`,
          humidity: `${latestSensorData.humidity}%`,
          soilMoisture: latestSensorData.moisture,
          status: 'ESP8266 Online'
        } : {
          status: 'ESP8266 Offline - No data received'
        },
        
        weather: {
          temperature: `${weatherData.current?.temperature_2m ?? 'N/A'}°C`,
          humidity: `${weatherData.current?.relative_humidity_2m ?? 'N/A'}%`,
          soilMoisture: weatherData.hourly?.soil_moisture_3_to_9cm?.[0] ?? 'N/A',
          precipitation: `${weatherData.hourly?.precipitation_probability?.[0] ?? 'N/A'}%`,
          status: 'Weather API Online'
        }
      },
      
      // System info
      system: {
        serverUptime: process.uptime(),
        location: 'Ibadan, Oyo State (8.4966, 4.5421)',
        timezone: 'Africa/Lagos'
      }
    };
    
    res.json(dashboard);
  } catch (error) {
    console.error('Dashboard fetch failed:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

app.get('/', (req, res) => {
  res.send(`
    <h1>🌿 SmartMat Backend is Live</h1>
    <h2>Available Endpoints:</h2>
    <ul>
      <li><strong>POST /api/arduino/sensors</strong> - ESP8266 sends data here</li>
      <li><strong>GET /api/sensor-data</strong> - Latest ESP8266 readings</li>
      <li><strong>GET /api/weather</strong> - Weather API data</li>
      <li><strong>GET /api/combined-data</strong> - Both sensor + weather data</li>
      <li><strong>GET /api/dashboard</strong> - Formatted dashboard view</li>
    </ul>
    <p><em>Status: ${latestSensorData ? '✅ ESP8266 Connected' : '⚠️ Waiting for ESP8266 data'}</em></p>
  `);
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🔌 ESP8266 endpoint: POST /api/arduino/sensors`);
  console.log(`📊 Get sensor data: GET /api/sensor-data`);
  console.log(`🌤️ Weather data: GET /api/weather`);
  console.log(`📈 Combined data: GET /api/combined-data`);
  console.log(`📋 Dashboard: GET /api/dashboard`);
});