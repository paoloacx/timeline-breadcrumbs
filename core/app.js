// ===== core/app.js (Main Entry Point) =====
// Imports
import { initUI } from '../ui-handlers.js'; 
import { showMainApp } from '../modules/ui/modal-manager.js';
import { loadData as loadLocalData } from './storage.js';
import { loadSettings as loadLocalSettings } from '../modules/settings/settings-manager.js';
import { getState, setOfflineMode, setCurrentUser, clearCurrentUser } from './state.js';
import { initTimeline } from '../modules/timeline/timeline.js';
// NEW: Import GDrive service and sync function
import { initGoogleAuth, syncOnLogin } from '../modules/services/gdrive-service.js';

/**
 * Initializes the application.
 * This function is called once the DOM is fully loaded.
 */
function initApp() {
    console.log('App initializing...');
    
    // 1. Check for persistent offline mode
    const isOffline = localStorage.getItem('isOfflineMode') === 'true';

    // 2. Load local data and show base UI immediately
    // This provides an instant "app" feel, even while auth is loading.
    loadLocalSettings();
    loadLocalData();
    // Show main app, but hide user avatar (null)
    showMainApp(null); 

    if (isOffline) {
        console.log('Offline mode is persistent. Running app.');
        // We already loaded data, just make sure auth panel is hidden
        document.getElementById('auth-container').style.display = 'none';
    } else {
        console.log('No persistent session. Initializing Google Auth.');
        // --- CHANGED: Do NOT show auth panel yet. ---
        // We wait for GAPI to tell us if the user is *already* logged in.
    }

    // 3. Initialize Google Auth in background
    // This will decide if we need to show the auth panel or auto-login.
    console.log('Initializing Google Auth in background...');
    const checkGapi = () => {
        if (window.gapi) {
            initGoogleAuth(onGdriveSignIn, onGdriveSignOut);
        } else {
            console.warn('GAPI script not loaded yet, retrying...');
            setTimeout(checkGapi, 100); // Retry after 100ms
        }
    };
    checkGapi();


    // 4. Initialize all UI event listeners
    initUI(runOfflineMode); 
    
    // 5. Initialize Timeline listeners
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
    
    // We already loaded local data, now we sync.
    console.log('Running initial sync...');
    syncOnLogin();
}

/**
 * NEW: Callback for GDrive Sign-Out OR if user is not logged in.
 */
function onGdriveSignOut() {
    console.log('User is not signed in.');
    clearCurrentUser();
    
    // If user is *not* in offline mode, show the auth panel.
    if (localStorage.getItem('isOfflineMode') !== 'true') {
        document.getElementById('auth-container').style.display = 'block';
        document.getElementById('main-app').style.display = 'none';
    }
}


/**
 * Encapsulated function to run the app in offline mode.
 * Called by UI button.
 */
function runOfflineMode() {
    console.log('Running in offline mode.');
    
    setOfflineMode(true); 

    // Hide auth panel
    document.getElementById('auth-container').style.display = 'none';

    // Show app (if it was hidden)
    showMainApp(null);
    
    // Data is already loaded, but we call this just in case.
    loadLocalSettings();
    loadLocalData();
}

// --- App Entry Point ---
document.addEventListener('DOMContentLoaded', initApp);
