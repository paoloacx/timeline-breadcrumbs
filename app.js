// --- Global variables (Core State) ---
let entries = [];
let currentUser = null;
let isOfflineMode = false;

let currentImages = []; // Used by media-handlers.js, crud-handlers.js
let currentAudio = null; // Used by media-handlers.js, crud-handlers.js
let currentCoords = null; // Used by api-services.js, crud-handlers.js
let editingEntryId = null; // Used by all crud/ui handlers

let selectedMood = null; // Used by crud-handlers.js
let selectedDuration = null; // Used by crud-handlers.js
let selectedActivity = null; // Used by crud-handlers.js
let selectedTrackItem = null; // Used by crud-handlers.js

let mediaRecorder = null; // Used by media-handlers.js
let audioChunks = []; // Used by media-handlers.js

// --- Global settings variables (Core Config) ---
let timeDurations = [15, 30, 60, 120, 180];
let timeActivities = ['Reading', 'Sports', 'Work', 'Cleaning', 'Errands'];
let trackItems = {
    meals: ['🍳 Breakfast', '🥗 Lunch', '🍽️ Dinner', '☕ Snack'],
    tasks: ['💊 Medicine', '💧 Water', '🚶 Walk', '📞 Call']
};
const defaultMoods = [
    { emoji: '😊', label: 'Happy' },
    { emoji: '😢', label: 'Sad' },
    { emoji: '😡', label: 'Angry' },
    { emoji: '😰', label: 'Anxious' },
    { emoji: '😴', label: 'Tired' }
];
let moods = [...defaultMoods];

// --- Core App Listeners ---

// Auth state observer (runs when firebase-config.js loads)
auth.onAuthStateChanged((user) => {
    if (user) {
        currentUser = user;
        isOfflineMode = false;
        console.log('Usuario autenticado:', user.email, 'UID:', user.uid);
        
        // Check if functions exist before calling (robustness)
        if (typeof showMainApp === 'function') showMainApp();
        if (typeof updateSyncStatus === 'function') updateSyncStatus('online');
        if (typeof loadDataFromFirebase === 'function') loadDataFromFirebase();
        if (typeof loadSettingsFromFirebase === 'function') loadSettingsFromFirebase();
        
    } else {
        currentUser = null;
        // When logged out, show auth screen
        const authContainer = document.getElementById('auth-container');
        if (authContainer) authContainer.style.display = 'block';
        const mainApp = document.getElementById('main-app');
        if (mainApp) mainApp.style.display = 'none';
    }
});

// App Initialization on DOM Load
document.addEventListener('DOMContentLoaded', () => {
    // Load local data first
    loadSettings();
    loadData();
    
    // Initialize UI components that depend on settings
    updateTimerOptions();
    updateTrackOptions();
    renderMoodSelector();
    
    // Handle auth state (in case auth loaded *before* DOM)
    if (currentUser) {
        showMainApp();
        updateSyncStatus('online');
        loadDataFromFirebase();
        loadSettingsFromFirebase();
    } else if (isOfflineMode) {
        showMainApp();
        updateSyncStatus('offline');
    } else {
        // Auth screen is shown by default or by onAuthStateChanged
    }
});

// --- Core Data Functions ---

function loadData() {
    const saved = localStorage.getItem('timeline-entries');
    if (saved) {
        entries = JSON.parse(saved);
    }
    if (typeof renderTimeline === 'function') renderTimeline();
}

function saveData() {
    localStorage.setItem('timeline-entries', JSON.stringify(entries));
    if (!isOfflineMode && currentUser && typeof saveDataToFirebase === 'function') {
        saveDataToFirebase();
    }
}

// --- Core Settings Functions ---

function loadSettings() {
    const savedDurations = localStorage.getItem('time-durations');
    const savedActivities = localStorage.getItem('time-activities');
    const savedTrackItems = localStorage.getItem('track-items');
    const savedMoods = localStorage.getItem('mood-config');
    
    if (savedDurations) timeDurations = JSON.parse(savedDurations);
    if (savedActivities) timeActivities = JSON.parse(savedActivities);
    if (savedTrackItems) trackItems = JSON.parse(savedTrackItems);
    if (savedMoods) moods = JSON.parse(savedMoods);
}

function saveSettingsToStorage() {
    localStorage.setItem('time-durations', JSON.stringify(timeDurations));
    localStorage.setItem('time-activities', JSON.stringify(timeActivities));
    localStorage.setItem('track-items', JSON.stringify(trackItems));
    localStorage.setItem('mood-config', JSON.stringify(moods));
}

async function loadSettingsFromFirebase() {
    if (!currentUser) return;
    try {
        const doc = await db.collection('users').doc(currentUser.uid).collection('settings').doc('app-settings').get();
        if (doc.exists) {
            const data = doc.data();
            if (data.timeDurations) timeDurations = data.timeDurations;
            if (data.timeActivities) timeActivities = data.timeActivities;
            if (data.trackItems) trackItems = data.trackItems;
            if (data.moods) moods = data.moods;
            console.log('Configuración cargada para', currentUser.email);
            updateTimerOptions();
            updateTrackOptions();
            renderMoodSelector();
        }
    } catch (error) {
        console.error('Error loading settings from Firebase:', error);
        loadSettings(); // Fallback
    }
}

async function saveSettingsToFirebase() {
    if (!currentUser || isOfflineMode) {
        saveSettingsToStorage();
        return;
    }
    try {
        await db.collection('users').doc(currentUser.uid).collection('settings').doc('app-settings').set({
            timeDurations: timeDurations,
            timeActivities: timeActivities,
            trackItems: trackItems,
            moods: moods,
            updatedAt: new Date().toISOString()
        });
        console.log('Settings saved to Firebase for', currentUser.email);
    } catch (error) {
        console.error('Error saving settings to Firebase:', error);
        saveSettingsToStorage(); // Fallback
    }
}

// --- UI/State Helper Functions (Needed by multiple modules) ---

function refreshApp() {
    if (currentUser && !isOfflineMode) {
        loadDataFromFirebase();
        loadSettingsFromFirebase();
        alert('✅ Synced!');
    } else {
        location.reload();
    }
}

function updateSyncStatus(status) {
    const statusEl = document.getElementById('sync-status');
    if (!statusEl) return;
    if (status === 'online') {
        statusEl.textContent = '● Online';
        statusEl.style.color = '#00ff00';
        statusEl.style.borderColor = '#00ff00';
    } else if (status === 'syncing') {
        statusEl.textContent = '↻ Syncing...';
        statusEl.style.color = '#ffff00';
        statusEl.style.borderColor = '#ffff00';
    } else {
        statusEl.textContent = '● Offline';
        statusEl.style.color = '#ff0000';
        statusEl.style.borderColor = '#ff0000';
    }
}

function renderMoodSelector() {
    const container = document.getElementById('mood-selector');
    if (!container) return;
    container.innerHTML = moods.map((mood, index) => `
        <div class="mood-option ${selectedMood === index ? 'selected' : ''}" onclick="selectMood(${index})">
            ${mood.emoji}
            <span class="mood-label">${mood.label}</span>
        </div>
    `).join('');
}

function selectMood(index) {
    selectedMood = index;
    renderMoodSelector();
}

function updateTimerOptions() {
    const container = document.getElementById('duration-selector');
    if (!container) return;
    container.innerHTML = timeDurations.map(duration => `
        <div class="duration-option" onclick="selectDuration(${duration})">
            ${duration < 60 ? duration + ' min' : (duration / 60) + ' hour' + (duration > 60 ? 's' : '')}
        </div>
    `).join('');

    const actContainer = document.getElementById('activity-selector');
    if (!actContainer) return;
    actContainer.innerHTML = timeActivities.map(activity => `
        <div class="activity-option" onclick="selectActivity('${activity}')">
            ${activity}
        </div>
    `).join('');
}

// Functions called by onclicks generated in updateTimerOptions
function selectDuration(minutes) {
    selectedDuration = minutes;
    document.querySelectorAll('.duration-option').forEach(el => {
        el.classList.remove('selected');
        const text = el.textContent.trim();
        if ((minutes === 15 && text.includes('15')) ||
            (minutes === 30 && text.includes('30')) ||
            (minutes === 60 && text.includes('1 hour')) ||
            (minutes === 120 && text.includes('2')) ||
            (minutes === 180 && text.includes('3'))) {
            el.classList.add('selected');
        }
    });
    if (typeof checkTimerReady === 'function') checkTimerReady(); 
}

function selectActivity(activity) {
    selectedActivity = activity;
    document.querySelectorAll('#activity-selector .activity-option').forEach(el => {
        el.classList.remove('selected');
        if (el.textContent.includes(activity)) {
            el.classList.add('selected');
        }
    });
    if (typeof checkTimerReady === 'function') checkTimerReady();
}

function updateTrackOptions() {
    if (typeof renderTrackSelector === 'function') renderTrackSelector();
}

// --- Auth Functions (Called from HTML) ---
function signInWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider).catch((error) => {
        console.error('Google sign-in error:', error);
        alert('Sign in error: ' + error.message);
    });
}

function signInWithEmail() {
    const email = prompt('Enter your email:');
    const password = prompt('Enter your password:');
    if (!email || !password) return;
    
    auth.signInWithEmailAndPassword(email, password)
        .catch((error) => {
            if (error.code === 'auth/user-not-found') {
                auth.createUserWithEmailAndPassword(email, password)
                    .catch((createError) => {
                        console.error('Error creating user:', createError);
                        alert('Error: ' + createError.message);
                    });
            } else {
                console.error('Email sign-in error:', error);
                alert('Sign in error: ' + error.message);
            }
        });
}

function signOutUser() {
    if (confirm('Sign out?')) {
        auth.signOut().then(() => {
            location.reload();
        });
    }
}

function continueOffline() {
    isOfflineMode = true;
    if (typeof showMainApp === 'function') showMainApp();
    updateSyncStatus('offline');
    loadData();
    loadSettings();
}

// --- Helper Functions (Used by other modules) ---
function getTimestampFromInput(inputId) {
    const value = document.getElementById(inputId).value;
    if (!value) return new Date().toISOString();
    return new Date(value).toISOString();
}

function setCurrentDateTime(inputId) {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    
    const dateTimeString = `${year}-${month}-${day}T${hours}:${minutes}`;
    const inputEl = document.getElementById(inputId);
    if (inputEl) inputEl.value = dateTimeString;
}

