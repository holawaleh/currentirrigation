const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Initialize sensorData
const sensorData = {
  climate: null,
  soil: null,
  pumpStatus: 'off'
};

// Enhanced CORS configuration
const allowedOrigins = [
  'https://instantirrigation.vercel.app',
  'http://localhost:3000',
  'http://localhost:3001',
  'https://currentirrigation.onrender.com'
];

// Use express cors middleware instead of custom implementation
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('Blocked by CORS:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Additional CORS headers for preflight requests
app.use((req, res, next) => {
  console.log('Request from origin:', req.headers.origin);
  
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Origin', req.headers.origin);
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Max-Age', '86400');
    return res.sendStatus(200);
  }
  
  next();
});

// Body parser middleware
app.use(express.json());

// Serve static files (if you have any)
app.use(express.static('public'));

// Add favicon route to prevent 404 errors
app.get('/favicon.ico', (req, res) => {
  res.status(204).end();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy',
    timestamp: new Date(),
    uptime: process.uptime()
  });
});

// Climate data endpoint
app.post('/api/climate', (req, res) => {
  try {
    const { temperature, humidity, pressure } = req.body;
    
    if (typeof temperature !== 'number' || typeof humidity !== 'number') {
      return res.status(400).json({ error: 'Invalid data format' });
    }

    sensorData.climate = {
      temperature,
      humidity,
      pressure: pressure || null,
      timestamp: new Date()
    };

    console.log('Updated climate data:', sensorData.climate);
    res.status(200).json({ status: 'success', data: sensorData.climate });
  } catch (error) {
    console.error('Climate endpoint error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Soil data endpoint
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

    console.log('Updated soil data:', sensorData.soil);
    res.status(200).json({ status: 'success', data: sensorData.soil });
  } catch (error) {
    console.error('Soil endpoint error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// **NEW: Arduino combined sensor endpoint**
app.post('/api/arduino/sensors', (req, res) => {
  try {
    const { temperature, humidity, moisture } = req.body;
    
    console.log('Received Arduino data:', req.body);
    
    // Validate data
    if (typeof temperature !== 'number' || typeof humidity !== 'number' || typeof moisture !== 'number') {
      return res.status(400).json({ error: 'Invalid data format' });
    }

    // Update climate data
    sensorData.climate = {
      temperature,
      humidity,
      pressure: null, // Arduino doesn't send pressure
      timestamp: new Date()
    };

    // Update soil data  
    sensorData.soil = {
      moisture,
      timestamp: new Date()
    };

    console.log('Updated sensor data from Arduino:', sensorData);
    res.status(200).json({ 
      status: 'success', 
      message: 'Sensor data updated',
      data: sensorData 
    });
  } catch (error) {
    console.error('Arduino sensors endpoint error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// **NEW: Arduino pump command endpoint**
app.get('/api/arduino/pump', (req, res) => {
  try {
    // Return current pump status for Arduino to read
    const command = sensorData.pumpStatus === 'on' ? 'ON' : 'OFF';
    console.log('Sending pump command to Arduino:', command);
    res.status(200).send(command);
  } catch (error) {
    console.error('Arduino pump endpoint error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Pump control endpoint
app.post('/api/pump', (req, res) => {
  try {
    const { action } = req.body;
    
    if (!['on', 'off'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action. Use "on" or "off"' });
    }

    sensorData.pumpStatus = action;
    console.log(`Pump ${action}`);
    
    res.status(200).json({ 
      status: 'success',
      pumpStatus: action,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Pump endpoint error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Status endpoint
app.get('/api/status', (req, res) => {
  try {
    res.status(200).json({
      ...sensorData,
      serverTime: new Date(),
      uptime: process.uptime()
    });
  } catch (error) {
    console.error('Status endpoint error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Catch-all route for undefined endpoints
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Endpoint not found',
    availableEndpoints: [
      'GET /health',
      'GET /api/status',
      'POST /api/climate',
      'POST /api/soil',
      'POST /api/pump',
      'POST /api/arduino/sensors',
      'GET /api/arduino/pump'
    ]
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Allowed origins: ${allowedOrigins.join(', ')}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
});