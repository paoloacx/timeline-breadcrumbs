// ===== app.js (Main Entry Point) =====
// Imports
import { initAuth, loadFirebaseData } from './firebase-config.js';
import { initUI } from './ui-handlers.js';
import { loadData as loadLocalData } from './data-storage.js';
import { loadSettings as loadLocalSettings } from './settings-manager.js';
import { getState } from './state.js';

/**
 * Initializes the application.
 * This function is called once the DOM is fully loaded.
 */
function initApp() {
    console.log('App initializing...');
    
    // 1. Initialize Authentication (sets up onAuthStateChanged listener)
    initAuth(onUserLoggedIn, onUserLoggedOut);
    
    // 2. Initialize all UI event listeners (buttons, clicks, etc.)
    initUI();
}

/**
 * Callback function executed when a user is successfully logged in.
 */
function onUserLoggedIn(user) {
    console.log('User is logged in. Loading cloud data.');
    // Load cloud data, which will then trigger settings load and timeline render
    loadFirebaseData();
}

/**
 * Callback function executed when no user is logged in (or on logout).
 */
function onUserLoggedOut() {
    console.log('User is logged out. Loading local data.');
    // 1. Load local settings (moods, etc.)
    loadLocalSettings();
    
    // 2. Load local entries
    loadLocalData();
    
    // 3. Show the main app (offline mode)
    // We check for the state flag set by btn-continue-offline
    if (getState().isOfflineMode) {
        if (typeof window.showMainApp === 'function') {
            window.showMainApp(); // This function is still global from firebase-config for now
        }
    }
}

// --- App Entry Point ---
document.addEventListener('DOMContentLoaded', initApp);
