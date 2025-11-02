// ===== modules/services/api-services.js (External APIs) =====

// Imports
// CAMBIO: Las rutas ahora suben dos niveles (../../) y apuntan a 'core/'
import { setCoords } from '../../core/state.js';
import { showMiniMap } from '../../ui-renderer.js';
import { getWeatherEmoji } from '../../utils.js';
import { renderBSOResults, selectTrackUI } from '../../ui-renderer.js';

const WEATHER_API_KEY = '317f7bcb07cf05e2c6265176c502a4bb';

/**
 * Gets GPS coordinates and fetches weather/location.
 */
export async function handleGps() {
    const btn = document.getElementById('btn-get-gps');
    const locationInput = document.getElementById('location-input');
    btn.textContent = '⏳ Searching...';
    btn.disabled = true;

    if (!navigator.geolocation) {
        alert('Geolocation not available');
        btn.textContent = '🌍 Use GPS';
        btn.disabled = false;
        return;
    }

    try {
        const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            });
        });

        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        setCoords({ lat, lon });
        
        locationInput.placeholder = 'Getting location...';
        showMiniMap(lat, lon, 'form-map');
        
        await getWeather(lat, lon); 
        
        btn.textContent = '🌍 GPS OK';
        btn.disabled = false;

    } catch (error) {
        console.error('GPS Error:', error);
        btn.textContent = '🌍 Use GPS';
        btn.disabled = false;
    }
}

/**
 * Fetches weather data from OpenWeatherMap.
 */
async function getWeather(lat, lon) {
    const weatherInput = document.getElementById('weather-input');
    const locationInput = document.getElementById('location-input');
    weatherInput.value = '⏳ Getting weather...';
    
    try {
        const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=metric&lang=en`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Weather API returned ' + response.status);
        
        const data = await response.json();
        const temp = Math.round(data.main.temp);
        const description = data.weather[0].description;
        const emoji = getWeatherEmoji(data.weather[0].id);
        const city = data.name || 'Unknown';
        
        weatherInput.value = `${emoji} ${description}, ${temp}°C in ${city}`;
        if (!locationInput.value) {
            locationInput.value = city;
        }
    } catch (error) {
        console.error('Error getting weather:', error);
        weatherInput.value = '';
    }
}

/**
 * Searches the iTunes API for a song.
 */
export async function handleSearchBSO() {
    const query = document.getElementById('recap-bso').value.trim();
    if (!query) {
        alert('Please enter a song or artist name');
        return;
    }
    
    const resultsDiv = document.getElementById('recap-bso-results');
    resultsDiv.innerHTML = '<div style="padding: 12px; text-align: center;">Searching...</div>';
    
    try {
        const url = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=10`;
        const response = await fetch(url);
        
        if (!response.ok) throw new Error(`iTunes API error: ${response.status}`);
        
        const data = await response.json();
        renderBSOResults(data.results || []);

    } catch (error) {
        console.error('Error searching BSO:', error);
        resultsDiv.innerHTML = '<div style="padding: 12px; text-align: center; color: red;">Error searching. Try again.</div>';
    }
}
