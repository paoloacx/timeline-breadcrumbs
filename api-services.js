// /api-services.js
// Handles all external API communications (Firebase, Weather, iTunes).

import { db, auth } from './firebase-config.js';
import { doc, getDoc, setDoc, writeBatch, deleteDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getState, setState } from './state-manager.js';

// --- External API Keys ---
const WEATHER_API_KEY = '317f7bcb07cf05e2c6265176c502a4bb';

// --- Firestore Database Services ---

/**
 * Loads all timeline entries from Firebase for the current user.
 */
export async function loadDataFromFirebase() {
    const { currentUser } = getState();
    if (!currentUser) return;

    try {
        const docRef = doc(db, "users", currentUser.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const remoteData = docSnap.data().entries || [];
            setState({ entries: remoteData });
            console.log("Data loaded from Firebase.");
            // Save to local storage as well for backup
            localStorage.setItem('timeline-entries', JSON.stringify(remoteData));
        } else {
            console.log("No remote data found. Using local.");
            // No remote data, so we'll just use what's in local state
            // and save it to cloud on next update.
        }
    } catch (e) {
        console.error("Error loading data from Firebase:", e);
    }
}

/**
 * Saves the entire 'entries' array to Firebase.
 */
export async function saveDataToFirebase() {
    const { currentUser, entries, isOfflineMode } = getState();
    if (!currentUser || isOfflineMode) return;

    try {
        const docRef = doc(db, "users", currentUser.uid);
        await setDoc(docRef, { entries: entries }, { merge: true });
        console.log("Data saved to Firebase.");
    } catch (e) {
        console.error("Error saving data to Firebase:", e);
    }
}

/**
 * Deletes a single entry from Firebase.
 * @param {string} entryId - The ID of the entry to delete.
 */
export async function deleteEntryFromFirebase(entryId) {
    const { currentUser, entries, isOfflineMode } = getState();
    if (!currentUser || isOfflineMode) return;

    // This is a "best-effort" delete. We've already deleted it from local state.
    // We just need to sync this deletion to Firebase.
    // We re-save the entire (now smaller) entries array.
    
    // Note: A more scalable way is to use a batch write or cloud function,
    // but for this app's data structure, resaving the array is the
    // simplest way to ensure sync.
    await saveDataToFirebase();
    console.log(`Entry ${entryId} deletion synced to Firebase.`);
}

/**
 * Loads user settings from Firebase.
 */
export async function loadSettingsFromFirebase() {
    const { currentUser } = getState();
    if (!currentUser) return;

    try {
        const settingsRef = doc(db, "settings", currentUser.uid);
        const docSnap = await getDoc(settingsRef);

        if (docSnap.exists()) {
            const settings = docSnap.data();
            // Update local state and local storage
            // This function is defined in settings-manager.js
            window.saveSettingsToStorage(settings);
            console.log("Settings loaded from Firebase.");
        } else {
            console.log("No remote settings found.");
        }
    } catch (e) {
        console.error("Error loading settings from Firebase:", e);
    }
}

/**
 * Saves user settings to Firebase.
 */
export async function saveSettingsToFirebase(settings) {
    const { currentUser, isOfflineMode } = getState();
    if (!currentUser || isOfflineMode) return;

    try {
        const settingsRef = doc(db, "settings", currentUser.uid);
        await setDoc(settingsRef, settings, { merge: true });
        console.log("Settings saved to Firebase.");
    } catch (e) {
        console.error("Error saving settings to Firebase:", e);
    }
}


// --- OpenWeatherMap API Service ---

/**
 * Fetches weather data from OpenWeatherMap.
 * @param {number} lat - Latitude.
 * @param {number} lon - Longitude.
 * @returns {object} - { weatherString: string, city: string }
 */
export async function getWeather(lat, lon) {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=metric&lang=en`;
    
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Weather API returned ' + response.status);
        }
        const data = await response.json();
        
        const temp = Math.round(data.main.temp);
        const description = data.weather[0].description;
        const emoji = getWeatherEmoji(data.weather[0].id);
        const city = data.name || 'Unknown';
        
        return {
            weatherString: `${emoji} ${description}, ${temp}°C in ${city}`,
            city: city
        };
    } catch (error) {
        console.error('Error getting weather:', error);
        return { weatherString: '', city: '' };
    }
}

/**
 * Helper to get an emoji for a weather code.
 * @param {number} code - OpenWeatherMap weather ID.
 * @returns {string} Emoji.
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


// --- iTunes API Service ---

/**
 * Searches the iTunes API for tracks.
 * @param {string} query - The search term.
 * @returns {Array} - A list of track results.
 */
export async function searchiTunesTracks(query) {
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=5`;
    
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`iTunes API error: ${response.status}`);
        }
        const data = await response.json();
        return data.results || [];
    } catch (error) {
        console.error('Error searching iTunes:', error);
        return [];
    }
}
