// /crud-handlers.js
// Handles all CRUD (Create, Read, Update, Delete) operations
// on the local state ('entries' array).

import { getState, setState, resetCrumbFormState, resetTimerFormState, resetTrackFormState, resetSpentFormState, resetRecapFormState } from './state-manager.js';
import { saveDataToFirebase, deleteEntryFromFirebase } from './api-services.js';
import { renderTimeline } from './ui-renderer.js';
import { toggleForm, toggleTimer, toggleTrack, toggleSpent, closeRecapForm } from './ui-handlers.js';
import { generateUUID } from './utils.js';

// --- Local Data Management ---

/**
 * Loads entries from localStorage into state.
 */
export function loadData() {
    const saved = localStorage.getItem('timeline-entries');
    if (saved) {
        try {
            const entries = JSON.parse(saved);
            setState({ entries });
        } catch(e) {
            console.error("Error parsing entries from localStorage", e);
            setState({ entries: [] });
        }
    }
    renderTimeline(); // Initial render
}

/**
 * Saves the current state's 'entries' to localStorage
 * and triggers a sync to Firebase.
 */
export function saveData() {
    const { entries, isOfflineMode, currentUser } = getState();
    
    localStorage.setItem('timeline-entries', JSON.stringify(entries));
    
    if (!isOfflineMode && currentUser) {
        saveDataToFirebase();
    }
}

// --- Breadcrumb (Crumb) Handlers ---

/**
 * Saves or updates a standard breadcrumb entry.
 */
export function saveEntry() {
    const note = document.getElementById('note-input').value.trim();
    if (!note) {
        alert('Please write a note');
        return;
    }

    let { entries, editingEntryId, moods, selectedMood, currentImages, currentAudio, currentCoords } = getState();
    const moodData = selectedMood !== null ? moods[selectedMood] : null;
    const timestamp = document.getElementById('datetime-input').value;

    if (editingEntryId) {
        // Find and update existing entry
        const entryIndex = entries.findIndex(e => e.id === editingEntryId);
        if (entryIndex !== -1) {
            entries[entryIndex] = {
                ...entries[entryIndex], // Preserve existing data
                timestamp: new Date(timestamp).toISOString(),
                note: note,
                location: document.getElementById('location-input').value,
                weather: document.getElementById('weather-input').value,
                images: [...currentImages],
                audio: currentAudio,
                coords: currentCoords ? { ...currentCoords } : entries[entryIndex].coords,
                mood: moodData,
                // Ensure other types are reset
                isTimedActivity: false,
                isQuickTrack: false,
                isSpent: false,
                type: 'crumb'
            };
        }
    } else {
        // Create new entry
        const entry = {
            id: generateUUID(), // Use UUID
            timestamp: new Date(timestamp).toISOString(),
            note: note,
            location: document.getElementById('location-input').value,
            weather: document.getElementById('weather-input').value,
            images: [...currentImages],
            audio: currentAudio,
            coords: currentCoords ? { ...currentCoords } : null,
            mood: moodData,
            type: 'crumb'
        };
        entries.unshift(entry);
    }

    setState({ entries });
    saveData();
    renderTimeline();
    toggleForm(); // Close form window
    resetCrumbFormState(); // Reset state
}

/**
 * Deletes the currently editing entry from state and DB.
 */
export function deleteCurrentEntry() {
    let { editingEntryId, entries, currentUser, isOfflineMode } = getState();
    
    if (!editingEntryId) return;

    if (confirm('Delete this entry?')) {
        entries = entries.filter(e => e.id !== editingEntryId);
        
        if (currentUser && !isOfflineMode) {
            deleteEntryFromFirebase(editingEntryId);
        }
        
        setState({ entries, editingEntryId: null });
        saveData();
        renderTimeline();
        
        // Close any open form
        // (This logic will be improved in ui-handlers)
        document.getElementById('form-window').classList.add('hidden');
        document.getElementById('timer-window').classList.add('hidden');
        document.getElementById('track-window').classList.add('hidden');
        document.getElementById('spent-window').classList.add('hidden');
        document.getElementById('recap-form').classList.add('hidden');
    }
}


// --- Time Event Handlers ---

/**
 * Saves or updates a Time (activity) entry.
 */
export function createTimeEvent() {
    const { entries, editingEntryId, selectedDuration, selectedActivity } = getState();
    if (!selectedDuration || !selectedActivity) return;
    
    const timestamp = document.getElementById('datetime-input-time').value;
    const optionalNote = document.getElementById('time-optional-note').value.trim();

    if (editingEntryId) {
        const entryIndex = entries.findIndex(e => e.id === editingEntryId);
        if (entryIndex !== -1) {
            entries[entryIndex] = {
                ...entries[entryIndex],
                timestamp: new Date(timestamp).toISOString(),
                note: `${selectedActivity} - ${selectedDuration} minutes`,
                activity: selectedActivity,
                duration: selectedDuration,
                optionalNote: optionalNote,
                isTimedActivity: true, // Ensure type
                type: 'time',
                // Clear other types
                isQuickTrack: false,
                isSpent: false,
                mood: null
            };
        }
    } else {
        const entry = {
            id: generateUUID(),
            timestamp: new Date(timestamp).toISOString(),
            note: `${selectedActivity} - ${selectedDuration} minutes`,
            activity: selectedActivity,
            duration: selectedDuration,
            optionalNote: optionalNote,
            isTimedActivity: true,
            type: 'time',
        };
        entries.unshift(entry);
    }

    setState({ entries });
    saveData();
    renderTimeline();
    alert(`✅ Time event ${editingEntryId ? 'updated' : 'created'}!`);
    toggleTimer();
    resetTimerFormState();
}


// --- Track Event Handlers ---

/**
 * Saves or updates a Quick Track entry.
 */
export function saveTrackEvent() {
    const { entries, editingEntryId, selectedTrackItem } = getState();
    if (!selectedTrackItem) return;

    const timestamp = document.getElementById('datetime-input-track').value;
    const optionalNote = document.getElementById('track-optional-note').value.trim();

    if (editingEntryId) {
        const entryIndex = entries.findIndex(e => e.id === editingEntryId);
        if (entryIndex !== -1) {
            entries[entryIndex] = {
                ...entries[entryIndex],
                timestamp: new Date(timestamp).toISOString(),
                note: selectedTrackItem,
                optionalNote: optionalNote,
                isQuickTrack: true, // Ensure type
                type: 'track',
                // Clear other types
                isTimedActivity: false,
                isSpent: false,
                mood: null
            };
        }
        alert(`✅ Track updated: ${selectedTrackItem}`);
    } else {
        const entry = {
            id: generateUUID(),
            timestamp: new Date(timestamp).toISOString(),
            note: selectedTrackItem,
            optionalNote: optionalNote,
            isQuickTrack: true,
            type: 'track',
        };
        entries.unshift(entry);
        alert(`✅ Tracked: ${selectedTrackItem}`);
    }
    
    setState({ entries });
    saveData();
    renderTimeline();
    toggleTrack();
    resetTrackFormState();
}


// --- Spent Event Handlers ---

/**
 * Saves or updates a Spent (expense) entry.
 */
export function saveSpent() {
    const description = document.getElementById('spent-description').value.trim();
    const amount = parseFloat(document.getElementById('spent-amount').value);

    if (!description) {
        alert('Please enter a description');
        return;
    }
    if (!amount || amount <= 0 || isNaN(amount)) {
        alert('Please enter a valid amount');
        return;
    }

    const { entries, editingEntryId } = getState();
    const timestamp = document.getElementById('datetime-input-spent').value;

    if (editingEntryId) {
        const entryIndex = entries.findIndex(e => e.id === editingEntryId);
        if (entryIndex !== -1) {
            entries[entryIndex] = {
                ...entries[entryIndex],
                timestamp: new Date(timestamp).toISOString(),
                note: description,
                spentAmount: amount,
                isSpent: true, // Ensure type
                type: 'spent',
                // Clear other types
                isTimedActivity: false,
                isQuickTrack: false,
                mood: null
            };
        }
        alert(`✅ Spent updated: €${amount.toFixed(2)}`);
    } else {
        const entry = {
            id: generateUUID(),
            timestamp: new Date(timestamp).toISOString(),
            note: description,
            spentAmount: amount,
            isSpent: true,
            type: 'spent',
        };
        entries.unshift(entry);
        alert(`✅ Spent tracked: €${amount.toFixed(2)}`);
    }
    
    setState({ entries });
    saveData();
    renderTimeline();
    toggleSpent();
    resetSpentFormState();
}


// --- Recap Event Handlers ---

/**
 * Saves or updates a Day Recap entry.
 */
export function saveRecap() {
    const reflection = document.getElementById('recap-reflection').value.trim();
    const rating = document.getElementById('recap-rating').value;
    const highlight1 = document.getElementById('recap-highlight-1').value.trim();
    const highlight2 = document.getElementById('recap-highlight-2').value.trim();
    const highlight3 = document.getElementById('recap-highlight-3').value.trim();
    const selectedTrackJson = document.getElementById('recap-selected-track').value;
    const timestamp = document.getElementById('datetime-input-recap').value;

    if (!reflection && !highlight1 && !highlight2 && !highlight3) {
        alert('Please add at least one reflection or highlight');
        return;
    }
    
    const { entries, editingEntryId } = getState();

    const recapEntry = {
        id: editingEntryId || generateUUID(),
        timestamp: new Date(timestamp).toISOString(),
        type: 'recap',
        note: `Day Recap (Rating: ${rating}/10)`,
        reflection: reflection,
        rating: parseInt(rating),
        highlights: [highlight1, highlight2, highlight3].filter(h => h),
        track: selectedTrackJson ? JSON.parse(selectedTrackJson) : null,
        // Ensure other types are false
        isTimedActivity: false,
        isQuickTrack: false,
        isSpent: false,
        mood: null
    };

    if (editingEntryId) {
        const entryIndex = entries.findIndex(e => e.id === editingEntryId);
        if (entryIndex !== -1) {
            entries[entryIndex] = recapEntry;
        }
        alert('🌟 Recap updated!');
    } else {
        entries.unshift(recapEntry);
        alert('🌟 Recap saved!');
    }
    
    setState({ entries });
    saveData();
    renderTimeline();
    closeRecapForm();
    resetRecapFormState();
}
