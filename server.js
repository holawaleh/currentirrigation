const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

// In-memory data store
let sensorData = {
  temperature: null,
  humidity: null,
  moisture: null,
  pumpStatus: 'off',
  pumpControl: 'auto' // auto, on, off
};

// 🌡️ POST /api/sensors/dht
app.post('/api/sensors/dht', (req, res) => {
  const { temperature, humidity } = req.body;
  if (typeof temperature !== 'number' || typeof humidity !== 'number') {
    return res.status(400).json({ error: 'Invalid DHT data' });
  }
  sensorData.temperature = temperature;
  sensorData.humidity = humidity;
  console.log('🌡️ DHT Data Received:', { temperature, humidity });
  res.json({ message: 'DHT data received' });
});

// 🌡️ GET /api/sensors/dht
app.get('/api/sensors/dht', (req, res) => {
  res.json({
    temperature: sensorData.temperature,
    humidity: sensorData.humidity
  });
});

// 🌱 POST /api/sensors/moisture
app.post('/api/sensors/moisture', (req, res) => {
  const { moisture } = req.body;
  if (typeof moisture !== 'number') {
    return res.status(400).json({ error: 'Invalid moisture value' });
  }
  sensorData.moisture = moisture;
  console.log('🌱 Moisture Received:', moisture);
  res.json({ message: 'Moisture data received' });
});

// 🌱 GET /api/sensors/moisture
app.get('/api/sensors/moisture', (req, res) => {
  res.json({ moisture: sensorData.moisture });
});

// 💧 POST /api/pump/status
app.post('/api/pump/status', (req, res) => {
  const { status } = req.body;
  if (!['on', 'off'].includes(status)) {
    return res.status(400).json({ error: 'Invalid pump status' });
  }
  sensorData.pumpStatus = status;
  console.log('💧 Pump Status:', status);
  res.json({ message: 'Pump status updated' });
});

// 💧 GET /api/pump/status
app.get('/api/pump/status', (req, res) => {
  res.json({ status: sensorData.pumpStatus });
});

// ⚙️ GET /api/pump/control
app.get('/api/pump/control', (req, res) => {
  res.json({ control: sensorData.pumpControl });
});

// ⚙️ POST /api/pump/control
app.post('/api/pump/control', (req, res) => {
  const { control } = req.body;
  if (!['auto', 'on', 'off'].includes(control)) {
    return res.status(400).json({ error: 'Invalid control command' });
  }
  sensorData.pumpControl = control;
  console.log('⚙️ Pump Control set to:', control);
  res.json({ message: 'Pump control updated' });
});

// 🏠 Landing route
app.get('/', (req, res) => {
  res.send('🌿 Smart Irrigation Server is live!');
});

app.listen(PORT, () => {
  console.log(`✅ API running at: http://localhost:${PORT}`);
});
