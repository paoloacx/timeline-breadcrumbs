// ===== core/app.js (Main Entry Point) =====
// Imports
// REMOVED: Firebase imports
import { initUI } from '../ui-handlers.js'; 
import { showMainApp } from '../modules/ui/modal-manager.js';
import { loadData as loadLocalData } from './storage.js';
import { loadSettings as loadLocalSettings } from '../modules/settings/settings-manager.js';
import { getState, setOfflineMode } from './state.js'; // We'll need to modify setOfflineMode
import { initTimeline } from '../modules/timeline/timeline.js';

/**
 * Initializes the application.
 * This function is called once the DOM is fully loaded.
 */
function initApp() {
    console.log('App initializing...');
    
    // 1. Check for persistent offline mode
    const isOffline = localStorage.getItem('isOfflineMode') === 'true';

    if (isOffline) {
        console.log('Offline mode is persistent. Loading app.');
        // Run offline mode immediately
        runOfflineMode();
    } else {
        console.log('No persistent session. Showing auth panel.');
        // Show the login panel
        document.getElementById('auth-container').style.display = 'block';
        // Ensure main app is hidden
        document.getElementById('main-app').style.display = 'none';
    }

    // 2. Initialize all UI event listeners (for login buttons, etc.)
    // Pass 'runOfflineMode' as the callback for the "Continue Offline" button
    initUI(runOfflineMode); 
    
    // 3. Initialize Timeline listeners
    initTimeline();
}

/**
 * NEW: Encapsulated function to run the app in offline mode.
 * This is called on init (if offline is persistent) or by ui-handler.
 */
function runOfflineMode() {
    console.log('Running in offline mode.');
    
    // This function MUST be modified in state.js to save to localStorage
    setOfflineMode(true); 

    // Hide auth panel if it's somehow visible
    document.getElementById('auth-container').style.display = 'none';

    // Load local data and show app
    loadLocalSettings();
    loadLocalData();
    showMainApp(null); // Show app, (null = no user avatar)
}

// REMOVED: onUserLoggedIn and onUserLoggedOut (Firebase callbacks)

// --- App Entry Point ---
document.addEventListener('DOMContentLoaded', initApp);
