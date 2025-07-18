const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware setup
app.use(cors());
app.use(bodyParser.json());

// In-memory storage
let sensorData = {
  climate: null,
  soil: null,
  pumpStatus: 'off'
};

// Climate Data Endpoint
app.post('/api/climate', (req, res) => {
  const { temperature, humidity } = req.body;
  
  if (typeof temperature !== 'number' || typeof humidity !== 'number') {
    return res.status(400).json({ error: 'Invalid data format' });
  }

  sensorData.climate = {
    temperature,
    humidity,
    timestamp: new Date()
  };

  console.log('Climate data received:', sensorData.climate);
  res.status(200).json({ status: 'success' });
});

// Soil Moisture Endpoint
app.post('/api/soil', (req, res) => {
  const { moisture } = req.body;
  
  if (typeof moisture !== 'number') {
    return res.status(400).json({ error: 'Invalid moisture value' });
  }

  sensorData.soil = {
    moisture,
    timestamp: new Date()
  };

  console.log('Soil data received:', sensorData.soil);
  res.status(200).json({ status: 'success' });
});

// Pump Control Endpoint
app.post('/api/pump', (req, res) => {
  const { action } = req.body;
  
  if (!['on', 'off'].includes(action)) {
    return res.status(400).json({ error: 'Invalid action' });
  }

  sensorData.pumpStatus = action;
  console.log(`Pump turned ${action}`);

  res.status(200).json({ 
    status: 'success',
    pumpStatus: action,
    timestamp: new Date()
  });
});

// Status Endpoint
app.get('/api/status', (req, res) => {
  res.status(200).json(sensorData);
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});