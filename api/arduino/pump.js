// API endpoint for pump control commands
// This endpoint is called by your Arduino to check for pump commands

let pumpCommand = 'OFF'; // Default pump state
let lastCommandTime = Date.now();

export default function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'GET') {
    // Arduino calls this to get pump commands
    res.status(200).json({
      command: pumpCommand,
      timestamp: new Date().toISOString()
    });
  } 
  else if (req.method === 'POST') {
    // Web interface can send pump commands
    try {
      const { command } = req.body;
      
      if (command === 'ON' || command === 'OFF') {
        pumpCommand = command;
        lastCommandTime = Date.now();
        
        console.log(`Pump command set to: ${command}`);
        res.status(200).json({ 
          success: true, 
          command: pumpCommand,
          message: `Pump command set to ${command}` 
        });
      } else {
        res.status(400).json({ 
          success: false, 
          error: 'Invalid command. Use ON or OFF' 
        });
      }
    } catch (error) {
      console.error('Error setting pump command:', error);
      res.status(400).json({ 
        success: false, 
        error: error.message 
      });
    }
  } 
  else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}