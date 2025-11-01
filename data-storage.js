// ===== data-storage.js (LocalStorage Handler) =====
import { getState, setEntries } from './state.js';
import { renderTimeline } from './ui-renderer.js';
import { saveDataToFirebase } from './firebase-config.js';

/**
 * Loads entries from localStorage into the state.
 */
export function loadData() {
    const saved = localStorage.getItem('timeline-entries');
    let entries = [];
    if (saved) {
        try {
            entries = JSON.parse(saved);
        } catch(e) {
            console.error("Error parsing entries from localStorage", e);
            entries = [];
        }
    }
    setEntries(entries);
    renderTimeline(); // Render after loading
}

/**
 * Saves the current state's entries to localStorage and triggers Firebase sync.
 */
export function saveData() {
    const { entries, isOfflineMode, currentUser } = getState();
    localStorage.setItem('timeline-entries', JSON.stringify(entries));
    
    if (!isOfflineMode && currentUser) {
        saveDataToFirebase();
    }
}
