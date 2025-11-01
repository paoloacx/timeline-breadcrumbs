// =================================================================
// CRUD HANDLERS (crud-handlers.js)
// =================================================================
// Contiene la lógica para Crear, Leer, Actualizar y Borrar (CRUD) entradas.

// --- Crumb (Nota principal) ---

window.saveEntry = function() {
    const note = document.getElementById('note-input').value.trim();
    if (!note) {
        alert('Please write a note');
        return;
    }

    // Variables de state-manager.js
    const moodData = selectedMood !== null ? window.moods[selectedMood] : null;
    const timestamp = getTimestampFromInput('datetime-input'); // De utils.js

    if (editingEntryId) {
        const entryIndex = window.entries.findIndex(e => e.id === editingEntryId);
        if (entryIndex !== -1) {
            window.entries[entryIndex] = {
                ...window.entries[entryIndex],
                timestamp: timestamp,
                note: note,
                location: document.getElementById('location-input').value,
                weather: document.getElementById('weather-input').value,
                images: [...currentImages],
                audio: currentAudio,
                coords: currentCoords ? { ...currentCoords } : window.entries[entryIndex].coords,
                mood: moodData,
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
        window.entries.unshift(entry);
    }

    saveData(); // De app.js
    renderTimeline(); // De ui-renderer.js
    window.toggleForm(); // De ui-handlers.js
}

window.editEntry = function(id) {
    const entry = window.entries.find(e => e.id === id); // window.entries de state-manager.js
    if (!entry) return;

    if (entry.isTimedActivity) {
        editTimeEvent(entry);
        return;
    }
    if (entry.isQuickTrack) {
        editTrackEvent(entry);
        return;
    }
    if (entry.isSpent) {
        editSpentEvent(entry);
        return;
    }
    if (entry.type === 'recap') {
        editRecapEvent(entry);
        return;
    }

    // Es un "Crumb" normal
    // Variables de state-manager.js
    editingEntryId = id;
    currentImages = [...(entry.images || [])];
    currentAudio = entry.audio || null;
    currentCoords = entry.coords ? { ...entry.coords } : null;

    document.getElementById('note-input').value = entry.note;
    document.getElementById('location-input').value = entry.location || '';
    document.getElementById('weather-input').value = entry.weather || '';

    const date = new Date(entry.timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    document.getElementById('datetime-input').value = `${year}-${month}-${day}T${hours}:${minutes}`;

    if (entry.mood) {
        const moodIndex = window.moods.findIndex(m => m.emoji === entry.mood.emoji && m.label === entry.mood.label);
        selectedMood = moodIndex !== -1 ? moodIndex : null;
    } else {
        selectedMood = null;
    }

    renderImagePreviews(); // De media-handlers.js
    renderAudioPreview(); // De media-handlers.js
    window.renderMoodSelector(); // De ui-renderer.js

    if (entry.coords) {
        showMiniMap(entry.coords.lat, entry.coords.lon, 'form-map'); // De ui-renderer.js
    }

    document.getElementById('delete-btn').classList.remove('hidden');
    document.getElementById('save-btn').textContent = '💾 Update';
    
    const formWindow = document.getElementById('form-window');
    document.getElementById('timer-window').classList.add('hidden');
    document.getElementById('track-window').classList.add('hidden');
    document.getElementById('spent-window').classList.add('hidden');
    document.getElementById('recap-form').classList.add('hidden');
    
    formWindow.classList.remove('hidden');
    formWindow.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// --- Time Event ---

function editTimeEvent(entry) {
    // Variables de state-manager.js
    editingEntryId = entry.id;
    selectedDuration = entry.duration;
    selectedActivity = entry.activity;
    
    const date = new Date(entry.timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    document.getElementById('datetime-input-time').value = `${year}-${month}-${day}T${hours}:${minutes}`;
    
    document.getElementById('time-optional-note').value = entry.optionalNote || '';
    
    if (typeof window.updateTimerOptions === 'function') { // De settings-manager.js
        window.updateTimerOptions();
    }
    
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
    
    checkTimerReady(); // De ui-handlers.js
    
    const timerWindow = document.getElementById('timer-window');
    document.getElementById('create-time-btn').textContent = '💾 Update Event';
    document.getElementById('delete-time-btn').classList.remove('hidden');
    
    document.getElementById('form-window').classList.add('hidden');
    document.getElementById('track-window').classList.add('hidden');
    document.getElementById('spent-window').classList.add('hidden');
    document.getElementById('recap-form').classList.add('hidden');

    timerWindow.classList.remove('hidden');
    timerWindow.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

window.createTimeEvent = function() {
    // Variables de state-manager.js
    if (!selectedDuration || !selectedActivity) return;
    
    const timestamp = getTimestampFromInput('datetime-input-time'); // De utils.js
    const optionalNote = document.getElementById('time-optional-note').value.trim();
    
    if (editingEntryId) {
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
                isQuickTrack: false,
                isSpent: false,
                type: null,
                mood: null
            };
        }
        editingEntryId = null;
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
        window.entries.unshift(entry);
    }
    
    saveData(); // De app.js
    renderTimeline(); // De ui-renderer.js
    
    alert(`✅ Time event ${editingEntryId ? 'updated' : 'created'}!`);
    window.toggleTimer(); // De ui-handlers.js
    
    document.getElementById('create-time-btn').textContent = 'Create Event';
    document.getElementById('delete-time-btn').classList.add('hidden');
    document.getElementById('time-optional-note').value = '';
}

// --- Track Event ---

function editTrackEvent(entry) {
    // Variables de state-manager.js
    editingEntryId = entry.id;
    selectedTrackItem = entry.note;
    
    const date = new Date(entry.timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    document.getElementById('datetime-input-track').value = `${year}-${month}-${day}T${hours}:${minutes}`;
    
    document.getElementById('track-optional-note').value = entry.optionalNote || '';
    
    if (typeof window.updateTrackOptions === 'function') { // De settings-manager.js
        window.updateTrackOptions();
    }
    
    document.querySelectorAll('#track-selector .activity-option').forEach(el => {
        if (el.dataset.item === selectedTrackItem) {
            el.classList.add('selected');
        }
    });
    
    document.getElementById('save-track-btn').disabled = false;
    document.getElementById('save-track-btn').textContent = '💾 Update Track';
    document.getElementById('delete-track-btn').classList.remove('hidden');
    
    const trackWindow = document.getElementById('track-window');
    document.getElementById('form-window').classList.add('hidden');
    document.getElementById('timer-window').classList.add('hidden');
    document.getElementById('spent-window').classList.add('hidden');
    document.getElementById('recap-form').classList.add('hidden');

    trackWindow.classList.remove('hidden');
    trackWindow.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

window.saveTrackEvent = function() {
    if (!selectedTrackItem) return; // De state-manager.js
    
    const timestamp = getTimestampFromInput('datetime-input-track'); // De utils.js
    const optionalNote = document.getElementById('track-optional-note').value.trim();
    
    if (editingEntryId) {
        const entryIndex = window.entries.findIndex(e => e.id === editingEntryId);
        if (entryIndex !== -1) {
            window.entries[entryIndex] = {
                ...window.entries[entryIndex],
                timestamp: timestamp,
                note: selectedTrackItem,
                optionalNote: optionalNote,
                isQuickTrack: true,
                isTimedActivity: false,
                isSpent: false,
                type: null,
                mood: null
            };
        }
        editingEntryId = null;
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
        window.entries.unshift(entry);
        alert(`✅ Tracked: ${selectedTrackItem}`);
    }
    
    saveData(); // De app.js
    renderTimeline(); // De ui-renderer.js
  T window.toggleTrack(); // De ui-handlers.js
    
    document.getElementById('save-track-btn').textContent = 'Save Track';
    document.getElementById('delete-track-btn').classList.add('hidden');
}

// --- Spent Event ---

function editSpentEvent(entry) {
    editingEntryId = entry.id; // De state-manager.js
    
    document.getElementById('spent-description').value = entry.note;
    document.getElementById('spent-amount').value = entry.spentAmount;
    
    const date = new Date(entry.timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    document.getElementById('datetime-input-spent').value = `${year}-${month}-${day}T${hours}:${minutes}`;
    
    document.getElementById('delete-spent-btn').classList.remove('hidden');
    
    const spentWindow = document.getElementById('spent-window');
    document.getElementById('form-window').classList.add('hidden');
    document.getElementById('timer-window').classList.add('hidden');
    document.getElementById('track-window').classList.add('hidden');
    document.getElementById('recap-form').classList.add('hidden');

    spentWindow.classList.remove('hidden');
    spentWindow.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

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

    const timestamp = getTimestampFromInput('datetime-input-spent'); // De utils.js

    if (editingEntryId) {
        const entryIndex = window.entries.findIndex(e => e.id === editingEntryId);
        if (entryIndex !== -1) {
            window.entries[entryIndex] = {
                ...window.entries[entryIndex],
                timestamp: timestamp,
                note: description,
                spentAmount: amount,
                isSpent: true,
                isTimedActivity: false,
                isQuickTrack: false,
                type: null,
                mood: null
            };
        }
        editingEntryId = null;
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
        window.entries.unshift(entry);
        alert(`✅ Spent tracked: €${amount.toFixed(2)}`);
    }
    
    saveData(); // De app.js
    renderTimeline(); // De ui-renderer.js
    window.toggleSpent(); // De ui-handlers.js
    document.getElementById('delete-spent-btn').classList.add('hidden');
}

// --- Recap Event ---

function editRecapEvent(entry) {
    editingEntryId = entry.id; // De state-manager.js
    
    document.getElementById('form-window').classList.add('hidden');
    document.getElementById('timer-window').classList.add('hidden');
    document.getElementById('track-window').classList.add('hidden');
    document.getElementById('spent-window').classList.add('hidden');
    
    const recapForm = document.getElementById('recap-form');
    recapForm.classList.remove('hidden');

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
    
    document.getElementById('recap-bso').value = '';
    document.getElementById('recap-bso-results').innerHTML = '';
    document.getElementById('recap-selected-track').value = '';
    
    if (entry.track) {
        window.selectTrack(entry.track.name, entry.track.artist, entry.track.url, entry.track.artwork); // De ui-handlers.js
    }
    
    recapForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

window.saveRecap = function() {
    const reflection = document.getElementById('recap-reflection').value.trim();
    const rating = document.getElementById('recap-rating').value;
    const highlight1 = document.getElementById('recap-highlight-1').value.trim();
    const highlight2 = document.getElementById('recap-highlight-2').value.trim();
    const highlight3 = document.getElementById('recap-highlight-3').value.trim();
    const selectedTrackJson = document.getElementById('recap-selected-track').value;
    const timestamp = getTimestampFromInput('datetime-input-recap'); // De utils.js
    
    if (!reflection && !highlight1 && !highlight2 && !highlight3) {
        alert('Please add at least one reflection or highlight');
        return;
    }
    
    const recapEntry = {
        id: editingEntryId || Date.now(), // editingEntryId de state-manager.js
        timestamp: timestamp,
        type: 'recap',
        reflection: reflection,
        rating: parseInt(rating),
        highlights: [highlight1, highlight2, highlight3].filter(h => h),
        track: selectedTrackJson ? JSON.parse(selectedTrackJson) : null,
        note: `Day Recap (Rating: ${rating}/10)`,
        isTimedActivity: false,
        isQuickTrack: false,
        isSpent: false,
        mood: null
    };

    if (editingEntryId) {
        const entryIndex = window.entries.findIndex(e => e.id === editingEntryId);
        if (entryIndex !== -1) {
            window.entries[entryIndex] = recapEntry;
        }
        editingEntryId = null;
        alert('🌟 Recap updated!');
    } else {
        window.entries.unshift(recapEntry);
        alert('🌟 Recap saved!');
    }
    
    saveData(); // De app.js
    renderTimeline(); // De ui-renderer.js
    window.closeRecapForm(); // De ui-handlers.js
}

// --- Delete ---

window.deleteCurrentEntry = function() {
    if (!editingEntryId) return; // De state-manager.js
    
    let formIdToDelete = null;
    if (!document.getElementById('form-window').classList.contains('hidden')) formIdToDelete = 'form-window';
    else if (!document.getElementById('timer-window').classList.contains('hidden')) formIdToDelete = 'timer-window';
    else if (!document.getElementById('track-window').classList.contains('hidden')) formIdToDelete = 'track-window';
    else if (!document.getElementById('spent-window').classList.contains('hidden')) formIdToDelete = 'spent-window';
    else if (!document.getElementById('recap-form').classList.contains('hidden')) formIdToDelete = 'recap-form';
    
    if (confirm('Delete this entry?')) {
        window.entries = window.entries.filter(e => e.id !== editingEntryId);
        
        if (window.currentUser && !window.isOfflineMode) { // De firebase-config.js
            window.deleteEntryFromFirebase(editingEntryId); // De firebase-config.js
        }
        
        saveData(); // De app.js
        renderTimeline(); // De ui-renderer.js
        
        if (formIdToDelete) {
            document.getElementById(formIdToDelete).classList.add('hidden');
        }
        
        editingEntryId = null;
    }
}
