// Global variables
let entries = [];
let currentUser = null;
let isOfflineMode = false;

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

// Settings
let timeDurations = [15, 30, 60, 120, 180];
let timeActivities = ['Reading', 'Sports', 'Work', 'Cleaning', 'Errands'];
let trackItems = {
    meals: ['🍳 Breakfast', '🥗 Lunch', '🍽️ Dinner', '☕ Snack'],
    tasks: ['💊 Medicine', '💧 Water', '🚶 Walk', '📞 Call']
};

// Default moods
const defaultMoods = [
    { emoji: '😊', label: 'Happy' },
    { emoji: '😢', label: 'Sad' },
    { emoji: '😡', label: 'Angry' },
    { emoji: '😰', label: 'Anxious' },
    { emoji: '😴', label: 'Tired' }
];

let moods = [...defaultMoods];

// --- Authentication Functions (Called from HTML) ---

function signInWithGoogle() {
    if (!auth) return;
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider)
        .then((result) => {
            console.log('Signed in with Google:', result.user.email);
        })
        .catch((error) => {
            console.error('Google sign-in error:', error);
            alert('Sign in error: ' + error.message);
        });
}

function signInWithEmail() {
    if (!auth) return;
    const email = prompt('Enter your email:');
    const password = prompt('Enter your password:');
    
    if (!email || !password) return;
    
    auth.signInWithEmailAndPassword(email, password)
        .then((result) => {
            console.log('Signed in with email:', result.user.email);
        })
        .catch((error) => {
            if (error.code === 'auth/user-not-found') {
                auth.createUserWithEmailAndPassword(email, password)
                    .then((result) => {
                        console.log('New user created:', result.user.email);
                    })
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
    if (!auth) return;
    if (confirm('Sign out?')) {
        auth.signOut().then(() => {
            location.reload();
        });
    }
}

function continueOffline() {
    isOfflineMode = true;
    currentUser = null; // Asegurarse de que no haya usuario
    showMainApp(); // Definida en ui-handlers.js
    updateSyncStatus('offline'); // Definida en ui-handlers.js
    
    // Cargar datos locales
    loadData();
    loadSettings();
}

// --- App Core Functions ---

// Refresh function
function refreshApp() {
    if (currentUser && !isOfflineMode) {
        loadDataFromFirebase();
        loadSettingsFromFirebase();
        alert('✅ Synced!');
    } else {
        location.reload();
    }
}

// Load settings from localStorage
function loadSettings() {
    console.log("Loading settings from localStorage...");
    try {
        const savedDurations = localStorage.getItem('time-durations');
        const savedActivities = localStorage.getItem('time-activities');
        const savedTrackItems = localStorage.getItem('track-items');
        const savedMoods = localStorage.getItem('mood-config');
        
        if (savedDurations) timeDurations = JSON.parse(savedDurations);
        if (savedActivities) timeActivities = JSON.parse(savedActivities);
        if (savedTrackItems) trackItems = JSON.parse(savedTrackItems);
        if (savedMoods) moods = JSON.parse(savedMoods);

        // Actualizar UI con los settings cargados
        // Estas funciones están definidas en ui-handlers.js y ui-renderer.js
        if (typeof updateTimerOptions === 'function') {
            updateTimerOptions();
        }
        if (typeof updateTrackOptions === 'function') {
            updateTrackOptions();
        }
         if (typeof renderMoodSelector === 'function') {
            renderMoodSelector();
        }

    } catch (error) {
        console.error("Error loading settings:", error);
    }
}

// Save settings to localStorage
function saveSettingsToStorage() {
    localStorage.setItem('time-durations', JSON.stringify(timeDurations));
    localStorage.setItem('time-activities', JSON.stringify(timeActivities));
    localStorage.setItem('track-items', JSON.stringify(trackItems));
    localStorage.setItem('mood-config', JSON.stringify(moods));
}

// Load data from localStorage
function loadData() {
    console.log("Loading data from localStorage...");
    const saved = localStorage.getItem('timeline-entries');
    if (saved) {
        try {
            entries = JSON.parse(saved);
        } catch (error) {
            console.error("Error parsing local entries:", error);
            entries = [];
        }
    } else {
        entries = [];
    }
    
    if (typeof renderTimeline === 'function') {
        renderTimeline(); // Definida en ui-renderer.js
    }
}

// Save data to localStorage
function saveData() {
    localStorage.setItem('timeline-entries', JSON.stringify(entries));
    if (!isOfflineMode && currentUser) {
        saveDataToFirebase(); // Llamada asíncrona a Firebase
    }
}

// --- Firebase Data Functions (called from app.js) ---

async function loadDataFromFirebase() {
    if (!currentUser || !db) return;
    
    updateSyncStatus('syncing');
    
    try {
        const snapshot = await db.collection('users')
            .doc(currentUser.uid)
            .collection('entries')
            .orderBy('timestamp', 'desc')
            .get();
        
        entries = [];
        snapshot.forEach((doc) => {
            entries.push({ id: doc.id, ...doc.data() });
        });
        
        console.log(`Cargadas ${entries.length} entradas del usuario ${currentUser.email}`);
        
        renderTimeline(); // Definida en ui-renderer.js
        updateSyncStatus('online');
    } catch (error) {
        console.error('Error loading from Firebase:', error);
        updateSyncStatus('offline');
        loadData(); // Cargar local como fallback
    }
}

async function saveDataToFirebase() {
    if (!currentUser || !db || isOfflineMode) {
        saveData(); // Guardar localmente si no hay usuario o está offline
        return;
    }
    
    updateSyncStatus('syncing');
    
    try {
        const batch = db.batch();
        
        entries.forEach((entry) => {
            const docRef = db.collection('users')
                .doc(currentUser.uid)
                .collection('entries')
                .doc(String(entry.id)); // Usar ID existente
            batch.set(docRef, entry);
        });
        
        await batch.commit();
        console.log(`Guardadas ${entries.length} entradas para ${currentUser.email}`);
        updateSyncStatus('online');
    } catch (error) {
        console.error('Error saving to Firebase:', error);
        updateSyncStatus('offline');
        saveData(); // Guardar local como fallback
    }
}

async function loadSettingsFromFirebase() {
    if (!currentUser || !db) return;
    
    try {
        const doc = await db.collection('users')
            .doc(currentUser.uid)
            .collection('settings')
            .doc('app-settings')
            .get();
        
        if (doc.exists) {
            const data = doc.data();
            if (data.timeDurations) timeDurations = data.timeDurations;
            if (data.timeActivities) timeActivities = data.timeActivities;
            if (data.trackItems) trackItems = data.trackItems;
            if (data.moods) moods = data.moods;
            
            console.log('Configuración cargada desde Firebase para', currentUser.email);
            
            // Actualizar UI con los settings cargados
            updateTimerOptions(); // Definida en ui-handlers.js
            updateTrackOptions(); // Definida en ui-handlers.js
            renderMoodSelector(); // Definida en ui-handlers.js
        } else {
            // Si no hay settings en Firebase, cargar los locales (o default)
            loadSettings();
        }
    } catch (error) {
        console.error('Error loading settings from Firebase:', error);
        loadSettings(); // Cargar local como fallback
    }
}

async function saveSettingsToFirebase() {
    if (!currentUser || !db || isOfflineMode) {
        saveSettingsToStorage(); // Guardar local si no hay usuario o está offline
        return;
    }
    
    try {
        await db.collection('users')
            .doc(currentUser.uid)
            .collection('settings')
            .doc('app-settings')
            .set({
                timeDurations: timeDurations,
                timeActivities: timeActivities,
                trackItems: trackItems,
                moods: moods,
                updatedAt: new Date().toISOString()
            });
            
        console.log('Settings saved to Firebase for', currentUser.email);
    } catch (error) {
        console.error('Error saving settings to Firebase:', error);
        saveSettingsToStorage(); // Guardar local como fallback
    }
}

async function deleteEntryFromFirebase(entryId) {
    if (!currentUser || !db || isOfflineMode) return;
    
    try {
        await db.collection('users')
            .doc(currentUser.uid)
            .collection('entries')
            .doc(String(entryId))
            .delete();
        console.log('Entry deleted from Firebase for', currentUser.email);
    } catch (error) {
        console.error('Error deleting from Firebase:', error);
    }
}

// --- Initialize app ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM fully loaded and parsed");

    // --- Listeners para los botones de Auth ---
    // Esto reemplaza los 'onclick' del HTML
    const btnSignInGoogle = document.getElementById('btn-signin-google');
    if (btnSignInGoogle) {
        btnSignInGoogle.addEventListener('click', signInWithGoogle);
    }

    const btnSignInEmail = document.getElementById('btn-signin-email');
    if (btnSignInEmail) {
        btnSignInEmail.addEventListener('click', signInWithEmail);
    }

    const btnContinueOffline = document.getElementById('btn-continue-offline');
    if (btnContinueOffline) {
        btnContinueOffline.addEventListener('click', continueOffline);
    }
    // --- Fin de los listeners ---
    
    // Configurar el listener de autenticación de Firebase
    if (auth) {
        auth.onAuthStateChanged((user) => {
            if (user) {
                currentUser = user;
                isOfflineMode = false;
                console.log('Usuario autenticado:', user.email, 'UID:', user.uid);
                
                showMainApp(); // Definida en ui-handlers.js
                updateSyncStatus('online'); // Definida en ui-handlers.js
                
                // Cargar datos y settings de Firebase
                loadDataFromFirebase();
                loadSettingsFromFirebase();
            } else {
                // No hay usuario, mostrar pantalla de login
                currentUser = null;
                isOfflineMode = true; // Por defecto
                showAuthContainer(); // Definida en ui-handlers.js
                updateSyncStatus('offline'); // Definida en ui-handlers.js
            }
        });
    } else {
        // Modo offline si Firebase no se carga
        console.warn("Firebase auth no está disponible. Forzando modo offline.");
        continueOffline();
    }

    // Cargar datos locales (se mostrarán si el login falla o se elige offline)
    // Esto es importante para que 'continueOffline' funcione rápido
    loadSettings(); // Carga settings primero
    loadData(); // Carga entradas
});

