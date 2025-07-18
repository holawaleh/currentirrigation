let pumpStatus = false;

module.exports = async (req, res) => {
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
    // Control pump
    const { status } = req.body;
    
    // In a real implementation, this would control actual hardware
    pumpStatus = status;
    console.log(`Water pump ${status ? 'ON' : 'OFF'}`);
    
    res.status(200).json({
      success: true,
      message: `Water pump turned ${status ? 'ON' : 'OFF'}`,
      pumpStatus: status
    });
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
};