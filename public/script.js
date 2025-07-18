class SmartIrrigationSystem {
    constructor() {
        this.pumpStatus = false;
        this.init();
    }

    init() {
        this.loadWeatherData();
        this.initPumpControl();
        this.startPeriodicUpdates();
    }

    async loadWeatherData() {
        try {
            const response = await fetch('/api/weather');
            const result = await response.json();

            if (result.success) {
                this.updateWeatherDisplay(result.data, result.location);
            } else {
                this.handleError('Failed to load weather data');
            }
        } catch (error) {
            console.error('Error loading weather data:', error);
            this.handleError('Connection error');
        }
    }

    updateWeatherDisplay(data, location) {
        // Update header live feed
        const liveFeed = document.getElementById('liveFeed');
        liveFeed.innerHTML = `
            <span class="status-indicator status-online"></span>
            Live weather feed from ${location} • Temperature: ${data.temperature}°C • Humidity: ${data.humidity}%
        `;

        // Update forecast card
        document.getElementById('forecast-temperature').textContent = `${data.temperature}°C`;
        document.getElementById('forecast-pressure').textContent = `${Math.round(data.pressure)} hPa`;
        document.getElementById('forecast-soil').textContent = `${data.soilMoisture.toFixed(3)} m³/m³`;
        document.getElementById('forecast-humidity').textContent = `${data.humidity}%`;

        // Update location reading card (simulating local sensors with slight variations)
        const tempVariation = (Math.random() - 0.5) * 2; // ±1°C variation
        const humidityVariation = (Math.random() - 0.5) * 6; // ±3% variation
        const pressureVariation = (Math.random() - 0.5) * 10; // ±5 hPa variation
        const soilVariation = (Math.random() - 0.5) * 0.02; // ±0.01 m³/m³ variation

        document.getElementById('location-temperature').textContent = `${(data.temperature + tempVariation).toFixed(1)}°C`;
        document.getElementById('location-pressure').textContent = `${Math.round(data.pressure + pressureVariation)} hPa`;
        document.getElementById('location-soil').textContent = `${(data.soilMoisture + soilVariation).toFixed(3)} m³/m³`;
        document.getElementById('location-humidity').textContent = `${Math.round(data.humidity + humidityVariation)}%`;
    }

    handleError(message) {
        const liveFeed = document.getElementById('liveFeed');
        liveFeed.innerHTML = `
            <span class="status-indicator status-offline"></span>
            ${message}
        `;

        // Show error values
        const errorValue = '--';
        document.getElementById('forecast-temperature').textContent = `${errorValue}°C`;
        document.getElementById('forecast-pressure').textContent = `${errorValue} hPa`;
        document.getElementById('forecast-soil').textContent = `${errorValue} m³/m³`;
        document.getElementById('forecast-humidity').textContent = `${errorValue}%`;

        document.getElementById('location-temperature').textContent = `${errorValue}°C`;
        document.getElementById('location-pressure').textContent = `${errorValue} hPa`;
        document.getElementById('location-soil').textContent = `${errorValue} m³/m³`;
        document.getElementById('location-humidity').textContent = `${errorValue}%`;
    }

    initPumpControl() {
        const pumpSwitch = document.getElementById('pumpSwitch');
        
        // Load initial pump status
        this.loadPumpStatus();
        
        // Handle switch toggle
        pumpSwitch.addEventListener('change', async (e) => {
            const newStatus = e.target.checked;
            await this.togglePump(newStatus);
        });
    }

    async loadPumpStatus() {
        try {
            const response = await fetch('/api/pump');
            const result = await response.json();
            
            if (result.success) {
                this.pumpStatus = result.pumpStatus;
                document.getElementById('pumpSwitch').checked = this.pumpStatus;
            }
        } catch (error) {
            console.error('Error loading pump status:', error);
        }
    }

    async togglePump(status) {
        try {
            const response = await fetch('/api/pump', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status })
            });

            const result = await response.json();
            
            if (result.success) {
                this.pumpStatus = status;
                this.showPumpNotification(status);
                console.log(result.message);
            } else {
                // Revert switch if operation failed
                document.getElementById('pumpSwitch').checked = this.pumpStatus;
                alert('Failed to control pump');
            }
        } catch (error) {
            console.error('Error controlling pump:', error);
            // Revert switch if operation failed
            document.getElementById('pumpSwitch').checked = this.pumpStatus;
            alert('Connection error');
        }
    }

    showPumpNotification(status) {
        // Create a simple notification
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${status ? '#4CAF50' : '#f44336'};
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            font-weight: 500;
            z-index: 1000;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            animation: slideIn 0.3s ease-out;
        `;
        notification.textContent = `Water pump ${status ? 'ON' : 'OFF'}`;
        
        // Add animation CSS
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(notification);
        
        // Remove notification after 3 seconds
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    startPeriodicUpdates() {
        // Update weather data every 5 minutes
        setInterval(() => {
            console.log('Updating weather data...');
            this.loadWeatherData();
        }, 30 * 1000); // Update every 30 seconds for testing, change to 5 * 60 * 1000 for production
    }
}

// Initialize the system when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new SmartIrrigationSystem();
});