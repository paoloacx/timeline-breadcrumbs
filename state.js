// ===== state.js (Single Source of Truth) =====

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
        moods: [
            { emoji: '😊', label: 'Happy' },
            { emoji: '😢', label: 'Sad' },
            { emoji: '😡', label: 'Angry' },
            { emoji: '😰', label: 'Anxious' },
            { emoji: '😴', label: 'Tired' }
        ]
    },
    
    // UI State
    editingEntryId: null,
    selectedMood: null,
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
 * (Read-only to prevent accidental mutation)
 */
export function getState() {
    // Return a structured copy to prevent direct mutation of the state object
    return {
        currentUser: state.currentUser,
        isOfflineMode: state.isOfflineMode,
        entries: [...state.entries], // Return copy of entries array
        settings: JSON.parse(JSON.stringify(state.settings)), // Return deep copy of settings
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
}
export function setOfflineMode(isOffline) {
    state.isOfflineMode = isOffline;
}

// --- Data State ---
export function setEntries(newEntries) {
    state.entries = newEntries;
}
export function addEntry(entry) {
    state.entries.unshift(entry);
}
export function updateEntry(updatedEntry) {
    const index = state.entries.findIndex(e => e.id === updatedEntry.id);
    if (index !== -1) {
        state.entries[index] = updatedEntry;
    }
}
export function removeEntry(entryId) {
    state.entries = state.entries.filter(e => e.id !== entryId);
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
