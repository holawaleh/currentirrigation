const fetch = require('node-fetch').default;

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const latitude = 8.4966; // Ilorin, Nigeria
    const longitude = 4.5421;
    
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m,relative_humidity_2m,surface_pressure,soil_moisture_0_1cm&timezone=Africa/Lagos&forecast_days=1`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error('Failed to fetch weather data');
    }
    
    // Get the current hour's data (first element in the arrays)
    const currentData = {
      temperature: data.hourly.temperature_2m[0],
      humidity: data.hourly.relative_humidity_2m[0],
      pressure: data.hourly.surface_pressure[0],
      soilMoisture: data.hourly.soil_moisture_0_1cm[0],
      timestamp: data.hourly.time[0]
    };
    
    res.status(200).json({
      success: true,
      data: currentData,
      location: 'Ilorin, Nigeria'
    });
  } catch (error) {
    console.error('Error fetching weather data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch weather data'
    });
  }
};