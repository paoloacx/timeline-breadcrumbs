// Global variables
// CAMBIO: Todas las variables de estado AHORA son window. para ser globales
window.entries = [];
window.currentImages = [];
window.currentAudio = null;
window.currentCoords = null;
window.editingEntryId = null;
window.selectedMood = null;
window.selectedDuration = null;
window.selectedActivity = null;
window.selectedTrackItem = null;

window.mediaRecorder = null;
window.audioChunks = [];

// Refresh function
// CAMBIO: Hecho global (window.)
window.refreshApp = function() {
    // Las funciones de FB (currentUser, isOfflineMode) están en firebase-config.js
    if (window.currentUser && !window.isOfflineMode) {
        window.loadDataFromFirebase();
        window.loadSettingsFromFirebase();
        alert('✅ Synced!');
    } else {
        location.reload();
    }
}

// Settings
window.timeDurations = [15, 30, 60, 120, 180];
window.timeActivities = ['Reading', 'Sports', 'Work', 'Cleaning', 'Errands'];
window.trackItems = {
    meals: ['🍳 Breakfast', '🥗 Lunch', '🍽️ Dinner', '☕ Snack'],
    tasks: ['💊 Medicine', '💧 Water', '🚶 Walk', '📞 Call']
};

// Default moods
window.defaultMoods = [
    { emoji: '😊', label: 'Happy' },
    { emoji: '😢', label: 'Sad' },
    { emoji: '😡', label: 'Angry' },
    { emoji: '😰', label: 'Anxious' },
    { emoji: '😴', label: 'Tired' }
];
window.moods = [...window.defaultMoods];


// Load data from localStorage
// CAMBIO: Hecho global (window.)
window.loadData = function() {
    const saved = localStorage.getItem('timeline-entries');
    if (saved) {
        try {
            window.entries = JSON.parse(saved);
        } catch(e) {
            console.error("Error parsing entries from localStorage", e);
            window.entries = [];
        }
    }
    // Llama a la función global (en ui-renderer.js)
    if (typeof window.renderTimeline === 'function') {
        window.renderTimeline();
    }
}

// Save data to localStorage
// CAMBIO: Hecho global (window.)
window.saveData = function() {
    localStorage.setItem('timeline-entries', JSON.stringify(window.entries));
    // Las variables (isOfflineMode, currentUser) y la función (saveDataToFirebase) están en firebase-config.js
    if (!window.isOfflineMode && window.currentUser) {
        window.saveDataToFirebase();
    }
}


// Sync/Refresh data
window.syncData = function() {
    location.reload();
}

// Clear form
// CAMBIO: Hecho global (window.) para que ui-handlers.js pueda usarla
window.clearForm = function() {
    document.getElementById('note-input').value = '';
    document.getElementById('location-input').value = '';
    document.getElementById('weather-input').value = '';
    window.currentImages = [];
    window.currentAudio = null;
    window.currentCoords = null;
    window.editingEntryId = null;
    window.selectedMood = null;
    document.getElementById('image-previews').innerHTML = '';
    document.getElementById('audio-preview').innerHTML = '';
    document.getElementById('delete-btn').classList.add('hidden');
    document.getElementById('save-btn').textContent = '💾 Save';
    document.getElementById('mood-config').classList.add('hidden');
    const mapContainer = document.getElementById('form-map');
    if (mapContainer) {
        mapContainer.style.display = 'none';
        mapContainer.innerHTML = '';
    }
}

// CAMBIO: Hecho global (window.)
window.checkTimerReady = function() {
    const createBtn = document.getElementById('create-time-btn');
    if (window.selectedDuration && window.selectedActivity) {
        createBtn.disabled = false;
    } else {
        createBtn.disabled = true;
    }
}

// CAMBIO: Hecho global (window.)
window.resetTimerSelections = function() {
    window.selectedDuration = null;
    window.selectedActivity = null;
    window.editingEntryId = null;
    document.querySelectorAll('.duration-option').forEach(el => el.classList.remove('selected'));
    document.querySelectorAll('#activity-selector .activity-option').forEach(el => el.classList.remove('selected'));
    document.getElementById('create-time-btn').disabled = true;
    document.getElementById('create-time-btn').textContent = 'Create Event';
    document.getElementById('delete-time-btn').classList.add('hidden');
    document.getElementById('time-optional-note').value = '';
}


// Initialize app
// Cargar datos y settings al inicio
document.addEventListener('DOMContentLoaded', () => {
    // CAMBIO: Llamar a la función global de settings-manager.js
    if (typeof window.loadSettings === 'function') {
        window.loadSettings();
    } else {
        console.warn('window.loadSettings no está listo en DOMContentLoaded');
    }
    
    window.loadData(); // Carga datos locales
    
    // CAMBIO: Llamar a las funciones globales de settings-manager.js
    if (typeof window.updateTimerOptions === 'function') {
        window.updateTimerOptions();
    }
    if (typeof window.updateTrackOptions === 'function') {
        window.updateTrackOptions();
    }
    
    // El listener onAuthStateChanged en firebase-config.js
    // se encargará de llamar a loadDataFromFirebase y loadSettingsFromFirebase
});
