// ===== firebase-config.js (Firebase Logic) =====

// Imports
import { getState, setCurrentUser, setEntries, setSettings } from './state.js';
import { renderTimeline } from './ui-renderer.js';
import { updateTimerOptions, updateTrackOptions, loadSettings } as settingsManager from './settings-manager.js';
import { loadData as loadLocalData } from './data-storage.js';
import { renderMoodSelector } from './ui-renderer.js';

// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyAb-MLu8atl5hruOPLDhgftjkjc_1M2038", // (Tu clave)
    authDomain: "breadcrumbs-8b59e.firebaseapp.com",
    projectId: "breadcrumbs-8b59e",
    storageBucket: "breadcrumbs-8b59e.firebasestorage.app",
    messagingSenderId: "912286191427",
    appId: "1:912286191427:web:e78b665df6a6ff6d8529f6",
    measurementId: "G-GZYTDYNSRB"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
// const storage = firebase.storage(); // (No se usa aún)

/**
 * Initializes the Firebase auth listener.
 * @param {function} onLoginCallback - Function to call when user logs in.
 * @param {function} onLogoutCallback - Function to call when user logs out.
 */
export function initAuth(onLoginCallback, onLogoutCallback) {
    auth.onAuthStateChanged((user) => {
        if (user) {
            setCurrentUser(user);
            onLoginCallback(user);
        } else {
            setCurrentUser(null);
            onLogoutCallback();
        }
    });
}

// --- Auth Functions ---

export function signInWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider).catch((error) => {
        console.error('Google sign-in error:', error);
        alert('Sign in error: ' + error.message);
    });
}

export function signInWithEmail() {
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

export function signOutUser() {
    if (confirm('Sign out?')) {
        auth.signOut(); // onAuthStateChanged se encargará del resto
    }
}

// --- Data Functions ---

export async function loadFirebaseData() {
    const { currentUser } = getState();
    if (!currentUser) return;
    
    try {
        // 1. Load Entries
        const snapshot = await db.collection('users')
            .doc(currentUser.uid)
            .collection('entries')
            .orderBy('timestamp', 'desc')
            .get();
        
        const newEntries = [];
        snapshot.forEach((doc) => {
            newEntries.push({ id: doc.id, ...doc.data() });
        });
        
        setEntries(newEntries);
        console.log(`Cargadas ${newEntries.length} entradas del usuario ${currentUser.email}`);
        
        // 2. Load Settings
        await loadSettingsFromFirebase();

        // 3. Render Timeline (después de cargar todo)
        renderTimeline();

    } catch (error) {
        console.error('Error loading from Firebase:', error);
        // Fallback to local data if cloud fails
        loadLocalData();
    }
}

export async function saveDataToFirebase() {
    const { currentUser, isOfflineMode, entries } = getState();
    if (!currentUser || isOfflineMode) return;
    
    try {
        const batch = db.batch();
        
        entries.forEach((entry) => {
            const docRef = db.collection('users')
                .doc(currentUser.uid)
                .collection('entries')
                .doc(String(entry.id));
            
            // Clean object for Firebase (handles nested objects like 'track')
            const cleanEntry = JSON.parse(JSON.stringify(entry));
            batch.set(docRef, cleanEntry);
        });
        
        await batch.commit();
        console.log(`Guardadas ${entries.length} entradas para ${currentUser.email}`);
        
    } catch (error) {
        console.error('Error saving to Firebase:', error);
    }
}

export async function loadSettingsFromFirebase() {
    const { currentUser } = getState();
    if (!currentUser) return;
    
    try {
        const doc = await db.collection('users')
            .doc(currentUser.uid)
            .collection('settings')
            .doc('app-settings')
            .get();
        
        if (doc.exists) {
            const data = doc.data();
            // Carga las settings en el state
            setSettings({
                timeDurations: data.timeDurations || undefined,
                timeActivities: data.timeActivities || undefined,
                trackItems: data.trackItems || undefined,
                moods: data.moods || undefined
            });
            console.log('Configuración de Firebase cargada');
        } else {
            // Si no hay settings en la nube, carga las locales
            settingsManager.loadSettings();
        }
        
        // Actualiza la UI con las settings cargadas
        settingsManager.updateTimerOptions();
        settingsManager.updateTrackOptions();
        renderMoodSelector();

    } catch (error) {
        console.error('Error loading settings from Firebase:', error);
        settingsManager.loadSettings(); // Fallback a locales
    }
}

export async function saveSettingsToFirebase() {
    const { currentUser, isOfflineMode, settings } = getState();
    if (!currentUser || isOfflineMode) return;
    
    try {
        await db.collection('users')
            .doc(currentUser.uid)
            .collection('settings')
            .doc('app-settings')
            .set({
                ...settings,
                updatedAt: new Date().toISOString()
            });
        
        console.log('Settings saved to Firebase for', currentUser.email);
    } catch (error) {
        console.error('Error saving settings to Firebase:', error);
    }
}

export async function deleteEntryFromFirebase(entryId) {
    const { currentUser, isOfflineMode } = getState();
    if (!currentUser || isOfflineMode) return;
    
    try {
        await db.collection('users')
            .doc(currentUser.uid)
            .collection('entries')
            .doc(String(entryId))
            .delete();
        console.log('Entry deleted from Firebase');
    } catch (error) {
        console.error('Error deleting from Firebase:', error);
    }
}
