// =================================================================
// UTILITIES (utils.js)
// =================================================================
// Funciones de utilidad generales (formato de fechas, helpers, etc.)

/**
 * Sets the current date and time in a datetime-local input field.
 * @param {string} inputId - The ID of the input element.
 */
function setCurrentDateTime(inputId) {
    const input = document.getElementById(inputId);
    if (!input) return; // Guard clause
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    
    const dateTimeString = `${year}-${month}-${day}T${hours}:${minutes}`;
    input.value = dateTimeString;
}

/**
 * Gets an ISO string timestamp from a datetime-local input.
 * @param {string} inputId - The ID of the input element.
 * @returns {string} ISO date string.
 */
function getTimestampFromInput(inputId) {
    const value = document.getElementById(inputId).value;
    if (!value) return new Date().toISOString();
    return new Date(value).toISOString();
}

/**
 * Returns a weather emoji based on the OpenWeather API code.
 * @param {number} code - The weather condition code.
 * @returns {string} A weather emoji.
 */
function getWeatherEmoji(code) {
    if (code >= 200 && code < 300) return '⛈️';
    if (code >= 300 && code < 400) return '🌦️';
    if (code >= 500 && code < 600) return '🌧️';
    if (code >= 600 && code < 700) return '❄️';
    if (code >= 700 && code < 800) return '🌫️';
    if (code === 800) return '☀️';
    if (code > 800) return '☁️';
    return '🌤️';
}

/**
 * Formats a timestamp into a full, readable date string.
 * e.g., "Monday, 1 November, 2025"
 * @param {string} timestamp - ISO date string.
 * @returns {string} Formatted date.
 */
function formatDate(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en', { // 'en' for consistent format
        weekday: 'long',
        day: 'numeric', 
        month: 'long', 
        year: 'numeric'
    });
}

/**
 * Formats a timestamp into a 24-hour time string.
 * e.g., "14:30"
 * @param {string} timestamp - ISO date string.
 * @returns {string} Formatted time.
 */
function formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
}

/**
 * Calculates the end time given a start timestamp and a duration in minutes.
 * @param {string} timestamp - ISO date string (start time).
 * @param {number} durationMinutes - Duration in minutes.
 * @returns {string} Formatted end time (e.g., "15:00").
 */
function calculateEndTime(timestamp, durationMinutes) {
    const date = new Date(timestamp);
    date.setMinutes(date.getMinutes() + durationMinutes);
    return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
}

/**
 * Gets a YYYY-MM-DD key from a timestamp for grouping entries by day.
 * @param {string} timestamp - ISO date string.
 * @returns {string} Day key (e.g., "2025-11-01").
 */
function getDayKey(timestamp) {
    const date = new Date(timestamp);
    return date.toISOString().split('T')[0];
}
