const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const OPEN_METEO_URL = 'https://api.open-meteo.com/v1/forecast?latitude=8.4966&longitude=4.5421&hourly=soil_moisture_3_to_9cm,precipitation_probability&current=temperature_2m,relative_humidity_2m';

app.get('/api/weather', async (req, res) => {
  try {
    const response = await fetch(OPEN_METEO_URL);
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
    console.error('Error fetching weather:', error);
    res.status(500).json({ error: 'Failed to fetch weather data' });
  }
});

app.get('/', (req, res) => {
  res.send('🌱 SmartMat backend is live.');
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
