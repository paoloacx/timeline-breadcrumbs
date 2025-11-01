// ===== app.js (Main Entry Point) =====
// Imports
import { initAuth, loadFirebaseData } from './firebase-config.js';
// CAMBIO: Eliminado 'continueOffline' de la importación
import { initUI, showMainApp } from './ui-handlers.js'; // CAMBIO: Importado 'showMainApp'
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
    // CAMBIO: Ahora llama a la función importada 'showMainApp'
    if (getState().isOfflineMode) {
        showMainApp(null);
    }
}

/**
 * Callback for when the "Continue Offline" button is clicked.
 */
function onOfflineClicked() {
    setOfflineMode(true);
    // CAMBIO: Ya no llama a 'continueOffline', sino a 'onUserLoggedOut'
    onUserLoggedOut();
}

// --- App Entry Point ---
document.addEventListener('DOMContentLoaded', initApp);
