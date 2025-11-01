// ===== CRUD FUNCTIONS (Create, Read, Update, Delete) =====

/**
 * Saves or updates a standard "Crumb" entry.
 */
window.saveEntry = function() {
    const note = document.getElementById('note-input').value.trim();
    if (!note) {
        alert('Please write a note');
        return;
    }

    // global vars from app.js
    const moodData = selectedMood !== null ? window.moods[selectedMood] : null;
    const timestamp = window.getTimestampFromInput('datetime-input'); // global util

    if (editingEntryId) { // global var from app.js
        const entryIndex = window.entries.findIndex(e => e.id === editingEntryId);
        if (entryIndex !== -1) {
            window.entries[entryIndex] = {
                ...window.entries[entryIndex], // Keep original ID and type
                timestamp: timestamp,
                note: note,
                location: document.getElementById('location-input').value,
                weather: document.getElementById('weather-input').value,
                images: [...currentImages],
                audio: currentAudio,
                coords: currentCoords ? { ...currentCoords } : window.entries[entryIndex].coords,
                mood: moodData,
                // Ensure other types are false
                isTimedActivity: false,
                isQuickTrack: false,
                isSpent: false,
                type: null
            };
        }
    } else {
        const entry = {
            id: Date.now(),
            timestamp: timestamp,
            note: note,
            location: document.getElementById('location-input').value,
            weather: document.getElementById('weather-input').value,
            images: [...currentImages],
            audio: currentAudio,
            coords: currentCoords ? { ...currentCoords } : null,
            mood: moodData
        };
        window.entries.unshift(entry); // global var from app.js
    }

    saveData(); // global function in app.js
    window.renderTimeline(); // global function in ui-renderer.js
    window.toggleForm(); // global function in ui-handlers.js
}

/**
 * Main entry point for editing an entry. Delegates to specific edit functions.
 * @param {number} id - The ID of the entry to edit.
 */
window.editEntry = function(id) {
    const entry = window.entries.find(e => e.id === id); // global var from app.js
    if (!entry) return;

    // Delegate to specific handlers
    if (entry.isTimedActivity) {
        window.editTimeEvent(entry);
        return;
    }
    
    if (entry.isQuickTrack) {
        window.editTrackEvent(entry);
        return;
    }
    
    if (entry.isSpent) {
        window.editSpentEvent(entry);
        return;
    }

    if (entry.type === 'recap') {
        window.editRecapEvent(entry);
        return;
    }

    // --- Is a standard "Crumb" entry ---
    editingEntryId = id; // global var from app.js
    document.getElementById('note-input').value = entry.note;
    document.getElementById('location-input').value = entry.location || '';
    document.getElementById('weather-input').value = entry.weather || '';
    currentImages = [...(entry.images || [])]; // global var
    currentAudio = entry.audio || null; // global var
    currentCoords = entry.coords ? { ...entry.coords } : null; // global var

    // Set datetime
    const date = new Date(entry.timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    document.getElementById('datetime-input').value = `${year}-${month}-${day}T${hours}:${minutes}`;

    if (entry.mood) {
        const moodIndex = window.moods.findIndex(m => m.emoji === entry.mood.emoji && m.label === entry.mood.label);
        selectedMood = moodIndex !== -1 ? moodIndex : null; // global var
    } else {
        selectedMood = null; // global var
    }

    window.renderImagePreviews(); // global function in ui-renderer.js
    window.renderAudioPreview(); // global function in ui-renderer.js
    window.renderMoodSelector(); // global function in ui-renderer.js

    if (entry.coords) {
        window.showMiniMap(entry.coords.lat, entry.coords.lon, 'form-map'); // global util
    }

    document.getElementById('delete-btn').classList.remove('hidden');
    document.getElementById('save-btn').textContent = '💾 Update';
    
    // Show the correct form
    const formWindow = document.getElementById('form-window');
    document.getElementById('timer-window').classList.add('hidden');
    document.getElementById('track-window').classList.add('hidden');
    document.getElementById('spent-window').classList.add('hidden');
    document.getElementById('recap-form').classList.add('hidden');
    
    formWindow.classList.remove('hidden');
    formWindow.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/**
 * Populates the "Time" form to edit an existing time event.
 * @param {object} entry - The time event entry object.
 */
window.editTimeEvent = function(entry) {
    editingEntryId = entry.id; // global var
    
    selectedDuration = entry.duration; // global var
    selectedActivity = entry.activity; // global var
    
    // Set datetime
    const date = new Date(entry.timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    document.getElementById('datetime-input-time').value = `${year}-${month}-${day}T${hours}:${minutes}`;
    
    document.getElementById('time-optional-note').value = entry.optionalNote || '';
    
    // Ensure options are rendered (from settings-manager.js)
    if (typeof window.updateTimerOptions === 'function') {
        window.updateTimerOptions();
    }
    
    // Select correct options
    document.querySelectorAll('.duration-option').forEach(el => {
        el.classList.remove('selected');
        if (parseInt(el.dataset.duration) === selectedDuration) {
            el.classList.add('selected');
        }
    });
    
    document.querySelectorAll('#activity-selector .activity-option').forEach(el => {
        el.classList.remove('selected');
        if (el.dataset.activity === selectedActivity) {
            el.classList.add('selected');
        }
    });
    
    checkTimerReady(); // global function in app.js
    
    const timerWindow = document.getElementById('timer-window');
    document.getElementById('create-time-btn').textContent = '💾 Update Event';
    document.getElementById('delete-time-btn').classList.remove('hidden');
    
    // Show the correct form
    document.getElementById('form-window').classList.add('hidden');
    document.getElementById('track-window').classList.add('hidden');
    document.getElementById('spent-window').classList.add('hidden');
    document.getElementById('recap-form').classList.add('hidden');

    timerWindow.classList.remove('hidden');
    timerWindow.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/**
 * Saves or updates a "Time" event.
 */
window.createTimeEvent = function() {
    // global vars from app.js
    if (!selectedDuration || !selectedActivity) return;
    
    const timestamp = window.getTimestampFromInput('datetime-input-time'); // global util
    const optionalNote = document.getElementById('time-optional-note').value.trim();
    
    if (editingEntryId) { // global var
        const entryIndex = window.entries.findIndex(e => e.id === editingEntryId);
        if (entryIndex !== -1) {
            window.entries[entryIndex] = {
                ...window.entries[entryIndex],
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
                mood: null
            };
        }
        alert(`✅ Time event updated!`);
    } else {
        const entry = {
            id: Date.now(),
            timestamp: timestamp,
            note: `${selectedActivity} - ${selectedDuration} minutes`,
            location: '',
            weather: '',
            images: [],
            audio: null,
            coords: null,
            mood: null,
            activity: selectedActivity,
            duration: selectedDuration,
            isTimedActivity: true,
            optionalNote: optionalNote
        };
        
        window.entries.unshift(entry); // global var
        alert(`✅ Time event created!`);
    }
    
    saveData(); // global function in app.js
    window.renderTimeline(); // global function in ui-renderer.js
    
    window.toggleTimer(); // global function in ui-handlers.js
    
    // Reset form state
    editingEntryId = null; // global var
    document.getElementById('create-time-btn').textContent = 'Create Event';
    document.getElementById('delete-time-btn').classList.add('hidden');
    document.getElementById('time-optional-note').value = '';
}

/**
 * Populates the "Track" form to edit an existing track event.
 * @param {object} entry - The track event entry object.
 */
window.editTrackEvent = function(entry) {
    editingEntryId = entry.id; // global var
    selectedTrackItem = entry.note; // global var
    
    // Set datetime
    const date = new Date(entry.timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    document.getElementById('datetime-input-track').value = `${year}-${month}-${day}T${hours}:${minutes}`;
    
    document.getElementById('track-optional-note').value = entry.optionalNote || '';
    
    // Ensure options are rendered (from settings-manager.js)
    if (typeof window.updateTrackOptions === 'function') {
        window.updateTrackOptions();
    }
    
    // Select correct option
    document.querySelectorAll('#track-selector .activity-option').forEach(el => {
        if (el.dataset.item === selectedTrackItem) {
            el.classList.add('selected');
        }
    });
    
    document.getElementById('save-track-btn').disabled = false;
    document.getElementById('save-track-btn').textContent = '💾 Update Track';
    document.getElementById('delete-track-btn').classList.remove('hidden');
    
    // Show the correct form
    const trackWindow = document.getElementById('track-window');
    document.getElementById('form-window').classList.add('hidden');
    document.getElementById('timer-window').classList.add('hidden');
    document.getElementById('spent-window').classList.add('hidden');
    document.getElementById('recap-form').classList.add('hidden');

    trackWindow.classList.remove('hidden');
    trackWindow.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/**
 * Saves or updates a "Track" event.
 */
window.saveTrackEvent = function() {
    if (!selectedTrackItem) return; // global var
    
    const timestamp = window.getTimestampFromInput('datetime-input-track'); // global util
    const optionalNote = document.getElementById('track-optional-note').value.trim();
    
    if (editingEntryId) { // global var
        const entryIndex = window.entries.findIndex(e => e.id === editingEntryId);
        if (entryIndex !== -1) {
            window.entries[entryIndex] = {
                ...window.entries[entryIndex],
                timestamp: timestamp,
                note: selectedTrackItem,
                optionalNote: optionalNote,
                isQuickTrack: true,
                // Clear other types
                isTimedActivity: false,
                isSpent: false,
                type: null,
                mood: null
            };
        }
        alert(`✅ Track updated: ${selectedTrackItem}`);
    } else {
        const entry = {
            id: Date.now(),
            timestamp: timestamp,
            note: selectedTrackItem,
            location: '',
            weather: '',
            images: [],
            audio: null,
            coords: null,
            mood: null,
            isQuickTrack: true,
            optionalNote: optionalNote
        };
        
        window.entries.unshift(entry); // global var
        alert(`✅ Tracked: ${selectedTrackItem}`);
    }
    
    saveData(); // global function in app.js
    window.renderTimeline(); // global function in ui-renderer.js
    window.toggleTrack(); // global function in ui-handlers.js
    
    // Reset form state
    editingEntryId = null; // global var
    document.getElementById('save-track-btn').textContent = 'Save Track';
    document.getElementById('delete-track-btn').classList.add('hidden');
}

/**
 * Populates the "Spent" form to edit an existing spent event.
 * @param {object} entry - The spent event entry object.
 */
window.editSpentEvent = function(entry) {
    editingEntryId = entry.id; // global var
    
    document.getElementById('spent-description').value = entry.note;
    document.getElementById('spent-amount').value = entry.spentAmount;
    
    // Set datetime
    const date = new Date(entry.timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    document.getElementById('datetime-input-spent').value = `${year}-${month}-${day}T${hours}:${minutes}`;
    
    document.getElementById('delete-spent-btn').classList.remove('hidden');
    
    // Show the correct form
    const spentWindow = document.getElementById('spent-window');
    document.getElementById('form-window').classList.add('hidden');
    document.getElementById('timer-window').classList.add('hidden');
    document.getElementById('track-window').classList.add('hidden');
    document.getElementById('recap-form').classList.add('hidden');

    spentWindow.classList.remove('hidden');
    spentWindow.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/**
 * Saves or updates a "Spent" event.
 */
window.saveSpent = function() {
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

    const timestamp = window.getTimestampFromInput('datetime-input-spent'); // global util

    if (editingEntryId) { // global var
        const entryIndex = window.entries.findIndex(e => e.id === editingEntryId);
        if (entryIndex !== -1) {
            window.entries[entryIndex] = {
                ...window.entries[entryIndex],
                timestamp: timestamp,
                note: description,
                spentAmount: amount,
                isSpent: true,
                // Clear other types
                isTimedActivity: false,
                isQuickTrack: false,
                type: null,
                mood: null
            };
        }
        alert(`✅ Spent updated: €${amount.toFixed(2)}`);
    } else {
        const entry = {
            id: Date.now(),
            timestamp: timestamp,
            note: description,
            location: '',
            weather: '',
            images: [],
            audio: null,
            coords: null,
            mood: null,
            spentAmount: amount,
            isSpent: true
        };
        
        window.entries.unshift(entry); // global var
        alert(`✅ Spent tracked: €${amount.toFixed(2)}`);
    }
    
    saveData(); // global function in app.js
    window.renderTimeline(); // global function in ui-renderer.js
    window.toggleSpent(); // global function in ui-handlers.js

    // Reset form state
    editingEntryId = null; // global var
    document.getElementById('delete-spent-btn').classList.add('hidden');
}

/**
 * Populates the "Recap" form to edit an existing recap event.
 * @param {object} entry - The recap event entry object.
 */
window.editRecapEvent = function(entry) {
    editingEntryId = entry.id; // global var
    
    // Show the correct form
    document.getElementById('form-window').classList.add('hidden');
    document.getElementById('timer-window').classList.add('hidden');
    document.getElementById('track-window').classList.add('hidden');
    document.getElementById('spent-window').classList.add('hidden');
    
    const recapForm = document.getElementById('recap-form');
    recapForm.classList.remove('hidden');

    // Set datetime
    const date = new Date(entry.timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    document.getElementById('datetime-input-recap').value = `${year}-${month}-${day}T${hours}:${minutes}`;
    
    document.getElementById('recap-reflection').value = entry.reflection || '';
    document.getElementById('recap-rating').value = entry.rating || 5;
    document.getElementById('recap-rating-value').textContent = entry.rating || 5;
    
    document.getElementById('recap-highlight-1').value = (entry.highlights && entry.highlights[0]) || '';
    document.getElementById('recap-highlight-2').value = (entry.highlights && entry.highlights[1]) || '';
    document.getElementById('recap-highlight-3').value = (entry.highlights && entry.highlights[2]) || '';
    
    // Clear old search
    document.getElementById('recap-bso').value = '';
    document.getElementById('recap-bso-results').innerHTML = '';
    document.getElementById('recap-selected-track').value = '';
    
    if (entry.track) {
        // Display the selected track
        window.selectTrack(entry.track.name, entry.track.artist, entry.track.url, entry.track.artwork); // global util
    }
    
    recapForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/**
 * Saves or updates a "Recap" event.
 */
window.saveRecap = function() {
    const reflection = document.getElementById('recap-reflection').value.trim();
    const rating = document.getElementById('recap-rating').value;
    const highlight1 = document.getElementById('recap-highlight-1').value.trim();
    const highlight2 = document.getElementById('recap-highlight-2').value.trim();
    const highlight3 = document.getElementById('recap-highlight-3').value.trim();
    const selectedTrackJson = document.getElementById('recap-selected-track').value;
    const timestamp = window.getTimestampFromInput('datetime-input-recap'); // global util
    
    if (!reflection && !highlight1 && !highlight2 && !highlight3) {
        alert('Please add at least one reflection or highlight');
        return;
    }
    
    const recapEntry = {
        id: editingEntryId || Date.now(), // global var
        timestamp: timestamp,
        type: 'recap',
        reflection: reflection,
        rating: parseInt(rating),
        highlights: [highlight1, highlight2, highlight3].filter(h => h), // Only save non-empty highlights
        track: selectedTrackJson ? JSON.parse(selectedTrackJson) : null,
        // Ensure other fields are clean
        note: `Day Recap (Rating: ${rating}/10)`,
        isTimedActivity: false,
        isQuickTrack: false,
        isSpent: false,
        mood: null
    };

    if (editingEntryId) { // global var
        const entryIndex = window.entries.findIndex(e => e.id === editingEntryId);
        if (entryIndex !== -1) {
            window.entries[entryIndex] = recapEntry;
        }
        alert('🌟 Recap updated!');
    } else {
        window.entries.unshift(recapEntry); // global var
        alert('🌟 Recap saved!');
    }
    
    editingEntryId = null; // global var
    
    saveData(); // global function in app.js
    window.renderTimeline(); // global function in ui-renderer.js
    window.closeRecapForm(); // global function in ui-handlers.js
}

/**
 * Deletes the entry currently being edited (from any form).
 */
window.deleteCurrentEntry = function() {
    if (!editingEntryId) return; // global var
    
    // Determine which form is active to close it
    let formIdToDelete = null;
    if (!document.getElementById('form-window').classList.contains('hidden')) formIdToDelete = 'form-window';
    else if (!document.getElementById('timer-window').classList.contains('hidden')) formIdToDelete = 'timer-window';
    else if (!document.getElementById('track-window').classList.contains('hidden')) formIdToDelete = 'track-window';
    else if (!document.getElementById('spent-window').classList.contains('hidden')) formIdToDelete = 'spent-window';
    else if (!document.getElementById('recap-form').classList.contains('hidden')) formIdToDelete = 'recap-form';
    
    if (confirm('Delete this entry?')) {
        window.entries = window.entries.filter(e => e.id !== editingEntryId); // global var
        
        // Firebase deletion (from firebase-config.js)
        if (window.currentUser && !window.isOfflineMode) {
            window.deleteEntryFromFirebase(editingEntryId); 
        }
        
        saveData(); // global function in app.js
        window.renderTimeline(); // global function in ui-renderer.js
        
        // Close the active form
        if (formIdToDelete) {
            document.getElementById(formIdToDelete).classList.add('hidden');
        }
        
        editingEntryId = null; // global var
    }
}
