// API endpoint to serve Arduino sensor data
// This will be deployed on Vercel as a serverless function

let latestSensorData = {
  temperature: 0,
  humidity: 0,
  moisture: 0,
  pumpActive: false,
  timestamp: new Date().toISOString(),
  moistureHistory: []
};

// Store recent readings for history (last 24 readings)
let sensorHistory = [];

export default function handler(req, res) {
  // Enable CORS for all origins
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'GET') {
    // Return the latest sensor data with history
    const responseData = {
      ...latestSensorData,
      moistureHistory: sensorHistory.map(reading => reading.moisture)
    };
    
    res.status(200).json(responseData);
  } 
  else if (req.method === 'POST') {
    // Receive data from Arduino (via your backend server)
    try {
      const { temperature, humidity, moisture, pumpActive } = req.body;
      
      // Update latest readings
      latestSensorData = {
        temperature: parseFloat(temperature) || 0,
        humidity: parseFloat(humidity) || 0,
        moisture: parseInt(moisture) || 0,
        pumpActive: Boolean(pumpActive),
        timestamp: new Date().toISOString()
      };

      // Add to history (keep last 24 readings)
      sensorHistory.push({
        ...latestSensorData,
        timestamp: Date.now()
      });

      // Keep only last 24 readings
      if (sensorHistory.length > 24) {
        sensorHistory = sensorHistory.slice(-24);
      }

      console.log('Sensor data updated:', latestSensorData);
      res.status(200).json({ success: true, message: 'Data received' });
    } catch (error) {
      console.error('Error processing sensor data:', error);
      res.status(400).json({ success: false, error: error.message });
    }
  } 
  else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}