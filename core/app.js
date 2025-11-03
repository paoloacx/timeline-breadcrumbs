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

    if (isOffline) {
        console.log('Offline mode is persistent. Loading app.');
        // Run offline mode immediately
        runOfflineMode();
    } else {
        console.log('No persistent session. Waiting for GDrive auth...');
        // --- CHANGED: DO NOT show auth panel yet ---
        // We wait for GDrive's silent sign-in to fail first.
        // document.getElementById('auth-container').style.display = 'block';
        document.getElementById('main-app').style.display = 'none';
    }

    // 2. Initialize Google Auth in background
    // This will decide if we need to show the auth panel or auto-login.
    console.log('Initializing Google Auth in background...');
    const checkGapi = () => {
        if (window.gapi) {
            // Pass both callbacks: onSignIn, and onSignOut (which handles silent fail)
            initGoogleAuth(onGdriveSignIn, onGdriveSignOut);
        } else {
            console.warn('GAPI script not loaded yet, retrying...');
            setTimeout(checkGapi, 100); // Retry after 100ms
        }
    };
    checkGapi();


    // 3. Initialize all UI event listeners
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
    
    // Load local data first (in case it's newer)
    loadLocalSettings();
    loadLocalData();
    
    // Show the app (this hides auth panel)
    showMainApp(userProfile);
    
    // Now check GDrive for newer data
    console.log('Running initial sync...');
    syncOnLogin();
}

/**
 * NEW: Callback for GDrive Sign-Out OR if silent sign-in fails.
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
 * This is called on init (if offline is persistent) or by ui-handler.
 */
function runOfflineMode() {
    console.log('Running in offline mode.');
    
    setOfflineMode(true); 

    // Hide auth panel
    document.getElementById('auth-container').style.display = 'none';
    
    // Load local data and show app
    loadLocalSettings();
    loadLocalData();
    showMainApp(null); // Show app, (null = no user avatar)
}

// --- App Entry Point ---
document.addEventListener('DOMContentLoaded', initApp);
