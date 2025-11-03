// ===== core/app.js (Main Entry Point) =====
// Imports
import { initUI } from '../ui-handlers.js'; 
import { showMainApp } from '../modules/ui/modal-manager.js';
import { loadData as loadLocalData } from './storage.js';
import { loadSettings as loadLocalSettings } from '../modules/settings/settings-manager.js';
import { getState, setOfflineMode, setCurrentUser, clearCurrentUser } from './state.js';
import { initTimeline } from '../modules/timeline/timeline.js';
// NEW: Import GDrive service
import { initGoogleAuth } from '../modules/services/gdrive-service.js';

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
        console.log('No persistent session. Initializing Google Auth.');
        // Show the login panel
        document.getElementById('auth-container').style.display = 'block';
        // Ensure main app is hidden
        document.getElementById('main-app').style.display = 'none';
        
        // 2. Initialize Google Auth
        // The gapi script in index.html must be loaded first
        window.gapi ? initGoogleAuth(onGdriveSignIn, onGdriveSignOut) : console.error("GAPI script not loaded");
    }

    // 3. Initialize all UI event listeners (for login buttons, etc.)
    // Pass 'runOfflineMode' as the callback for the "Continue Offline" button
    initUI(runOfflineMode); 
    
    // 4. Initialize Timeline listeners
    initTimeline();
}

/**
 * NEW: Callback for successful GDrive Sign-In.
 * @param {object} userProfile - Google User Profile
 */
function onGdriveSignIn(userProfile) {
    console.log('GDrive Sign-In Success:', userProfile.email);
    setCurrentUser(userProfile);
    showMainApp(userProfile); // Show app and update avatar
    
    // Load local data first
    loadLocalSettings();
    loadLocalData();
    
    // TODO: Implement GDrive data synchronization
    console.log('TODO: Sync data from GDrive...');
}

/**
 * NEW: Callback for GDrive Sign-Out.
 */
function onGdriveSignOut() {
    console.log('User signed out.');
    clearCurrentUser();
    document.getElementById('auth-container').style.display = 'block';
    document.getElementById('main-app').style.display = 'none';
}


/**
 * Encapsulated function to run the app in offline mode.
 * This is called on init (if offline is persistent) or by ui-handler.
 */
function runOfflineMode() {
    console.log('Running in offline mode.');
    
    setOfflineMode(true); 

    // Hide auth panel if it's somehow visible
    document.getElementById('auth-container').style.display = 'none';

    // Load local data and show app
    loadLocalSettings();
    loadLocalData();
    showMainApp(null); // Show app, (null = no user avatar)
}

// --- App Entry Point ---
document.addEventListener('DOMContentLoaded', initApp);
