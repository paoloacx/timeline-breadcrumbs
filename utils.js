// ===== UTILITY FUNCTIONS =====

/**
 * Sets the current date and time in a datetime-local input field.
 * @param {string} inputId - The ID of the input element.
 */
window.setCurrentDateTime = function(inputId) {
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
window.getTimestampFromInput = function(inputId) {
    const value = document.getElementById(inputId).value;
    if (!value) return new Date().toISOString();
    return new Date(value).toISOString();
}

/**
 * Formats a timestamp into a readable date string (e.g., "Monday, 1 January 2024").
 * @param {string} timestamp - ISO date string.
 * @returns {string} Formatted date.
 */
window.formatDate = function(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en', { // 'en' para formato consistente
        weekday: 'long',
        day: 'numeric', 
        month: 'long', 
        year: 'numeric'
    });
}

/**
 * Formats a timestamp into a 24-hour time string (e.g., "14:30").
 * @param {string} timestamp - ISO date string.
 * @returns {string} Formatted time.
 */
window.formatTime = function(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
}

/**
 * Calculates the end time given a start time and duration.
 * @param {string} timestamp - ISO date string.
 * @param {number} durationMinutes - Duration in minutes.
 * @returns {string} Formatted end time.
 */
window.calculateEndTime = function(timestamp, durationMinutes) {
    const date = new Date(timestamp);
    date.setMinutes(date.getMinutes() + durationMinutes);
    return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
}

/**
 * Gets the date key (YYYY-MM-DD) from a timestamp.
 * @param {string} timestamp - ISO date string.
 * @returns {string} Date key.
 */
window.getDayKey = function(timestamp) {
    const date = new Date(timestamp);
    return date.toISOString().split('T')[0];
}

/**
 * Returns a weather emoji based on the OpenWeatherMap API code.
 * @param {number} code - Weather condition code.
 * @returns {string} Emoji.
 */
window.getWeatherEmoji = function(code) {
    if (code >= 200 && code < 300) return '⛈️';
    if (code >= 300 && code < 400) return '🌦️';
    if (code >= 500 && code < 600) return '🌧️';
    if (code >= 600 && code < 700) return '❄️';
    if (code >= 700 && code < 800) return '🌫️';
    if (code === 800) return '☀️';
    if (code > 800) return '☁️';
    return '🌤️';
}
