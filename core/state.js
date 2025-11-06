// ===== core/state.js (Single Source of Truth) =====

// Private state of the application
const state = {
    // Auth State
    currentUser: null,
    isOfflineMode: false,
    
    // Data State
    entries: [],
    
    // Settings State
    settings: {
        timeDurations: [15, 30, 60, 120, 180],
        timeActivities: ['Reading', 'Sports', 'Work', 'Cleaning', 'Errands'],
        trackItems: {
            meals: ['🍳 Breakfast', '🥗 Lunch', '🍽️ Dinner', '☕ Snack'],
            tasks: ['💊 Medicine', '💧 Water', '🚶 Walk', '📞 Call']
        },
        // P-FIX: Changed to 5 moods with 'visual' (keyword) and 'label'
        // This 'visual' keyword will map to an icon in ui-renderer.js
        moods: [
            { visual: 'happy',   label: 'Happy' },
            { visual: 'sad',     label: 'Sad' },
            { visual: 'relax',   label: 'Relax' },
            { visual: 'anxious', label: 'Anxious' },
            { visual: 'tired',   label: 'Tired' }
        ]
    },
    
    // UI State
    editingEntryId: null,
    selectedMood: null, // This will now be the index (0, 1, 2...)
    selectedDuration: null,
    selectedActivity: null,
    selectedTrackItem: null,
    
    // Media State
    currentImages: [],
    currentAudio: null,
    currentCoords: null,
    mediaRecorder: null,
    audioChunks: []
};

// --- Public API for state management ---

/**
 * Returns a read-only copy of the current state.
 */
export function getState() {
    return {
        currentUser: state.currentUser,
        isOfflineMode: state.isOfflineMode,
        entries: [...state.entries],
        settings: JSON.parse(JSON.stringify(state.settings)),
        editingEntryId: state.editingEntryId,
        selectedMood: state.selectedMood,
        selectedDuration: state.selectedDuration,
        selectedActivity: state.selectedActivity,
        selectedTrackItem: state.selectedTrackItem,
        currentImages: [...state.currentImages],
        currentAudio: state.currentAudio,
        currentCoords: state.currentCoords
    };
}

// --- Auth State ---
export function setCurrentUser(user) {
    state.currentUser = user;
    // NEW: If user logs in, they are no longer in 'offline mode'
    if (user) {
        localStorage.setItem('isOfflineMode', 'false');
    }
}

// NEW: Clears user and auth persistence
export function clearCurrentUser() {
    state.currentUser = null;
    // Remove auth persistence keys
    localStorage.removeItem('isOfflineMode');
}

export function setOfflineMode(isOffline) {
    state.isOfflineMode = isOffline;
    // CHANGED: Persist this choice to localStorage
    localStorage.setItem('isOfflineMode', isOffline);
}

// --- Data State ---
export function setEntries(newEntries) {
    state.entries = newEntries;
}
export function addEntry(entry) {
    state.entries.unshift(entry);
}
export function updateEntry(updatedEntry) {
    const index = state.entries.findIndex(e => e.id == updatedEntry.id); // Usar ==
    if (index !== -1) {
        state.entries[index] = updatedEntry;
    }
}
export function removeEntry(entryId) {
    // *** CAMBIO CRÍTICO: Usar != para el fix del Delete (String vs Number) ***
    state.entries = state.entries.filter(e => e.id != entryId);
}

// --- Settings State ---
export function setSettings(newSettings) {
    if (newSettings.timeDurations) state.settings.timeDurations = newSettings.timeDurations;
    if (newSettings.timeActivities) state.settings.timeActivities = newSettings.timeActivities;
    if (newSettings.trackItems) state.settings.trackItems = newSettings.trackItems;
    if (newSettings.moods) state.settings.moods = newSettings.moods;
}

// --- UI State ---
export function setEditingId(id) {
    state.editingEntryId = id;
}
export function setSelectedMood(index) {
    state.selectedMood = index;
}
export function setSelectedDuration(duration) {
    state.selectedDuration = duration;
}
export function setSelectedActivity(activity) {
    state.selectedActivity = activity;
}
export function setSelectedTrackItem(item) {
    state.selectedTrackItem = item;
}
export function clearFormState() {
    state.editingEntryId = null;
    state.selectedMood = null;
    state.currentImages = [];
    state.currentAudio = null;
    state.currentCoords = null;
}
export function clearTimerState() {
    state.editingEntryId = null;
    state.selectedDuration = null;
    state.selectedActivity = null;
}
export function clearTrackState() {
    state.editingEntryId = null;
    state.selectedTrackItem = null;
}
export function clearSpentState() {
    state.editingEntryId = null;
}
export function clearRecapState() {
    state.editingEntryId = null;
}

// --- Media State ---
export function getCurrentMedia() {
    return {
        images: state.currentImages,
        audio: state.currentAudio,
        coords: state.currentCoords
    };
}
export function setMediaRecorder(recorder) {
    state.mediaRecorder = recorder;
}
export function getMediaRecorder() {
    return state.mediaRecorder;
}
export function setAudioChunks(chunks) {
    state.audioChunks = chunks;
}
export function getAudioChunks() {
    return state.audioChunks;
}
export function addImage(imageData) {
    state.currentImages.push(imageData);
}
export function removeImage(index) {
    state.currentImages.splice(index, 1);
}
export function setAudio(audioData) {
    state.currentAudio = audioData;
}
export function setCoords(coords) {
    state.currentCoords = coords;
}
