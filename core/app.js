// ===== core/app.js (Main Entry Point) =====
// Imports
import { initAuth, loadFirebaseData } from '../firebase-config.js';
import { initUI } from '../ui-handlers.js'; 
// CAMBIO: Importa 'showAuthPanel'
import { showMainApp, showAuthPanel } from '../modules/ui/modal-manager.js';
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
    console.log('User is logged in. Loading cloud data.');
    showMainApp(user); // Muestra la UI principal
    loadFirebaseData(); // Carga datos de Firebase (que carga settings y renderiza)
}

/**
 * Callback function executed when no user is logged in (or on logout).
 */
function onUserLoggedOut() {
    console.log('User is logged out.');
    // CAMBIO: Si el usuario NO está en modo offline, muestra el panel de login
    if (!getState().isOfflineMode) {
        showAuthPanel();
    } else {
        // Si ESTÁ en modo offline, carga los datos locales
        console.log('Loading local data for offline mode.');
        loadLocalSettings();
        loadLocalData();
        showMainApp(null); // Muestra la app sin usuario
    }
}

/**
 * Callback for when the "Continue Offline" button is clicked.
 */
function onOfflineClicked() {
    setOfflineMode(true);
    onUserLoggedOut(); // Llama a la lógica de logout, que ahora cargará los datos locales
}

// --- App Entry Point ---
document.addEventListener('DOMContentLoaded', initApp);
