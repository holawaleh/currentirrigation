const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

// 1. Initialize sensorData FIRST
const sensorData = {
  climate: null,
  soil: null,
  pumpStatus: 'off'
};

// 2. Configure CORS
const allowedOrigins = [
  'https://instantirrigation.vercel.app/', // Replace with your actual frontend URL
  'http://localhost:3000'
];

app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST'],
  credentials: true
}));

// 3. Add body parser middleware
app.use(express.json());

// 4. Implement endpoints with error handling
app.post('/api/climate', (req, res) => {
  try {
    const { temperature, humidity } = req.body;
    
    if (typeof temperature !== 'number' || typeof humidity !== 'number') {
      return res.status(400).json({ error: 'Invalid data format' });
    }

    sensorData.climate = {
      temperature,
      humidity,
      timestamp: new Date()
    };

    console.log('Updated climate data:', sensorData.climate);
    res.status(200).json({ status: 'success' });
  } catch (error) {
    console.error('Climate endpoint error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add similar implementations for other endpoints
app.post('/api/soil', (req, res) => {
  try {
    const { moisture } = req.body;
    
    if (typeof moisture !== 'number') {
      return res.status(400).json({ error: 'Invalid moisture value' });
    }

    sensorData.soil = {
      moisture,
      timestamp: new Date()
    };

    res.status(200).json({ status: 'success' });
  } catch (error) {
    console.error('Soil endpoint error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/pump', (req, res) => {
  try {
    const { action } = req.body;
    
    if (!['on', 'off'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action' });
    }

    sensorData.pumpStatus = action;
    res.status(200).json({ 
      status: 'success',
      pumpStatus: action
    });
  } catch (error) {
    console.error('Pump endpoint error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/status', (req, res) => {
  try {
    res.status(200).json(sensorData);
  } catch (error) {
    console.error('Status endpoint error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 5. Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: err.message 
  });
});

// 6. Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Allowed origins: ${allowedOrigins.join(', ')}`);
});