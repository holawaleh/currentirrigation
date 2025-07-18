let pumpStatus = false;

module.exports = (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'GET') {
    // Get pump status
    res.status(200).json({
      success: true,
      pumpStatus: pumpStatus
    });
    return;
  }

  if (req.method === 'POST') {
    let body = '';
    
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      try {
        const { status } = JSON.parse(body);
        
        // In a real implementation, this would control actual hardware
        pumpStatus = status;
        console.log(`Water pump ${status ? 'ON' : 'OFF'}`);
        
        res.status(200).json({
          success: true,
          message: `Water pump turned ${status ? 'ON' : 'OFF'}`,
          pumpStatus: status
        });
      } catch (error) {
        res.status(400).json({
          success: false,
          error: 'Invalid JSON'
        });
      }
    });
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
};