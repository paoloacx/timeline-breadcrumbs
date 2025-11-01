// =================================================================
// DATA MANAGER (data-manager.js)
// =================================================================
// Gestiona el ciclo de vida de los datos (load/save) de localStorage y Firebase.

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
    // renderTimeline() se cargará desde ui-renderer.js
    if (typeof renderTimeline === 'function') {
        renderTimeline();
    } else {
        console.error("renderTimeline() no está definido al cargar datos.");
    }
}

/**
 * Saves the global entries state to localStorage and (if online) to Firebase.
 */
function saveData() {
    // window.entries se define en state-manager.js
    localStorage.setItem('timeline-entries', JSON.stringify(window.entries));
    
    // window.isOfflineMode y window.currentUser se definen en firebase-config.js
    if (window.currentUser && !window.isOfflineMode) {
        // window.saveDataToFirebase se define en firebase-config.js
        if (typeof window.saveDataToFirebase === 'function') {
            window.saveDataToFirebase();
        }
    }
}
