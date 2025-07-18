const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

// Configure CORS for your frontend
const allowedOrigins = [
  'https://instantirrigation.vercel.app/', // Your Vercel frontend URL
  'http://localhost:3000'               // For local testing
];

app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST'],
  credentials: true
}));

app.use(express.json());

// Your existing endpoints
app.post('/api/climate', (req, res) => {
  // Your existing climate endpoint code
});

app.post('/api/soil', (req, res) => {
  // Your existing soil endpoint code
});

app.post('/api/pump', (req, res) => {
  // Your existing pump endpoint code
});

app.get('/api/status', (req, res) => {
  // Your existing status endpoint code
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Allowed origins: ${allowedOrigins.join(', ')}`);
});