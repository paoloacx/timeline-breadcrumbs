// ===== crud-handlers.js (Create, Read, Update, Delete Logic) =====

// Imports
// CAMBIO: Rutas actualizadas para apuntar a 'core/'
import { getState, addEntry, updateEntry, removeEntry, setEditingId, setSelectedMood, setCoords, setAudio, addImage, clearFormState, clearTimerState, clearTrackState, clearSpentState, clearRecapState, setSelectedDuration, setSelectedActivity, setSelectedTrackItem } from './core/state.js';
import { saveData } from './core/storage.js';
import { deleteEntryFromFirebase } from './firebase-config.js';
import { renderMoodSelector, renderImagePreviews, renderAudioPreview, showMiniMap, selectTrackUI } from './ui-renderer.js';
import { renderPreview, renderImagePreviewModal } from './modules/ui/preview.js';
import { closeModal, openModal, openCrumbForm, openTimerForm, openTrackForm, openSpentForm, openRecapForm } from './modules/ui/modal-manager.js';
import { renderTimeline } from './modules/timeline/timeline.js';
import { getTimestampFromInput, setCurrentDateTime } from './utils.js';
import { updateTimerOptions, updateTrackOptions, checkTimerReady, checkTrackReady } from './modules/settings/settings-manager.js';

// --- Save Handlers ---

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
        isTimedActivity: false, isQuickTrack: false, isSpent: false, type: null
    };

    if (editingEntryId) {
        const existingEntry = getState().entries.find(e => e.id == editingEntryId);
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
        isQuickTrack: false, isSpent: false, type: null, mood: null,
        location: '', weather: '', images: [], audio: null, coords: null,
    };

    if (editingEntryId) {
        const existingEntry = getState().entries.find(e => e.id == editingEntryId);
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
        isTimedActivity: false, isSpent: false, type: null, mood: null,
        location: '', weather: '', images: [], audio: null, coords: null,
    };

    if (editingEntryId) {
        const existingEntry = getState().entries.find(e => e.id == editingEntryId);
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
        isTimedActivity: false, isQuickTrack: false, type: null, mood: null,
        location: '', weather: '', images: [], audio: null, coords: null,
    };

    if (editingEntryId) {
        const existingEntry = getState().entries.find(e => e.id == editingEntryId);
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
        isTimedActivity: false, isQuickTrack: false, isSpent: false, mood: null,
    };

    if (editingEntryId) {
        const existingEntry = getState().entries.find(e => e.id == editingEntryId);
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

export function handleDeleteEntry() {
    const { editingEntryId } = getState();
    if (!editingEntryId) {
        console.warn("Delete clicked but no editingEntryId is set in state.");
        return; // No ID, no delete
    }
    
    if (confirm('Delete this entry?')) {
        // 1. Remove from state
        removeEntry(editingEntryId);
        
        // 2. Sync with Firebase
        deleteEntryFromFirebase(editingEntryId);
        
        // 3. Save local data
        saveData();
        
        // 4. Re-render timeline
        renderTimeline();
        
        // 5. Close all modals
        closeModal('crumb-modal');
        closeModal('timer-modal');
        closeModal('track-modal');
        closeModal('spent-modal');
        closeModal('recap-modal');
    }
}

// --- Edit & Preview Handlers ---

export function handleEditEntry(entryId) {
    const entry = getState().entries.find(e => e.id == entryId);
    if (!entry) return;

    // Set timestamp for all forms
    const date = new Date(entry.timestamp);
    const isoString = new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);

    if (entry.isTimedActivity) {
        clearTimerState(); 
        setEditingId(entry.id);
        
        document.getElementById('datetime-input-time').value = isoString;
        document.getElementById('time-optional-note').value = entry.optionalNote || '';
        document.getElementById('btn-save-time').textContent = '💾 Update Event';
        document.getElementById('btn-delete-time').classList.remove('hidden');
        setSelectedDuration(entry.duration);
        setSelectedActivity(entry.activity);
        updateTimerOptions(); 
        checkTimerReady();
        openTimerForm(entry);

    } else if (entry.isQuickTrack) {
        clearTrackState();
        setEditingId(entry.id);

        document.getElementById('datetime-input-track').value = isoString;
        document.getElementById('track-optional-note').value = entry.optionalNote || '';
        document.getElementById('btn-save-track').textContent = '💾 Update Track';
        document.getElementById('btn-delete-track').classList.remove('hidden');
        setSelectedTrackItem(entry.note);
        updateTrackOptions();
        checkTrackReady();
        openTrackForm(entry);

    } else if (entry.isSpent) {
        clearSpentState();
        setEditingId(entry.id);

        document.getElementById('datetime-input-spent').value = isoString;
        document.getElementById('spent-description').value = entry.note;
        document.getElementById('spent-amount').value = entry.spentAmount;
        document.getElementById('btn-delete-spent').classList.remove('hidden');
        openSpentForm(entry);

    } else if (entry.type === 'recap') {
        clearRecapState();
        setEditingId(entry.id);

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
        clearFormState();
        setEditingId(entry.id);

        document.getElementById('datetime-input').value = isoString;
        document.getElementById('note-input').value = entry.note;
        document.getElementById('location-input').value = entry.location || '';
        document.getElementById('weather-input').value = entry.weather || '';
        
        if (entry.images) entry.images.forEach(img => addImage(img));
        setAudio(entry.audio || null);
        setCoords(entry.coords ? { ...entry.coords } : null);
        
        const moodIndex = entry.mood ? getState().settings.moods.findIndex(m => m.emoji === entry.mood.emoji) : -1;
        setSelectedMood(moodIndex !== -1 ? moodIndex : null);

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

export function handlePreviewEntry(entryId, imageIndex = null) {
    const entry = getState().entries.find(e => e.id == entryId);
    if (!entry) return;

    if (imageIndex !== null && imageIndex !== undefined) {
        renderImagePreviewModal(entry, imageIndex);
    } else {
        renderPreview(entry);
    }
    
    openModal('preview-modal');
}
