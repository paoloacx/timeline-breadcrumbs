// /utils.js
// Generic, pure utility functions for data formatting.

/**
 * Formats a timestamp into a human-readable date.
 * e.g., "Saturday, November 1, 2025"
 * @param {string} timestamp - ISO string timestamp.
 * @returns {string} Formatted date.
 */
export function formatDate(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en', { // 'en' for consistent format
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
}

/**
 * Formats a timestamp into a human-readable time (24h).
 * e.g., "14:30"
 * @param {string} timestamp - ISO string timestamp.
 * @returns {string} Formatted time.
 */
export function formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
}

/**
 * Calculates the end time based on a start time and duration.
 * @param {string} timestamp - ISO string start time.
 * @param {number} durationMinutes - Duration in minutes.
 * @returns {string} Formatted end time.
 */
export function calculateEndTime(timestamp, durationMinutes) {
    const date = new Date(timestamp);
    date.setMinutes(date.getMinutes() + durationMinutes);
    return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
}

/**
 * Gets a date key (YYYY-MM-DD) from a timestamp.
 * @param {string} timestamp - ISO string timestamp.
 *Example: 2025-11-01
 */
export function getDayKey(timestamp) {
    const date = new Date(timestamp);
    return date.toISOString().split('T')[0];
}

/**
 * Generates a simple UUID for client-side IDs.
 * Used for ensuring unique IDs before saving to DB.
 */
export function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}
