// Weather API Key
const WEATHER_API_KEY = '317f7bcb07cf05e2c6265176c502a4bb';

// ===== API & EXTERNAL SERVICES =====

/**
 * Gets GPS coordinates and fetches weather/location.
 */
window.getGPS = function() {
    const btn = document.getElementById('gps-btn');
    const locationInput = document.getElementById('location-input');
    btn.textContent = '⏳ Searching...';
    btn.disabled = true;

    if (!navigator.geolocation) {
        alert('Geolocation not available');
        btn.textContent = '🌍 Use GPS';
        btn.disabled = false;
        return;
    }

    navigator.geolocation.getCurrentPosition(
        (position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            currentCoords = { lat, lon }; // global var from app.js
            
            locationInput.placeholder = 'Getting location...';
            
            window.showMiniMap(lat, lon, 'form-map'); // global function in ui-renderer.js
            window.getWeather(lat, lon); // Call local function
            
            btn.textContent = '🌍 GPS OK';
            btn.disabled = false;
        },
        (error) => {
            console.error('GPS Error:', error);
            btn.textContent = '🌍 Use GPS';
            btn.disabled = false;
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        }
    );
}

/**
 * Fetches weather data from OpenWeatherMap.
 * @param {number} lat - Latitude.
 * @param {number} lon - Longitude.
 */
window.getWeather = async function(lat, lon) {
    const weatherInput = document.getElementById('weather-input');
    const locationInput = document.getElementById('location-input');
    
    weatherInput.value = '⏳ Getting weather...';
    
    try {
        const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=metric&lang=en`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error('Weather API returned ' + response.status);
        }
        
        const data = await response.json();
        
        const temp = Math.round(data.main.temp);
        const description = data.weather[0].description;
        const emoji = window.getWeatherEmoji(data.weather[0].id); // global function in utils.js
        const city = data.name || 'Unknown';
        
        weatherInput.value = `${emoji} ${description}, ${temp}°C in ${city}`;
        locationInput.value = city;
    } catch (error) {
        console.error('Error getting weather:', error);
        weatherInput.value = '';
        locationInput.value = ''; // Clear if it fails
    }
}

/**
 * Searches the iTunes API for a song.
 */
window.buscarBSO = async function() {
    const query = document.getElementById('recap-bso').value.trim();
    if (!query) {
        alert('Please enter a song or artist name');
        return;
    }
    
    const resultsDiv = document.getElementById('recap-bso-results');
    resultsDiv.innerHTML = '<div style="padding: 12px; text-align: center;">Searching...</div>';
    
    try {
        // Using a proxy for CORS might be needed in production if iTunes API blocks
        const url = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=5`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`iTunes API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.results && data.results.length > 0) {
            const html = data.results.map(track => `
                <div class="bso-result" style="display: flex; align-items: center; gap: 12px; padding: 8px; border: 2px solid #999; margin-bottom: 8px; cursor: pointer; background: white;" onclick="selectTrack('${track.trackName.replace(/'/g, "\\'")}', '${track.artistName.replace(/'/g, "\\'")}', '${track.trackViewUrl}', '${track.artworkUrl100}')">
                    <img src="${track.artworkUrl100}" style="width: 50px; height: 50px; border: 2px solid #000;">
                    <div style="flex: 1;">
                        <div style="font-weight: bold; font-size: 13px;">${track.trackName}</div>
                        <div style="font-size: 11px; color: #666;">${track.artistName}</div>
                    </div>
                    <div style="font-size: 18px;">▶️</div>
                </div>
            `).join('');
            resultsDiv.innerHTML = html;
        } else {
            resultsDiv.innerHTML = '<div style="padding: 12px; text-align: center; color: #666;">No results found</div>';
        }
    } catch (error) {
        console.error('Error searching BSO:', error);
        resultsDiv.innerHTML = '<div style="padding: 12px; text-align: center; color: red;">Error searching. Try again.</div>';
    }
}
