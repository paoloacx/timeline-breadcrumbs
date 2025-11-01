// ===== crud-handlers.js (Create, Read, Update, Delete Logic) =====

// Imports
import { getState, addEntry, updateEntry, removeEntry, setEditingId, setSelectedMood, setCoords, setAudio, addImage, clearFormState, clearTimerState, clearTrackState, clearSpentState, clearRecapState, setSelectedDuration, setSelectedActivity, setSelectedTrackItem } from './state.js';
import { saveData } from './data-storage.js';
import { deleteEntryFromFirebase } from './firebase-config.js';
import { renderTimeline, renderMoodSelector, renderImagePreviews, renderAudioPreview, showMiniMap, renderPreview, renderImagePreviewModal, selectTrackUI } from './ui-renderer.js';
import { closeModal, openModal, openCrumbForm, openTimerForm, openTrackForm, openSpentForm, openRecapForm } from './ui-handlers.js';
import { getTimestampFromInput, setCurrentDateTime } from './utils.js';
import { updateTimerOptions, updateTrackOptions, checkTimerReady, checkTrackReady } from './settings-manager.js';

// --- Save Handlers ---

/**
 * Saves or updates a standard "Crumb" entry.
 */
export function handleSaveCrumb() {
    const { editingEntryId, currentImages, currentAudio, currentCoords, selectedMood, settings } = getState();
    const note = document.getElementById('note-input').value.trim();
    if (!note) {
        alert('Please write a note');
        return;
    }

    const moodData = selectedMood !== null ? settings.moods[selectedMood] : null;
    const timestamp = getTimestampFromInput('datetime-input');

    const entryData = {
        timestamp: timestamp,
        note: note,
        location: document.getElementById('location-input').value,
        weather: document.getElementById('weather-input').value,
        images: [...currentImages],
        audio: currentAudio,
        coords: currentCoords ? { ...currentCoords } : null,
        mood: moodData,
        // Ensure other types are false
        isTimedActivity: false,
        isQuickTrack: false,
        isSpent: false,
        type: null
    };

    if (editingEntryId) {
        const existingEntry = getState().entries.find(e => e.id === editingEntryId);
        updateEntry({ ...existingEntry, ...entryData, id: editingEntryId });
        alert('✅ Crumb updated!');
    } else {
        addEntry({ ...entryData, id: Date.now() });
        alert('✅ Crumb saved!');
    }

    saveData();
    renderTimeline();
    closeModal('crumb-modal');
}

/**
 * Saves or updates a "Time" event.
 */
export function handleSaveTime() {
    const { editingEntryId, selectedDuration, selectedActivity } = getState();
    if (!selectedDuration || !selectedActivity) return;

    const timestamp = getTimestampFromInput('datetime-input-time');
    const optionalNote = document.getElementById('time-optional-note').value.trim();

    const entryData = {
        timestamp: timestamp,
        note: `${selectedActivity} - ${selectedDuration} minutes`,
        activity: selectedActivity,
        duration: selectedDuration,
        optionalNote: optionalNote,
        isTimedActivity: true,
        // Clear other types
        isQuickTrack: false,
        isSpent: false,
        type: null,
        mood: null,
        location: '',
        weather: '',
        images: [],
        audio: null,
        coords: null,
    };

    if (editingEntryId) {
        const existingEntry = getState().entries.find(e => e.id === editingEntryId);
        updateEntry({ ...existingEntry, ...entryData, id: editingEntryId });
        alert('✅ Time event updated!');
    } else {
        addEntry({ ...entryData, id: Date.now() });
        alert('✅ Time event created!');
    }

    saveData();
    renderTimeline();
    closeModal('timer-modal');
}

/**
 * Saves or updates a "Track" event.
 */
export function handleSaveTrack() {
    const { editingEntryId, selectedTrackItem } = getState();
    if (!selectedTrackItem) return;
    
    const timestamp = getTimestampFromInput('datetime-input-track');
    const optionalNote = document.getElementById('track-optional-note').value.trim();

    const entryData = {
        timestamp: timestamp,
        note: selectedTrackItem,
        optionalNote: optionalNote,
        isQuickTrack: true,
        // Clear other types
        isTimedActivity: false,
        isSpent: false,
        type: null,
        mood: null,
        location: '',
        weather: '',
        images: [],
        audio: null,
        coords: null,
    };

    if (editingEntryId) {
        const existingEntry = getState().entries.find(e => e.id === editingEntryId);
        updateEntry({ ...existingEntry, ...entryData, id: editingEntryId });
        alert(`✅ Track updated: ${selectedTrackItem}`);
    } else {
        addEntry({ ...entryData, id: Date.now() });
        alert(`✅ Tracked: ${selectedTrackItem}`);
    }
    
    saveData();
    renderTimeline();
    closeModal('track-modal');
}

/**
 * Saves or updates a "Spent" event.
 */
export function handleSaveSpent() {
    const { editingEntryId } = getState();
    const description = document.getElementById('spent-description').value.trim();
    const amount = parseFloat(document.getElementById('spent-amount').value);

    if (!description || !amount || amount <= 0 || isNaN(amount)) {
        alert('Please enter a valid description and amount');
        return;
    }

    const timestamp = getTimestampFromInput('datetime-input-spent');

    const entryData = {
        timestamp: timestamp,
        note: description,
        spentAmount: amount,
        isSpent: true,
        // Clear other types
        isTimedActivity: false,
        isQuickTrack: false,
        type: null,
        mood: null,
        location: '',
        weather: '',
        images: [],
        audio: null,
        coords: null,
    };

    if (editingEntryId) {
        const existingEntry = getState().entries.find(e => e.id === editingEntryId);
        updateEntry({ ...existingEntry, ...entryData, id: editingEntryId });
        alert(`✅ Spent updated: €${amount.toFixed(2)}`);
    } else {
        addEntry({ ...entryData, id: Date.now() });
        alert(`✅ Spent tracked: €${amount.toFixed(2)}`);
    }
    
    saveData();
    renderTimeline();
    closeModal('spent-modal');
}

/**
 * Saves or updates a "Recap" event.
 */
export function handleSaveRecap() {
    const { editingEntryId } = getState();
    
    const reflection = document.getElementById('recap-reflection').value.trim();
    const rating = document.getElementById('recap-rating').value;
    const h1 = document.getElementById('recap-highlight-1').value.trim();
    const h2 = document.getElementById('recap-highlight-2').value.trim();
    const h3 = document.getElementById('recap-highlight-3').value.trim();
    const trackJson = document.getElementById('recap-selected-track').value;
    
    if (!reflection && !h1 && !h2 && !h3) {
        alert('Please add at least one reflection or highlight');
        return;
    }

    const entryData = {
        timestamp: getTimestampFromInput('datetime-input-recap'),
        type: 'recap',
        reflection: reflection,
        rating: parseInt(rating),
        highlights: [h1, h2, h3].filter(h => h),
        track: trackJson ? JSON.parse(trackJson) : null,
        note: `Day Recap (Rating: ${rating}/10)`,
        // Clear other types
        isTimedActivity: false,
        isQuickTrack: false,
        isSpent: false,
        mood: null,
    };

    if (editingEntryId) {
        const existingEntry = getState().entries.find(e => e.id === editingEntryId);
        updateEntry({ ...existingEntry, ...entryData, id: editingEntryId });
        alert('🌟 Recap updated!');
    } else {
        addEntry({ ...entryData, id: Date.now() });
        alert('🌟 Recap saved!');
    }
    
    saveData();
    renderTimeline();
    closeModal('recap-modal');
}

// --- Delete Handler ---

/**
 * Deletes the entry currently being edited (from any form).
 */
export function handleDeleteEntry() {
    const { editingEntryId } = getState();
    if (!editingEntryId) return;
    
    if (confirm('Delete this entry?')) {
        // 1. Remove from state
        removeEntry(editingEntryId);
        
        // 2. Sync with Firebase
        deleteEntryFromFirebase(editingEntryId);
        
        // 3. Save local data
        saveData();
        
        // 4. Re-render timeline
        renderTimeline();
        
        // 5. Close all modals (safest way)
        closeModal('crumb-modal');
        closeModal('timer-modal');
        closeModal('track-modal');
        closeModal('spent-modal');
        closeModal('recap-modal');
    }
}

// --- Edit & Preview Handlers ---

/**
 * Finds an entry by ID and opens the correct modal populated with its data.
 * @param {number|string} entryId - The ID of the entry to edit.
 */
export function handleEditEntry(entryId) {
    const entry = getState().entries.find(e => e.id == entryId);
    if (!entry) return;

    // Set the global editing ID
    setEditingId(entry.id);

    // Set timestamp for all forms
    const date = new Date(entry.timestamp);
    const isoString = new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);

    if (entry.isTimedActivity) {
        // --- Populate Timer Form ---
        document.getElementById('datetime-input-time').value = isoString;
        document.getElementById('time-optional-note').value = entry.optionalNote || '';
        document.getElementById('btn-save-time').textContent = '💾 Update Event';
        document.getElementById('btn-delete-time').classList.remove('hidden');
        setSelectedDuration(entry.duration);
        setSelectedActivity(entry.activity);
        updateTimerOptions(); // Re-render selectors with items selected
        checkTimerReady();
        openTimerForm(entry);

    } else if (entry.isQuickTrack) {
        // --- Populate Track Form ---
        document.getElementById('datetime-input-track').value = isoString;
        document.getElementById('track-optional-note').value = entry.optionalNote || '';
        document.getElementById('btn-save-track').textContent = '💾 Update Track';
        document.getElementById('btn-delete-track').classList.remove('hidden');
        setSelectedTrackItem(entry.note);
        updateTrackOptions(); // Re-render selectors
        checkTrackReady();
        openTrackForm(entry);

    } else if (entry.isSpent) {
        // --- Populate Spent Form ---
        document.getElementById('datetime-input-spent').value = isoString;
        document.getElementById('spent-description').value = entry.note;
        document.getElementById('spent-amount').value = entry.spentAmount;
        document.getElementById('btn-delete-spent').classList.remove('hidden');
        openSpentForm(entry);

    } else if (entry.type === 'recap') {
        // --- Populate Recap Form ---
        document.getElementById('datetime-input-recap').value = isoString;
        document.getElementById('recap-reflection').value = entry.reflection || '';
        document.getElementById('recap-rating').value = entry.rating || 5;
        document.getElementById('recap-rating-value').textContent = entry.rating || 5;
        document.getElementById('recap-highlight-1').value = (entry.highlights && entry.highlights[0]) || '';
        document.getElementById('recap-highlight-2').value = (entry.highlights && entry.highlights[1]) || '';
        document.getElementById('recap-highlight-3').value = (entry.highlights && entry.highlights[2]) || '';
        document.getElementById('recap-bso').value = '';
        document.getElementById('recap-bso-results').innerHTML = '';
        document.getElementById('recap-selected-track').value = '';
        if (entry.track) {
            selectTrackUI(entry.track);
        }
        document.getElementById('btn-delete-recap').classList.remove('hidden');
        openRecapForm(entry);

    } else {
        // --- Populate Crumb Form ---
        document.getElementById('datetime-input').value = isoString;
        document.getElementById('note-input').value = entry.note;
        document.getElementById('location-input').value = entry.location || '';
        document.getElementById('weather-input').value = entry.weather || '';
        
        // Set media state
        entry.images.forEach(img => addImage(img));
        setAudio(entry.audio || null);
        setCoords(entry.coords ? { ...entry.coords } : null);
        
        // Set mood state
        const moodIndex = entry.mood ? getState().settings.moods.findIndex(m => m.emoji === entry.mood.emoji) : -1;
        setSelectedMood(moodIndex !== -1 ? moodIndex : null);

        // Render UI from state
        renderImagePreviews();
        renderAudioPreview();
        renderMoodSelector();
        if (entry.coords) {
            showMiniMap(entry.coords.lat, entry.coords.lon, 'form-map');
        }

        document.getElementById('btn-delete-crumb').classList.remove('hidden');
        document.getElementById('btn-save-crumb').textContent = '💾 Update';
        openCrumbForm(entry);
    }
}

/**
 * Finds an entry and renders it in the preview modal.
 * @param {number|string} entryId - The ID of the entry to preview.
 * @param {number|null} [imageIndex=null] - Optional specific image to show.
 */
export function handlePreviewEntry(entryId, imageIndex = null) {
    const entry = getState().entries.find(e => e.id == entryId);
    if (!entry) return;

    if (imageIndex !== null) {
        renderImagePreviewModal(entry, imageIndex);
    } else {
        renderPreview(entry);
    }
    
    openModal('preview-modal');
}
