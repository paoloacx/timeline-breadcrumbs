// =================================================================
// APP (app.js) - ENTRY POINT
// =================================================================
// Este es el archivo principal de la aplicación.
// Inicializa la app.
// Debe cargarse DESPUÉS de todos los demás módulos.

/**
 * Fully reloads the application to sync data.
 */
window.syncData = function() {
    location.reload();
}

/**
 * Refreshes data from Firebase if online, otherwise reloads.
 */
function refreshApp() {
    // Funciones y variables de firebase-config.js
    if (window.currentUser && !window.isOfflineMode) {
        window.loadDataFromFirebase();
        window.loadSettingsFromFirebase();
        alert('✅ Synced!');
    } else {
        location.reload();
    }
}


// --- App Initialization ---

document.addEventListener('DOMContentLoaded', () => {
    // loadSettings() se define en settings-manager.js
    if (typeof window.loadSettings === 'function') {
        window.loadSettings();
    } else {
        console.warn("loadSettings() not found. Firebase auth will load them.");
    }
    
    // loadData() se define en data-manager.js
    if (typeof loadData === 'function') {
        loadData(); // Carga datos locales
    } else {
        console.error("loadData() no está definido.");
    }
    
    // Poblar selectores de formularios (de settings-manager.js)
    if (typeof window.updateTimerOptions === 'function') {
        window.updateTimerOptions();
    }
    if (typeof window.updateTrackOptions === 'function') {
        window.updateTrackOptions();
    }
    
    // El listener onAuthStateChanged en firebase-config.js
    // se encargará de llamar a loadDataFromFirebase y loadSettingsFromFirebase
    // cuando el usuario inicie sesión.
});
