// ===== UTILITY FUNCTIONS =====

/**
 * Sets the current date and time in a datetime-local input field.
 * @param {string} inputId - The ID of the input element.
 */
export function setCurrentDateTime(inputId) {
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
export function getTimestampFromInput(inputId) {
    const value = document.getElementById(inputId).value;
    if (!value) return new Date().toISOString();
    return new Date(value).toISOString();
}

/**
 * Formats a timestamp into a readable date string (e.g., "Monday, 1 January 2024").
 * @param {string} timestamp - ISO date string.
 * @returns {string} Formatted date.
 */
export function formatDate(timestamp) {
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
export function formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
}

/**
 * Calculates the end time given a start time and duration.
 * @param {string} timestamp - ISO date string.
 * @param {number} durationMinutes - Duration in minutes.
 * @returns {string} Formatted end time.
 */
export function calculateEndTime(timestamp, durationMinutes) {
    const date = new Date(timestamp);
    date.setMinutes(date.getMinutes() + durationMinutes);
    return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
}

/**
 * Gets the date key (YYYY-MM-DD) from a timestamp.
 * @param {string} timestamp - ISO date string.
 * @returns {string} Date key.
 */
export function getDayKey(timestamp) {
    const date = new Date(timestamp);
    return date.toISOString().split('T')[0];
}

/**
 * Returns a weather emoji based on the OpenWeatherMap API code.
 * @param {number} code - Weather condition code.
 * @returns {string} Emoji.
 */
export function getWeatherEmoji(code) {
    if (code >= 200 && code < 300) return '⛈️';
    if (code >= 300 && code < 400) return '🌦️';
    if (code >= 500 && code < 600) return '🌧️';
    if (code >= 600 && code < 700) return '❄️';
    if (code >= 700 && code < 800) return '🌫️';
    if (code === 800) return '☀️';
    if (code > 800) return '☁️';
    return '🌤️';
}


// --- NEW: Nesting Date Functions ---

/**
 * Gets the year key (YYYY) from a timestamp.
 * @param {string} timestamp - ISO date string.
 * @returns {string} Year key.
 */
export function getYearKey(timestamp) {
    return new Date(timestamp).getFullYear().toString();
}

/**
 * Gets the month key (YYYY-MM) from a timestamp.
 * @param {string} timestamp - ISO date string.
 * @returns {string} Month key.
 */
export function getMonthKey(timestamp) {
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
}

/**
 * Gets the start of the week key (YYYY-MM-DD) from a timestamp (assuming Monday is start of week).
 * @param {string} timestamp - ISO date string.
 * @returns {string} Date key for the start of the week.
 */
export function getWeekKey(timestamp) {
    const date = new Date(timestamp);
    const dayOfWeek = date.getDay(); // Sunday = 0, Monday = 1, ...
    const diff = date.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust to Monday
    const monday = new Date(date.setDate(diff));
    return monday.toISOString().split('T')[0];
}

/**
 * Gets the full month name from a month key (e.g., "YYYY-MM").
 * @param {string} monthKey - The "YYYY-MM" string.
 * @returns {string} Full month name (e.g., "January").
 */
export function getMonthName(monthKey) {
    const [year, month] = monthKey.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return date.toLocaleDateString('en', { month: 'long' });
}
