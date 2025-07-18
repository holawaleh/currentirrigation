// In your server.js, modify the climate and soil endpoints:

// Climate Data Endpoint (updated)
app.post('/api/climate', (req, res) => {
  const { temperature, humidity } = req.body; // Removed pressure
  
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

// Soil Moisture Endpoint (updated)
app.post('/api/soil', (req, res) => {
  const { moisture } = req.body; // Removed deviceId
  
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