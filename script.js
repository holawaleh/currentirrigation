const BASE_URL = "https://currentirrigation.onrender.com";

async function fetchSensorData() {
  try {
    const [dhtRes, moistureRes, pumpRes] = await Promise.all([
      fetch(`${BASE_URL}/api/sensors/dht`),
      fetch(`${BASE_URL}/api/sensors/moisture`),
      fetch(`${BASE_URL}/api/pump/status`)
    ]);

    const dht = await dhtRes.json();
    const moisture = await moistureRes.json();
    const pump = await pumpRes.json();

    document.getElementById('temperature').textContent = dht.temperature ?? '--';
    document.getElementById('humidity').textContent = dht.humidity ?? '--';
    document.getElementById('moisture').textContent = moisture.moisture ?? '--';
    document.getElementById('pumpStatus').textContent = pump.status ?? '--';

  } catch (err) {
    console.error("Failed to fetch sensor data:", err);
  }
}

async function setControl(mode) {
  try {
    const res = await fetch(`${BASE_URL}/api/pump/control`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ control: mode })
    });

    if (res.ok) {
      alert(`Pump mode set to ${mode}`);
    } else {
      alert('Failed to update pump control');
    }
  } catch (err) {
    console.error("Control error:", err);
  }
}

setInterval(fetchSensorData, 3000); // Refresh every 3 sec
fetchSensorData();
