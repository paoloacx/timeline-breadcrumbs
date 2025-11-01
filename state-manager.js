// /state-manager.js
// Manages the global state of the application.

// --- Private State ---
let state = {
    // App state
    entries: [],
    
    // Form/Edit state
    currentImages: [],
    currentAudio: null,
    currentCoords: null,
    editingEntryId: null,
    selectedMood: null,
    selectedDuration: null,
    selectedActivity: null,
    selectedTrackItem: null,

    // Media state
    mediaRecorder: null,
    audioChunks: [],
    
    // Auth state
    currentUser: null,
    isOfflineMode: true, // Start in offline mode until auth check
    
    // Settings (will be populated by settings-manager)
    moods: [],
    timeDurations: [],
    timeActivities: [],
    trackItems: { meals: [], tasks: [] },
    defaultMoods: [
        { emoji: '😊', label: 'Happy' },
        { emoji: '😢', label: 'Sad' },
        { emoji: '😡', label: 'Angry' },
        { emoji: '😰', label: 'Anxious' },
        { emoji: '😴', label: 'Tired' }
    ]
};

// --- Public API ---

/**
 * Get a read-only snapshot of the current state.
 */
export function getState() {
    return { ...state };
}

/**
 * Set new values in the state.
 * @param {object} newState - An object with keys to update in the state.
 */
export function setState(newState) {
    state = { ...state, ...newState };
}

/**
 * Resets all state variables related to the main form.
 */
export function resetCrumbFormState() {
    state.currentImages = [];
    state.currentAudio = null;
    state.currentCoords = null;
    state.editingEntryId = null;
    state.selectedMood = null;
    
    // Stop any recording in progress
    if (state.mediaRecorder && state.mediaRecorder.state !== 'inactive') {
        state.mediaRecorder.stop();
    }
    state.mediaRecorder = null;
    state.audioChunks = [];
}

/**
 * Resets all state variables related to the timer form.
 */
export function resetTimerFormState() {
    state.selectedDuration = null;
    state.selectedActivity = null;
    state.editingEntryId = null;
}

/**
 * Resets all state variables related to the track form.
 */
export function resetTrackFormState() {
    state.selectedTrackItem = null;
    state.editingEntryId = null;
}

/**
 * Resets all state variables related to the spent form.
 */
export function resetSpentFormState() {
    state.editingEntryId = null;
}

/**
 * Resets all state variables related to the recap form.
 */
export function resetRecapFormState() {
    state.editingEntryId = null;
}
