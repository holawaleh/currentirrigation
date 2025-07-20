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

// Proxy to fetch weather data
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

app.get('/', (req, res) => {
  res.send('🌿 SmartMat Backend is live.');
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
