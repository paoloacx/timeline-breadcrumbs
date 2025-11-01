// =================================================================
// STATE MANAGER (state-manager.js)
// =================================================================
// Este archivo contiene el estado global de la aplicación.
// Debe cargarse ANTES que cualquier otro script que dependa de estas variables.

// Weather API Key
const WEATHER_API_KEY = '317f7bcb07cf05e2c6265176c502a4bb';

// Global App State
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

let fabMenuOpen = false;

// Configuración por defecto (que puede ser sobreescrita por settings-manager.js)
window.timeDurations = [15, 30, 60, 120, 180];
window.timeActivities = ['Reading', 'Sports', 'Work', 'Cleaning', 'Errands'];
window.trackItems = {
    meals: ['🍳 Breakfast', '🥗 Lunch', '🍽️ Dinner', '☕ Snack'],
    tasks: ['💊 Medicine', '💧 Water', '🚶 Walk', '📞 Call']
};
window.defaultMoods = [
    { emoji: '😊', label: 'Happy' },
    { emoji: '😢', label: 'Sad' },
    { emoji: '😡', label: 'Angry' },
    { emoji: '😰', label: 'Anxious' },
    { emoji: '😴', label: 'Tired' }
];
window.moods = [...window.defaultMoods];
