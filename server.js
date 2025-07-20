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

// More permissive CORS for debugging
app.use(cors({
  origin: function (origin, callback) {
    console.log('🔍 CORS check - Origin:', origin);
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      console.log('✅ No origin - allowing request');
      return callback(null, true);
    }
    
    if (allowedOrigins.includes(origin)) {
      console.log('✅ Origin allowed:', origin);
      callback(null, true);
    } else {
      console.log('❌ Origin blocked:', origin);
      // For debugging, allow all origins temporarily
      // Comment out the next line in production
      callback(null, true); // TEMPORARY: Allow all origins for debugging
      // callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Origin', 'Accept'],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// Additional CORS headers middleware
app.use((req, res, next) => {
  const origin = req.headers.origin;
  console.log(`📡 ${req.method} ${req.url} from origin: ${origin || 'no-origin'}`);
  
  // Set CORS headers explicitly
  res.header('Access-Control-Allow-Origin', origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Origin, Accept');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Max-Age', '86400');
  
  if (req.method === 'OPTIONS') {
    console.log('🔄 Handling preflight request');
    return res.status(204).end();
  }
  
  next();
});

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
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

// Root endpoint for testing
app.get('/', (req, res) => {
  res.status(200).json({
    message: '🌱 Smart Irrigation System API',
    status: 'running',
    timestamp: new Date(),
    endpoints: [
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

// Health check endpoint with more details
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy',
    timestamp: new Date(),
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
    version: process.version,
    allowedOrigins: allowedOrigins
  });
});

// Climate data endpoint
app.post('/api/climate', (req, res) => {
  try {
    console.log('📊 Climate data received:', req.body);
    const { temperature, humidity, pressure } = req.body;
    
    if (typeof temperature !== 'number' || typeof humidity !== 'number') {
      console.log('❌ Invalid climate data format');
      return res.status(400).json({ error: 'Invalid data format' });
    }

    sensorData.climate = {
      temperature,
      humidity,
      pressure: pressure || null,
      timestamp: new Date()
    };

    console.log('✅ Updated climate data:', sensorData.climate);
    res.status(200).json({ status: 'success', data: sensorData.climate });
  } catch (error) {
    console.error('❌ Climate endpoint error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Soil data endpoint
app.post('/api/soil', (req, res) => {
  try {
    console.log('🌱 Soil data received:', req.body);
    const { moisture } = req.body;
    
    if (typeof moisture !== 'number') {
      console.log('❌ Invalid soil moisture format');
      return res.status(400).json({ error: 'Invalid moisture value' });
    }

    sensorData.soil = {
      moisture,
      timestamp: new Date()
    };

    console.log('✅ Updated soil data:', sensorData.soil);
    res.status(200).json({ status: 'success', data: sensorData.soil });
  } catch (error) {
    console.error('❌ Soil endpoint error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Arduino combined sensor endpoint
app.post('/api/arduino/sensors', (req, res) => {
  try {
    const { temperature, humidity, moisture } = req.body;
    
    console.log('🤖 Arduino data received:', req.body);
    
    // Validate data
    if (typeof temperature !== 'number' || typeof humidity !== 'number' || typeof moisture !== 'number') {
      console.log('❌ Invalid Arduino data format');
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

    console.log('✅ Updated sensor data from Arduino:', sensorData);
    res.status(200).json({ 
      status: 'success', 
      message: 'Sensor data updated',
      data: sensorData 
    });
  } catch (error) {
    console.error('❌ Arduino sensors endpoint error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Arduino pump command endpoint
app.get('/api/arduino/pump', (req, res) => {
  try {
    // Return current pump status for Arduino to read
    const command = sensorData.pumpStatus === 'on' ? 'ON' : 'OFF';
    console.log('🚰 Sending pump command to Arduino:', command);
    res.status(200).send(command);
  } catch (error) {
    console.error('❌ Arduino pump endpoint error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Pump control endpoint
app.post('/api/pump', (req, res) => {
  try {
    console.log('🚰 Pump control request:', req.body);
    const { action } = req.body;
    
    if (!['on', 'off'].includes(action)) {
      console.log('❌ Invalid pump action:', action);
      return res.status(400).json({ error: 'Invalid action. Use "on" or "off"' });
    }

    sensorData.pumpStatus = action;
    console.log(`✅ Pump ${action}`);
    
    res.status(200).json({ 
      status: 'success',
      pumpStatus: action,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('❌ Pump endpoint error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Status endpoint with enhanced logging
app.get('/api/status', (req, res) => {
  try {
    console.log('📊 Status request from:', req.headers.origin || 'unknown');
    
    const response = {
      ...sensorData,
      serverTime: new Date(),
      uptime: process.uptime(),
      serverStatus: 'active'
    };
    
    console.log('📤 Sending status response:', JSON.stringify(response, null, 2));
    res.status(200).json(response);
  } catch (error) {
    console.error('❌ Status endpoint error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Test endpoint for CORS debugging
app.get('/api/test', (req, res) => {
  console.log('🧪 Test endpoint hit from:', req.headers.origin);
  res.status(200).json({
    message: 'CORS test successful!',
    origin: req.headers.origin,
    userAgent: req.headers['user-agent'],
    timestamp: new Date()
  });
});

// Catch-all route for undefined endpoints
app.use('*', (req, res) => {
  console.log('❓ Unknown endpoint requested:', req.originalUrl);
  res.status(404).json({ 
    error: 'Endpoint not found',
    requestedUrl: req.originalUrl,
    availableEndpoints: [
      'GET /',
      'GET /health',
      'GET /api/status',
      'GET /api/test',
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
  console.error('💥 Server error:', err);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
    timestamp: new Date()
  });
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('🛑 Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log('🚀 ================================');
  console.log(`🌱 Smart Irrigation System API`);
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Allowed origins: ${allowedOrigins.join(', ')}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`⏰ Started at: ${new Date().toISOString()}`);
  console.log('🚀 ================================');
});