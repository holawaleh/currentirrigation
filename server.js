const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

// Configure CORS - Remove trailing slash and update domain
const allowedOrigins = [
  'https://smart-irrigation-frontend.vercel.app', // Your actual frontend URL
  'http://localhost:3000'
];

app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST'],
  credentials: true
}));

app.use(express.json());

// Add proper endpoint implementations
app.post('/api/climate', (req, res) => {
  const { temperature, humidity } = req.body;
  
  if (typeof temperature !== 'number' || typeof humidity !== 'number') {
    return res.status(400).json({ error: 'Invalid data format' });
  }

  // Store data
  sensorData.climate = {
    temperature,
    humidity,
    timestamp: new Date()
  };

  res.status(200).json({ status: 'success' });
});

// Add similar implementations for other endpoints...

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Allowed origins: ${allowedOrigins.join(', ')}`);
});