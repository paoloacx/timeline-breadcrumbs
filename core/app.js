// ===== core/app.js (Main Entry Point) =====
// Imports
import { initUI } from '../ui-handlers.js'; 
import { showMainApp } from '../modules/ui/modal-manager.js';
import { loadData as loadLocalData } from './storage.js';
import { loadSettings as loadLocalSettings } from '../modules/settings/settings-manager.js';
import { getState, setOfflineMode, setCurrentUser, clearCurrentUser } from './state.js';
import { initTimeline, renderTimeline } from '../modules/timeline/timeline.js';
// --- CHANGED: Import 'handleRedirectResult' ---
import { initGoogleAuth, syncOnLogin, handleRedirectResult } from '../modules/services/gdrive-service.js';

/**
 * Initializes the application.
 * This function is called once the DOM is fully loaded.
 */
function initApp() {
    console.log('App initializing...');
    
    // --- NEW: Check for Google Auth Redirect ---
    const params = new URLSearchParams(window.location.search);
    const authCode = params.get('code');

    if (authCode) {
        console.log('Found auth code in URL. Handling redirect...');
        window.history.replaceState({}, document.title, window.location.pathname);
        
        // Keep auth panel visible but hide buttons
        document.getElementById('auth-container').style.display = 'block';
        const authButtons = document.querySelectorAll('#btn-signin-gdrive, #btn-continue-offline');
        authButtons.forEach(btn => {
            if (btn) btn.style.display = 'none';
        });
        
        // Add loading message
        const loadingMsg = document.createElement('div');
        loadingMsg.style.textAlign = 'center';
        loadingMsg.style.marginTop = '20px';
        loadingMsg.textContent = 'Authenticating...';
        document.getElementById('auth-container').appendChild(loadingMsg);
        
        // Load data first (needed for UI)
        loadLocalSettings();
        loadLocalData();
        
        // Initialize UI and Timeline
        initUI(runOfflineMode);
        initTimeline();
        
        // Initialize auth and handle the code
        initGoogleAuth(onGdriveSignIn);
        handleRedirectResult(authCode);
        
        return;
    }

    // --- Standard App Load (No Auth Code) ---
    
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
        runOfflineMode();
    } else {
        console.log('No persistent session. Initializing Google Auth...');
        // Show auth panel immediately
        document.getElementById('auth-container').style.display = 'block';
        document.getElementById('main-app').style.display = 'none';

        // 5. Initialize Google Auth in background
        const checkGapi = () => {
            if (window.gapi && window.google) {
                // We only pass the onSignIn callback.
                // The redirect flow doesn't have a "silent fail" callback.
                initGoogleAuth(onGdriveSignIn);
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
    
    // Show the app (this hides auth panel and loading message)
    showMainApp(userProfile);
    
    // Data was already loaded, but we must re-render the *full* timeline
    renderTimeline();
    
    // Now check GDrive for newer data
    console.log('Running initial sync...');
    syncOnLogin();
}

/**
 * NEW: Callback for GDrive Sign-Out.
 */
function onGdriveSignOut() {
    // This is now only called by the user clicking "Sign Out"
    console.log('User signed out.');
    clearCurrentUser();
    
    // Show the auth panel
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

    // Hide auth panel
    document.getElementById('auth-container').style.display = 'none';
    
    // Show app (if it was hidden)
    showMainApp(null);
    renderTimeline(); // Re-render in case data was loading
}

// --- App Entry Point ---
document.addEventListener('DOMContentLoaded', initApp);
