const API_BASE = "https://currentirrigation.onrender.com/api";

async function fetchSensorData() {
  try {
    const [dhtRes, moistureRes, pumpRes] = await Promise.all([
      fetch(`${API_BASE}/sensors/dht`),
      fetch(`${API_BASE}/sensors/moisture`),
      fetch(`${API_BASE}/pump/status`)
    ]);

    if (!dhtRes.ok || !moistureRes.ok || !pumpRes.ok) {
      throw new Error("❌ One or more endpoints failed");
    }

    const dht = await dhtRes.json();
    const moisture = await moistureRes.json();
    const pump = await pumpRes.json();

    document.getElementById("temp").textContent = `🌡️ Temperature: ${dht.temperature} °C`;
    document.getElementById("humidity").textContent = `💧 Humidity: ${dht.humidity} %`;
    document.getElementById("moisture").textContent = `🌱 Moisture: ${moisture.moisture}`;
    document.getElementById("pumpStatus").textContent = `🚰 Pump Status: ${pump.status}`;

  } catch (err) {
    console.error("Failed to fetch sensor data:", err);
  }
}

// Refresh data every 5 seconds
fetchSensorData();
setInterval(fetchSensorData, 5000);
