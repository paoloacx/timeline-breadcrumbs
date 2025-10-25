// --- Funciones de Guardado/Edición de Entradas ---

// Guardar/Actualizar un "Crumb" (entrada normal)
function saveEntry() {
    const note = document.getElementById('note-input').value.trim();
    if (!note) {
        alert('Please write a note');
        return;
    }

    const moodData = selectedMood !== null ? moods[selectedMood] : null;
    const timestamp = getTimestampFromInput('datetime-input');

    if (editingEntryId) {
        // Actualizar entrada existente
        const entryIndex = entries.findIndex(e => e.id === editingEntryId);
        if (entryIndex !== -1) {
            entries[entryIndex] = {
                ...entries[entryIndex],
                timestamp: timestamp,
                note: note,
                location: document.getElementById('location-input').value,
                weather: document.getElementById('weather-input').value,
                images: [...currentImages],
                audio: currentAudio,
                coords: currentCoords ? { ...currentCoords } : entries[entryIndex].coords,
                mood: moodData
            };
        }
    } else {
        // Crear entrada nueva
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
        entries.unshift(entry);
    }

    saveData();
    renderTimeline();
    toggleForm();
}

// "Enrutador" principal para editar cualquier tipo de entrada
function editEntry(id) {
    const entry = entries.find(e => e.id === id);
    if (!entry) return;

    // Diferenciar el tipo de entrada para llamar a la función de edición correcta
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

    // Si no es ninguno de los anteriores, es un "Crumb" normal
    editingEntryId = id;
    document.getElementById('note-input').value = entry.note;
    document.getElementById('location-input').value = entry.location || '';
    document.getElementById('weather-input').value = entry.weather || '';
    currentImages = [...(entry.images || [])];
    currentAudio = entry.audio || null;
    currentCoords = entry.coords ? { ...entry.coords } : null;

    // Set datetime
    const date = new Date(entry.timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    document.getElementById('datetime-input').value = `${year}-${month}-${day}T${hours}:${minutes}`;

    if (entry.mood) {
        const moodIndex = moods.findIndex(m => m.emoji === entry.mood.emoji && m.label === entry.mood.label);
        selectedMood = moodIndex !== -1 ? moodIndex : null;
    } else {
        selectedMood = null;
    }

    renderImagePreviews();
    renderAudioPreview();
    renderMoodSelector();

    if (entry.coords) {
        showMiniMap(entry.coords.lat, entry.coords.lon, 'form-map');
    }

    document.getElementById('delete-btn').classList.remove('hidden');
    document.getElementById('save-btn').textContent = '💾 Update';
    
    const formWindow = document.getElementById('form-window');
    formWindow.classList.remove('hidden');
    formWindow.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// --- Funciones Específicas de "Time Event" ---

function editTimeEvent(entry) {
    editingEntryId = entry.id;
    
    selectedDuration = entry.duration;
    selectedActivity = entry.activity;
    
    // Set datetime
    const date = new Date(entry.timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    document.getElementById('datetime-input-time').value = `${year}-${month}-${day}T${hours}:${minutes}`;
    
    // Settear nota opcional
    document.getElementById('time-optional-note').value = entry.optionalNote || '';

    document.querySelectorAll('.duration-option').forEach(el => {
        el.classList.remove('selected');
        // Usar data-minutes para una comparación numérica fiable
        const durationMinutes = parseInt(el.dataset.minutes || 0, 10);
        if (durationMinutes === selectedDuration) {
            el.classList.add('selected');
        }
    });
    
    document.querySelectorAll('#activity-selector .activity-option').forEach(el => {
        el.classList.remove('selected');
        if (el.textContent.trim() === selectedActivity) {
            el.classList.add('selected');
        }
    });
    
    checkTimerReady();
    
    const timerWindow = document.getElementById('timer-window');
    const createBtn = document.getElementById('create-time-btn');
    createBtn.textContent = '💾 Update Event';
    document.getElementById('delete-time-btn').classList.remove('hidden');
    
    timerWindow.classList.remove('hidden');
    timerWindow.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function createTimeEvent() {
    if (!selectedDuration || !selectedActivity) return;
    
    const timestamp = getTimestampFromInput('datetime-input-time');
    const optionalNote = document.getElementById('time-optional-note').value.trim();
    
    if (editingEntryId) {
        // Actualizar
        const entryIndex = entries.findIndex(e => e.id === editingEntryId);
        if (entryIndex !== -1) {
            entries[entryIndex] = {
                ...entries[entryIndex],
                timestamp: timestamp,
                note: `${selectedActivity} - ${selectedDuration} minutes`,
                activity: selectedActivity,
                duration: selectedDuration,
                optionalNote: optionalNote
            };
        }
        alert(`✅ Time event updated!`);
    } else {
        // Crear nuevo
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
        
        entries.unshift(entry);
        alert(`✅ Time event created!`);
    }
    
    saveData();
    renderTimeline();
    toggleTimer();
    
    // Resetear formulario de tiempo
    document.getElementById('create-time-btn').textContent = 'Create Event';
    document.getElementById('delete-time-btn').classList.add('hidden');
    document.getElementById('time-optional-note').value = '';
    editingEntryId = null; // Asegurarse de limpiar el ID de edición
}

// --- Funciones Específicas de "Track Event" ---

function editTrackEvent(entry) {
    editingEntryId = entry.id;
    selectedTrackItem = entry.note;
    
    // Set datetime
    const date = new Date(entry.timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    document.getElementById('datetime-input-track').value = `${year}-${month}-${day}T${hours}:${minutes}`;
    
    document.getElementById('track-optional-note').value = entry.optionalNote || '';
    
    renderTrackSelector(); // Renderiza las opciones
    
    // Selecciona la opción correcta
    document.querySelectorAll('#track-selector .activity-option').forEach(el => {
        if (el.textContent.trim() === selectedTrackItem) {
            el.classList.add('selected');
        }
    });
    
    document.getElementById('save-track-btn').disabled = false;
    document.getElementById('save-track-btn').textContent = '💾 Update Track';
    document.getElementById('delete-track-btn').classList.remove('hidden');
    
    const trackWindow = document.getElementById('track-window');
    trackWindow.classList.remove('hidden');
    trackWindow.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function saveTrackEvent() {
    if (!selectedTrackItem) return;
    
    const timestamp = getTimestampFromInput('datetime-input-track');
    const optionalNote = document.getElementById('track-optional-note').value.trim();
    
    if (editingEntryId) {
        // Actualizar
        const entryIndex = entries.findIndex(e => e.id === editingEntryId);
        if (entryIndex !== -1) {
            entries[entryIndex] = {
                ...entries[entryIndex],
                timestamp: timestamp,
                note: selectedTrackItem,
                optionalNote: optionalNote
            };
        }
        alert(`✅ Track updated: ${selectedTrackItem}`);
    } else {
        // Crear nuevo
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
        
        entries.unshift(entry);
        alert(`✅ Tracked: ${selectedTrackItem}`);
    }
    
    saveData();
    renderTimeline();
    toggleTrack();
    
    // Resetear formulario de track
    document.getElementById('save-track-btn').textContent = 'Save Track';
    document.getElementById('delete-track-btn').classList.add('hidden');
    editingEntryId = null; // Asegurarse de limpiar el ID de edición
}

// --- Funciones Específicas de "Spent Event" ---

function editSpentEvent(entry) {
    editingEntryId = entry.id;
    
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
    
    const spentWindow = document.getElementById('spent-window');
    spentWindow.classList.remove('hidden');
    spentWindow.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function saveSpent() {
    const description = document.getElementById('spent-description').value.trim();
    const amount = parseFloat(document.getElementById('spent-amount').value);

    if (!description) {
        alert('Please enter a description');
        return;
    }

    if (!amount || amount <= 0) {
        alert('Please enter a valid amount');
        return;
    }

    const timestamp = getTimestampFromInput('datetime-input-spent');

    if (editingEntryId) {
        // Actualizar
        const entryIndex = entries.findIndex(e => e.id === editingEntryId);
        if (entryIndex !== -1) {
            entries[entryIndex] = {
                ...entries[entryIndex],
                timestamp: timestamp,
                note: description,
                spentAmount: amount
            };
        }
        alert(`✅ Spent updated: €${amount.toFixed(2)}`);
    } else {
        // Crear nuevo
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
        
        entries.unshift(entry);
        alert(`✅ Spent tracked: €${amount.toFixed(2)}`);
    }
    
    saveData();
    renderTimeline();
    toggleSpent();

    // Resetear formulario de spent
    document.getElementById('delete-spent-btn').classList.add('hidden');
    editingEntryId = null; // Asegurarse de limpiar el ID de edición
}


// --- Funciones Específicas de "Recap Event" ---

function editRecapEvent(entry) {
    editingEntryId = entry.id;
    
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
    
    if (entry.highlights && entry.highlights.length > 0) {
        document.getElementById('recap-highlight-1').value = entry.highlights[0] || '';
        document.getElementById('recap-highlight-2').value = entry.highlights[1] || '';
        document.getElementById('recap-highlight-3').value = entry.highlights[2] || '';
    }
    
    if (entry.track) {
        // Llama a selectTrack para poblar la UI
        selectTrack(entry.track.name, entry.track.artist, entry.track.url, entry.track.artwork);
    }
    
    const recapForm = document.getElementById('recap-form');
    recapForm.classList.remove('hidden');
    recapForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function saveRecap() {
    const reflection = document.getElementById('recap-reflection').value.trim();
    const rating = document.getElementById('recap-rating').value;
    const highlight1 = document.getElementById('recap-highlight-1').value.trim();
    const highlight2 = document.getElementById('recap-highlight-2').value.trim();
    const highlight3 = document.getElementById('recap-highlight-3').value.trim();
    const selectedTrackJson = document.getElementById('recap-selected-track').value;
    const timestamp = getTimestampFromInput('datetime-input-recap');
    
    if (!reflection && !highlight1 && !highlight2 && !highlight3) {
        alert('Please add at least one reflection or highlight');
        return;
    }
    
    if (editingEntryId) {
        // Actualizar
        const entryIndex = entries.findIndex(e => e.id === editingEntryId);
        if (entryIndex !== -1) {
            entries[entryIndex] = {
                ...entries[entryIndex],
                timestamp: timestamp,
                reflection: reflection,
                rating: parseInt(rating),
                highlights: [highlight1, highlight2, highlight3].filter(h => h),
                track: selectedTrackJson ? JSON.parse(selectedTrackJson) : null,
                type: 'recap' // Asegurarse de que el tipo se mantenga
            };
        }
        alert('🌟 Recap updated!');
    } else {
        // Crear nuevo
        const recap = {
            id: Date.now(),
            timestamp: timestamp,
            type: 'recap',
            reflection: reflection,
            rating: parseInt(rating),
            highlights: [highlight1, highlight2, highlight3].filter(h => h),
            track: selectedTrackJson ? JSON.parse(selectedTrackJson) : null
        };
        
        entries.unshift(recap);
        alert('🌟 Recap saved!');
    }
    
    saveData();
    renderTimeline();
    closeRecapForm();
    editingEntryId = null; // Limpiar ID de edición
}

// Función ayudante para seleccionar BSO en Recap
function selectTrack(trackName, artistName, url, artwork) {
    const trackData = {
        name: trackName,
        artist: artistName,
        url: url,
        artwork: artwork
    };
    
    // Almacena el JSON en el input hidden
    document.getElementById('recap-selected-track').value = JSON.stringify(trackData);
    
    // Muestra la selección en la UI
    document.getElementById('recap-bso-results').innerHTML = `
        <div style="display: flex; align-items: center; gap: 12px; padding: 12px; border: 3px solid #000; background: #f0f0f0;">
            <img src="${artwork}" style="width: 60px; height: 60px; border: 2px solid #000;">
            <div style="flex: 1;">
                <div style="font-weight: bold;">${trackName}</div>
                <div style="font-size: 12px; color: #666;">${artistName}</div>
            </div>
            <a href="${url}" target="_blank" style="text-decoration: none; font-size: 20px;">🔗</a>
        </div>
    `;
}

// --- Función de Borrado ---

function deleteCurrentEntry() {
    if (!editingEntryId) return;
    
    if (confirm('Delete this entry?')) {
        entries = entries.filter(e => e.id !== editingEntryId);
        
        if (currentUser && !isOfflineMode) {
            deleteEntryFromFirebase(editingEntryId);
        }
        
        saveData();
        renderTimeline();
        
        // Cerrar todas las ventanas de formulario
        document.getElementById('form-window').classList.add('hidden');
        document.getElementById('timer-window').classList.add('hidden');
        document.getElementById('track-window').classList.add('hidden');
        document.getElementById('spent-window').classList.add('hidden');
        document.getElementById('recap-form').classList.add('hidden');
        
        editingEntryId = null;
    }
}

