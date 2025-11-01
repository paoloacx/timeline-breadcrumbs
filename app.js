// =================================================================
// APP (app.js) - ENTRY POINT
// =================================================================
// Este es el archivo principal de la aplicación.
// Inicializa la app y maneja el ciclo de vida de los datos (load/save).
// Debe cargarse DESPUÉS de todos los demás módulos.

/**
 * Loads entry data from localStorage into the global state.
 */
function loadData() {
    const saved = localStorage.getItem('timeline-entries');
    if (saved) {
        try {
            // window.entries se define en state-manager.js
            window.entries = JSON.parse(saved);
        } catch(e) {
            console.error("Error parsing entries from localStorage", e);
            window.entries = [];
        }
    }
    renderTimeline(); // de ui-renderer.js
}

/**
 * Saves the global entries state to localStorage and (if online) to Firebase.
 */
function saveData() {
    // window.entries se define en state-manager.js
    localStorage.setItem('timeline-entries', JSON.stringify(window.entries));
    
    // window.isOfflineMode y window.currentUser se definen en firebase-config.js
    if (!window.isOfflineMode && window.currentUser) {
        // window.saveDataToFirebase se define en firebase-config.js
a       window.saveDataToFirebase();
    }
}

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
    
    loadData(); // Carga datos locales
    
    // Poblar selectores de formularios (de settings-manager.js)
    if (typeof window.updateTimerOptions === 'function') {
        window.updateTimerOptions();
    }
    if (typeof window.updateTrackOptions === 'function') {
        window.updateTrackOptions();
    }
    
    // El listener onAuthStateChanged en firebase-config.js
t   // se encargará de llamar a loadDataFromFirebase y loadSettingsFromFirebase
    // cuando el usuario inicie sesión.
});
