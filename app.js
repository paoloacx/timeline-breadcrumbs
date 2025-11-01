// Weather API Key
const WEATHER_API_KEY = '317f7bcb07cf05e2c6265176c502a4bb';

// Global variables
window.entries = [];
let currentImages = [];
let currentAudio = null;
let currentCoords = null;
let editingEntryId = null;
let selectedMood = null;
let selectedDuration = null;
let selectedActivity = null;
let selectedTrackItem = null;

let mediaRecorder = null;
let audioChunks = [];

// Refresh function
function refreshApp() {
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

// CAMBIO: loadSettings() se movió a settings-manager.js
// CAMBIO: saveSettingsToStorage() se movió a settings-manager.js

// Load data from localStorage
function loadData() {
    const saved = localStorage.getItem('timeline-entries');
    if (saved) {
        try {
            window.entries = JSON.parse(saved);
        } catch(e) {
            console.error("Error parsing entries from localStorage", e);
            window.entries = [];
        }
    }
    window.renderTimeline(); // CAMBIO: Llama a la función global (en ui-renderer.js)
}

// Save data to localStorage
function saveData() {
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

// CAMBIO: toggleForm() movido a ui-handlers.js
// CAMBIO: toggleTimer() movido a ui-handlers.js
// CAMBIO: toggleTrack() movido a ui-handlers.js
// CAMBIO: toggleSpent() movido a ui-handlers.js
// CAMBIO: setCurrentDateTime() movido a utils.js
// CAMBIO: getTimestampFromInput() movido a utils.js

// Clear form
function clearForm() {
    document.getElementById('note-input').value = '';
    document.getElementById('location-input').value = '';
    document.getElementById('weather-input').value = '';
    currentImages = [];
    currentAudio = null;
    currentCoords = null;
    editingEntryId = null;
    selectedMood = null;
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

// CAMBIO: cancelEdit() movido a ui-handlers.js
// CAMBIO: getGPS() movido a api-services.js
// CAMBIO: getWeather() movido a api-services.js
// CAMBIO: getWeatherEmoji() movido a utils.js
// CAMBIO: showMiniMap() movido a ui-renderer.js
// CAMBIO: handleImages() movido a media-handlers.js
// CAMBIO: startRecording() movido a media-handlers.js
// CAMBIO: stopRecording() movido a media-handlers.js
// CAMBIO: renderImagePreviews() movido a ui-renderer.js
// CAMBIO: renderAudioPreview() movido a ui-renderer.js
// CAMBIO: removeImage() movido a media-handlers.js
// CAMBIO: removeAudio() movido a media-handlers.js
// CAMBIO: renderMoodSelector() movido a ui-renderer.js
// CAMBIO: selectMood() movido a ui-handlers.js
// CAMBIO: saveEntry() movido a crud-handlers.js
// CAMBIO: editEntry() movido a crud-handlers.js
// CAMBIO: editTimeEvent() movido a crud-handlers.js
// CAMBIO: selectDuration() movido a ui-handlers.js
// CAMBIO: selectActivity() movido a ui-handlers.js

function checkTimerReady() {
    const createBtn = document.getElementById('create-time-btn');
    if (selectedDuration && selectedActivity) {
        createBtn.disabled = false;
    } else {
        createBtn.disabled = true;
    }
}

// CAMBIO: createTimeEvent() movido a crud-handlers.js

function resetTimerSelections() {
    selectedDuration = null;
    selectedActivity = null;
    editingEntryId = null;
    document.querySelectorAll('.duration-option').forEach(el => el.classList.remove('selected'));
    document.querySelectorAll('#activity-selector .activity-option').forEach(el => el.classList.remove('selected'));
    document.getElementById('create-time-btn').disabled = true;
    document.getElementById('create-time-btn').textContent = 'Create Event';
    document.getElementById('delete-time-btn').classList.add('hidden');
    document.getElementById('time-optional-note').value = '';
}

// CAMBIO: renderTrackSelector() movido a ui-renderer.js
// CAMBIO: selectTrackItem() movido a ui-handlers.js
// CAMBIO: editTrackEvent() movido a crud-handlers.js
// CAMBIO: saveTrackEvent() movido a crud-handlers.js
// CAMBIO: editSpentEvent() movido a crud-handlers.js
// CAMBIO: saveSpent() movido a crud-handlers.js
// CAMBIO: deleteCurrentEntry() movido a crud-handlers.js
// CAMBIO: previewEntry() movido a ui-handlers.js
// CAMBIO: closePreview() movido a ui-handlers.js
// CAMBIO: showImageInModal() movido a ui-handlers.js
// CAMBIO: toggleReadMore() movido a ui-handlers.js
// CAMBIO: formatDate() movido a utils.js
// CAMBIO: formatTime() movido a utils.js
// CAMBIO: calculateEndTime() movido a utils.js
// CAMBIO: getDayKey() movido a utils.js
// CAMBIO: toggleDay() movido a ui-handlers.js
// CAMBIO: toggleRecap() movido a ui-handlers.js
// CAMBIO: renderTimeline() movido a ui-renderer.js
// CAMBIO: Funciones de RECAP movidas (buscarBSO, saveRecap, etc.)
// CAMBIO: Funciones de FAB menu movidas (toggleFabMenu, etc.)

// Initialize app
// Cargar datos y settings al inicio
document.addEventListener('DOMContentLoaded', () => {
    // CAMBIO: Llamar a la función global de settings-manager.js
    if (typeof window.loadSettings === 'function') {
        window.loadSettings();
    } else {
        // Esto es un error normal si settings-manager.js aún no está cargado,
        // firebase-config.js llamará a loadSettingsFromFirebase() que también llama a loadSettings().
    }
    
    loadData(); // Carga datos locales
    
    // CAMBIO: Llamar a las funciones globales de settings-manager.js
    // para poblar los selectores de los formularios (que están ocultos)
    if (typeof window.updateTimerOptions === 'function') {
        window.updateTimerOptions();
    }
    if (typeof window.updateTrackOptions === 'function') {
        window.updateTrackOptions();
    }
    
    // Las funciones de login (signInWithGoogle, etc.) están en firebase-config.js
    // y se llaman directamente desde el HTML.
    
    // El listener onAuthStateChanged en firebase-config.js
    // se encargará de llamar a loadDataFromFirebase y loadSettingsFromFirebase
});
