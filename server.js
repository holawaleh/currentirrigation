const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// In-memory storage (replace with database in production)
let sensorData = {
  climate: null,
  soil: null,
  pumpStatus: 'off'
};

// 1. Climate Data API (Temperature, Humidity, Pressure)
app.post('/api/climate', (req, res) => {
  const { temperature, humidity, pressure, deviceId } = req.body;
  
  // Validate input
  if (typeof temperature !== 'number' || 
      typeof humidity !== 'number' || 
      typeof pressure !== 'number') {
    return res.status(400).json({ error: 'Invalid data format' });
  }

  // Store data
  sensorData.climate = {
    temperature,
    humidity,
    pressure,
    deviceId,
    timestamp: new Date()
  };

  console.log('Climate data received:', sensorData.climate);
  res.status(200).json({ status: 'success' });
});

// 2. Soil Moisture API
app.post('/api/soil', (req, res) => {
  const { moisture, deviceId } = req.body;
  
  if (typeof moisture !== 'number' || moisture < 0 || moisture > 1) {
    return res.status(400).json({ error: 'Invalid moisture value' });
  }

  sensorData.soil = {
    moisture,
    deviceId,
    timestamp: new Date()
  };

  console.log('Soil data received:', sensorData.soil);
  res.status(200).json({ status: 'success' });
});

// 3. Pump Control API
app.post('/api/pump', (req, res) => {
  const { action } = req.body;
  
  if (!['on', 'off'].includes(action)) {
    return res.status(400).json({ error: 'Invalid action' });
  }

  sensorData.pumpStatus = action;
  console.log(`Pump turned ${action}`);

  // Here you would typically:
  // 1. Send command to actual IoT device
  // 2. Log the action
  // 3. Verify pump status

  res.status(200).json({ 
    status: 'success',
    pumpStatus: action,
    timestamp: new Date()
  });
});

// Get all current data (for your frontend)
app.get('/api/status', (req, res) => {
  res.status(200).json({
    climate: sensorData.climate,
    soil: sensorData.soil,
    pumpStatus: sensorData.pumpStatus
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});