// ===== app.js (Main Entry Point) =====
// Imports
import { initAuth, loadFirebaseData, continueOffline } from './firebase-config.js';
import { initUI, showMainApp } from './ui-handlers.js';
import { loadData as loadLocalData } from './data-storage.js';
import { loadSettings as loadLocalSettings } from './settings-manager.js';
import { getState, setOfflineMode } from './state.js';

/**
 * Initializes the application.
 * This function is called once the DOM is fully loaded.
 */
function initApp() {
    console.log('App initializing...');
    
    // 1. Initialize Authentication (sets up onAuthStateChanged listener)
    initAuth(onUserLoggedIn, onUserLoggedOut);
    
    // 2. Initialize all UI event listeners (buttons, clicks, etc.)
    initUI(onOfflineClicked);
}

/**
 * Callback function executed when a user is successfully logged in.
 */
function onUserLoggedIn(user) {
    console.log('User is logged in. Loading cloud data.');
    showMainApp(user); // Muestra la UI principal
    loadFirebaseData(); // Carga datos de Firebase (que carga settings y renderiza)
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
    // Llama a la función de logout para cargar datos locales
    onUserLoggedOut();
}

// --- App Entry Point ---
document.addEventListener('DOMContentLoaded', initApp);
