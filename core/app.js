// ===== core/app.js (Main Entry Point) =====
// Imports
import { initAuth, loadFirebaseData } from '../firebase-config.js';
import { initUI } from '../ui-handlers.js'; 
import { showMainApp } from '../modules/ui/modal-manager.js';
import { loadData as loadLocalData } from './storage.js';
import { loadSettings as loadLocalSettings } from '../modules/settings/settings-manager.js';
import { getState, setOfflineMode } from './state.js';
import { initTimeline } from '../modules/timeline/timeline.js';

/**
 * Initializes the application.
 * This function is called once the DOM is fully loaded.
 */
function initApp() {
    console.log('App initializing... Showing UI immediately.');

    // CHANGED: Load UI and Local Data *immediately*
    // This makes the app load instantly with cached data.
    showMainApp(null); // 1. Show main app structure (title bar, etc.)
    loadLocalSettings(); // 2. Load settings from local storage
    loadLocalData();     // 3. Load entries from local storage & render timeline
    
    // 4. Initialize Auth in the background
    // This will check Firebase and trigger a login or logout callback
    initAuth(onUserLoggedIn, onUserLoggedOut);
    
    // 5. Initialize UI listeners
    initUI(onOfflineClicked);
    
    // 6. Initialize Timeline listeners
    initTimeline();
}

/**
 * Callback function executed when a user is successfully logged in.
 */
function onUserLoggedIn(user) {
    console.log('User is logged in. Syncing cloud data.');
    showMainApp(user);    // Update avatar with user info
    loadFirebaseData(); // Sync from cloud (will update state and re-render)
}

/**
 * Callback function executed when no user is logged in (or on logout).
 */
function onUserLoggedOut() {
    console.log('User is logged out.');
    // If user is not *intentionally* offline, hide the main app.
    // (firebase-config.js will show the login panel)
    if (!getState().isOfflineMode) {
        document.getElementById('main-app').style.display = 'none';
    }
}

/**
 * Callback for when the "Continue Offline" button is clicked.
 */
function onOfflineClicked() {
    setOfflineMode(true);
    // Hide the login panel (it's shown by onUserLoggedOut by default)
    document.getElementById('auth-container').style.display = 'none';
    // Ensure the main app is visible
    showMainApp(null);
}

// --- App Entry Point ---
document.addEventListener('DOMContentLoaded', initApp);
