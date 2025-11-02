// ===== firebase-config.js (Firebase Logic) =====

// Imports
import { getState, setCurrentUser, setEntries, setSettings } from './state.js';
// CAMBIO: 'renderTimeline' se importa desde su nuevo módulo
import { renderTimeline } from './modules/timeline/timeline.js';
import * as settingsManager from './settings-manager.js';
import { loadData as loadLocalData } from './data-storage.js';
// CAMBIO: 'renderMoodSelector' ya no se importa desde 'firebase-config.js'
import { renderMoodSelector } from './ui-renderer.js';

// ... (el resto de tu firebase-config.js, desde la línea 13 hasta la 90, es idéntico) ...
// (firebaseConfig, initAuth, signInWithGoogle, signInWithEmail, signOutUser)

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
        renderTimeline(); // Esta función ahora se importa desde la nueva ubicación

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
        renderMoodSelector(); // Esta importación ahora es correcta

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
