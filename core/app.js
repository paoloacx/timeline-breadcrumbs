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

    // 2. Initialize all UI event listeners
    initUI(runOfflineMode); 
    
    // 3. Initialize Timeline listeners
    initTimeline();

    // 4. Load local data *first* so UI is ready if we go offline
    loadLocalSettings();
    loadLocalData();

    if (isOffline) {
        console.log('Offline mode is persistent. Loading app.');
        // Run offline mode immediately
        runOfflineMode();
    } else {
        console.log('No persistent session. Initializing Google Auth...');
        
        // --- CHANGED: Don't show anything. Wait for auth. ---
        
        // 5. Initialize Google Auth in background
        const checkGapi = () => {
            if (window.gapi && window.google) {
                // Pass both callbacks: onSignIn, and onSignOut (which handles silent fail)
                initGoogleAuth(onGdriveSignIn, onGdriveSignOut);
            } else {
                console.warn('GAPI/GSI script not loaded yet, retrying...');
                setTimeout(checkGapi, 100); // Retry after 100ms
            }
        };
        checkGapi();
    }
}

/**
 * NEW: Callback for successful GDrive Sign-In.
 * @param {object} userProfile - Google User Profile
 */
function onGdriveSignIn(userProfile) {
    console.log('GDrive Sign-In Success:', userProfile.email);
    setCurrentUser(userProfile);
    
    // Show the app (this hides auth panel)
    showMainApp(userProfile);
    
    // Data was already loaded, so just re-render
    renderTimeline(); 
    
    // Now check GDrive for newer data
    console.log('Running initial sync...');
    syncOnLogin();
}

/**
 * NEW: Callback for GDrive Sign-Out OR if silent sign-in fails.
 */
function onGdriveSignOut() {
    console.log('User is not signed in. Showing auth panel.');
    clearCurrentUser();
    
    // If user is *not* in offline mode, show the auth panel.
    if (localStorage.getItem('isOfflineMode') !== 'true') {
        document.getElementById('auth-container').style.display = 'block';
        document.getElementById('main-app').style.display = 'none';
    }
}


/**
 * Encapsulated function to run the app in offline mode.
 * This is called on init (if offline is persistent) or by ui-handler.
 */
function runOfflineMode() {
    console.log('Running in offline mode.');
    
    setOfflineMode(true); 

    // Hide auth panel
    document.getElementById('auth-container').style.display = 'none';
    
    // Show app (if it was hidden)
    showMainApp(null);
    renderTimeline(); // Re-render in case data was loading
}

// --- App Entry Point ---
document.addEventListener('DOMContentLoaded', initApp);
