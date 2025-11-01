// =================================================================
// API SERVICES (api-services.js)
// =================================================================
// Contiene funciones para interactuar con APIs externas (Firebase, Weather, etc.)

// (Aquí irían tus funciones existentes de Firebase: loadDataFromFirebase, saveDataToFirebase, etc.)

// --- OpenWeather API ---

/**
 * Fetches weather and location data from OpenWeatherMap API.
 * Updates weather and location input fields.
 * @param {number} lat - Latitude.
 * @param {number} lon - Longitude.
 */
async function getWeather(lat, lon) {
    const weatherInput = document.getElementById('weather-input');
    const locationInput = document.getElementById('location-input');
    
    weatherInput.value = '⏳ Getting weather...';
    
    try {
        // WEATHER_API_KEY se define en state-manager.js
        const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=metric&lang=en`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error('Weather API returned ' + response.status);
        }
        
        const data = await response.json();
        
        const temp = Math.round(data.main.temp);
        const description = data.weather[0].description;
        const emoji = getWeatherEmoji(data.weather[0].id); // getWeatherEmoji está en utils.js
        const city = data.name || 'Unknown';
        
        weatherInput.value = `${emoji} ${description}, ${temp}°C in ${city}`;
        locationInput.value = city;
    } catch (error) {
        console.error('Error getting weather:', error);
        weatherInput.value = '';
        locationInput.value = ''; // Limpiar si falla
    }
}


// --- iTunes Search API ---

/**
 * Searches the iTunes API for a song/artist for the Day Recap BSO.
 * Renders results in the 'recap-bso-results' container.
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
