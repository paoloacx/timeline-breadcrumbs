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
    console.log('App initializing...');
    
    // 1. Initialize Authentication (sets up onAuthStateChanged listener)
    initAuth(onUserLoggedIn, onUserLoggedOut);
    
    // 2. Initialize all UI event listeners (botones, formularios, etc.)
    initUI(onOfflineClicked);
    
    // 3. Initialize Timeline listeners (clicks en editar, preview, expandir)
    initTimeline();
}

/**
 * Callback function executed when a user is successfully logged in.
 */
function onUserLoggedIn(user) {
    console.log('User is logged in. Showing app and loading local data first.');
    showMainApp(user); // Muestra la UI principal
    
    // CHANGED: 1. Load local data for instant UI
    // This renders the timeline immediately with stored data.
    loadLocalData(); 
    
    // CHANGED: 2. Start cloud sync in the background
    // This will fetch from Firebase, update the state, and re-render the timeline.
    console.log('Starting cloud data sync...');
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
    
    // 3. Show the main app IF user clicked "Continue Offline"
    if (getState().isOfflineMode) {
        showMainApp(null);
    }
}

/**
 * Callback for when the "Continue Offline" button is clicked.
 */
function onOfflineClicked() {
    setOfflineMode(true);
    onUserLoggedOut();
}

// --- App Entry Point ---
document.addEventListener('DOMContentLoaded', initApp);
