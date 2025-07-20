// API endpoint to receive data from Arduino
// This mirrors your backend server endpoint structure

let latestSensorData = {
  temperature: 0,
  humidity: 0,
  moisture: 0,
  pumpActive: false,
  timestamp: new Date().toISOString()
};

// Store recent readings for history
let sensorHistory = [];

export default function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'POST') {
    try {
      const { temperature, humidity, moisture } = req.body;
      
      console.log('Received Arduino data:', req.body);
      
      // Determine pump status based on moisture level
      const moistureLevel = parseInt(moisture) || 0;
      const pumpActive = moistureLevel < 40; // Based on your Arduino threshold
      
      // Update latest readings
      latestSensorData = {
        temperature: parseFloat(temperature) || 0,
        humidity: parseFloat(humidity) || 0,
        moisture: moistureLevel,
        pumpActive: pumpActive,
        timestamp: new Date().toISOString()
      };

      // Add to history
      sensorHistory.push({
        ...latestSensorData,
        timestamp: Date.now()
      });

      // Keep only last 24 readings
      if (sensorHistory.length > 24) {
        sensorHistory = sensorHistory.slice(-24);
      }

      // Forward data to main sensors endpoint
      updateMainSensorData(latestSensorData);

      res.status(200).json({ 
        success: true, 
        message: 'Sensor data received successfully',
        data: latestSensorData 
      });
    } catch (error) {
      console.error('Error processing Arduino data:', error);
      res.status(400).json({ 
        success: false, 
        error: error.message 
      });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}

// Function to update the main sensor data (shared state)
function updateMainSensorData(data) {
  // In a real application, this would update a database
  // For now, we'll use the shared module state
  try {
    // This would typically be a database update
    console.log('Updated main sensor data:', data);
  } catch (error) {
    console.error('Error updating main sensor data:', error);
  }
}