// =================================================================
// UI HANDLERS (ui-handlers.js)
// =================================================================
// Contiene funciones que manejan las interacciones del usuario (clics, toggles, selecciones).

// --- Form Toggles ---

window.toggleForm = function() {
    const form = document.getElementById('form-window');
    const timer = document.getElementById('timer-window');
    const track = document.getElementById('track-window');
    const spent = document.getElementById('spent-window');
    const recap = document.getElementById('recap-form');
    timer.classList.add('hidden');
    track.classList.add('hidden');
    spent.classList.add('hidden');
    recap.classList.add('hidden');
    
    form.classList.toggle('hidden');
    if (!form.classList.contains('hidden')) {
        clearForm();
        window.renderMoodSelector(); // De ui-renderer.js
        setCurrentDateTime('datetime-input'); // De utils.js
        form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

window.toggleTimer = function() {
    const timer = document.getElementById('timer-window');
    const form = document.getElementById('form-window');
    const track = document.getElementById('track-window');
    const spent = document.getElementById('spent-window');
    const recap = document.getElementById('recap-form');
    form.classList.add('hidden');
    track.classList.add('hidden');
    spent.classList.add('hidden');
    recap.classList.add('hidden');

    timer.classList.toggle('hidden');
    if (!timer.classList.contains('hidden')) {
        resetTimerSelections();
        setCurrentDateTime('datetime-input-time'); // De utils.js
        timer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

window.toggleTrack = function() {
    const track = document.getElementById('track-window');
    const form = document.getElementById('form-window');
    const timer = document.getElementById('timer-window');
    const spent = document.getElementById('spent-window');
    const recap = document.getElementById('recap-form');
    form.classList.add('hidden');
    timer.classList.add('hidden');
    spent.classList.add('hidden');
    recap.classList.add('hidden');

    track.classList.toggle('hidden');
    if (!track.classList.contains('hidden')) {
        window.renderTrackSelector(); // De ui-renderer.js
        setCurrentDateTime('datetime-input-track'); // De utils.js
        selectedTrackItem = null; // De state-manager.js
        document.getElementById('save-track-btn').disabled = true;
        document.getElementById('delete-track-btn').classList.add('hidden');
        document.getElementById('track-optional-note').value = '';
        track.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

window.toggleSpent = function() {
    const spent = document.getElementById('spent-window');
    const form = document.getElementById('form-window');
    const timer = document.getElementById('timer-window');
    const track = document.getElementById('track-window');
    const recap = document.getElementById('recap-form');
    form.classList.add('hidden');
    timer.classList.add('hidden');
    track.classList.add('hidden');
    recap.classList.add('hidden');

    spent.classList.toggle('hidden');
    if (!spent.classList.contains('hidden')) {
        document.getElementById('spent-description').value = '';
        document.getElementById('spent-amount').value = '';
        setCurrentDateTime('datetime-input-spent'); // De utils.js
        document.getElementById('delete-spent-btn').classList.add('hidden');
        spent.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

window.showRecapForm = function() {
    // Ocultar otros formularios
    document.getElementById('form-window').classList.add('hidden');
    document.getElementById('timer-window').classList.add('hidden');
    document.getElementById('track-window').classList.add('hidden');
    document.getElementById('spent-window').classList.add('hidden');
    
    const recapForm = document.getElementById('recap-form');
    recapForm.classList.remove('hidden');
    
    setCurrentDateTime('datetime-input-recap'); // De utils.js
    
    // editingEntryId de state-manager.js
    if (!editingEntryId) {
        document.getElementById('recap-reflection').value = '';
        document.getElementById('recap-rating').value = '5';
        document.getElementById('recap-rating-value').textContent = '5';
        document.getElementById('recap-highlight-1').value = '';
        document.getElementById('recap-highlight-2').value = '';
        document.getElementById('recap-highlight-3').value = '';
        document.getElementById('recap-bso').value = '';
        document.getElementById('recap-bso-results').innerHTML = '';
        document.getElementById('recap-selected-track').value = '';
    }

    const slider = document.getElementById('recap-rating');
    const valueDisplay = document.getElementById('recap-rating-value');
    
    if (slider) {
        slider.oninput = function() {
            if (valueDisplay) valueDisplay.textContent = this.value;
        };
    }
    
    recapForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

window.closeRecapForm = function() {
    document.getElementById('recap-form').classList.add('hidden');
    editingEntryId = null; // De state-manager.js
}

// --- Form Helpers ---

function clearForm() {
    document.getElementById('note-input').value = '';
    document.getElementById('location-input').value = '';
    document.getElementById('weather-input').value = '';
    // Variables de state-manager.js
    currentImages = [];
    currentAudio = null;
    currentCoords = null;
    editingEntryId = null;
    selectedMood = null;
    document.getElementById('image-previews').innerHTML = '';
    document.getElementById('audio-preview').innerHTML = '';
    document.getElementById('delete-btn').classList.add('hidden');
    document.getElementById('save-btn').textContent = '💾 Save';
    document.getElementById('mood-config').classList.add('hidden');
    const mapContainer = document.getElementById('form-map');
    if (mapContainer) {
        mapContainer.style.display = 'none';
        mapContainer.innerHTML = '';
    }
}

window.cancelEdit = function() {
    clearForm();
    window.toggleForm();
}

function resetTimerSelections() {
    // Variables de state-manager.js
    selectedDuration = null;
    selectedActivity = null;
    editingEntryId = null;
    document.querySelectorAll('.duration-option').forEach(el => el.classList.remove('selected'));
    document.querySelectorAll('#activity-selector .activity-option').forEach(el => el.classList.remove('selected'));
    document.getElementById('create-time-btn').disabled = true;
    document.getElementById('create-time-btn').textContent = 'Create Event';
    document.getElementById('delete-time-btn').classList.add('hidden');
    document.getElementById('time-optional-note').value = '';
}

// --- GPS Handler ---

window.getGPS = function() {
    const btn = document.getElementById('gps-btn');
    const locationInput = document.getElementById('location-input');
    btn.textContent = '⏳ Searching...';
    btn.disabled = true;

    if (!navigator.geolocation) {
        alert('Geolocation not available');
        btn.textContent = '🌍 Use GPS';
        btn.disabled = false;
        return;
    }

    navigator.geolocation.getCurrentPosition(
        (position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            currentCoords = { lat, lon }; // De state-manager.js
            
            locationInput.placeholder = 'Getting location...';
            
            showMiniMap(lat, lon, 'form-map'); // De ui-renderer.js
            getWeather(lat, lon); // De api-services.js
            
            btn.textContent = '🌍 GPS OK';
            btn.disabled = false;
        },
        (error) => {
            console.error('GPS Error:', error);
            btn.textContent = '🌍 Use GPS';
            btn.disabled = false;
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        }
    );
}

// --- Option Selectors ---

window.selectMood = function(index) {
    selectedMood = index; // De state-manager.js
    window.renderMoodSelector(); // De ui-renderer.js
}

window.selectDuration = function(minutes) {
    selectedDuration = minutes; // De state-manager.js
    const options = document.querySelectorAll('.duration-option');
    options.forEach(el => {
        el.classList.remove('selected');
        if (parseInt(el.dataset.duration) === minutes) {
            el.classList.add('selected');
        }
    });
    checkTimerReady();
}

window.selectActivity = function(activity) {
    selectedActivity = activity; // De state-manager.js
    const options = document.querySelectorAll('#activity-selector .activity-option');
    options.forEach(el => {
        el.classList.remove('selected');
        if (el.dataset.activity === activity) {
            el.classList.add('selected');
        }
    });
    checkTimerReady();
}

function checkTimerReady() {
    const createBtn = document.getElementById('create-time-btn');
    // Variables de state-manager.js
    if (selectedDuration && selectedActivity) {
        createBtn.disabled = false;
    } else {
        createBtn.disabled = true;
    }
}

window.selectTrackItem = function(item) {
    selectedTrackItem = item; // De state-manager.js
    document.querySelectorAll('#track-selector .activity-option').forEach(el => {
        el.classList.remove('selected');
        if (el.dataset.item === item) {
            el.classList.add('selected');
        }
    });
    document.getElementById('save-track-btn').disabled = false;
}

window.selectTrack = function(trackName, artistName, url, artwork) {
    const trackData = {
        name: trackName,
        artist: artistName,
        url: url,
        artwork: artwork
    };
    
    document.getElementById('recap-selected-track').value = JSON.stringify(trackData);
    document.getElementById('recap-bso-results').innerHTML = `
        <div class="bso-result" style="display: flex; align-items: center; gap: 12px; padding: 12px; border: 3px solid #000; background: #f0f0f0;">
            <img src="${artwork}" style="width: 60px; height: 60px; border: 2px solid #000;">
            <div style="flex: 1;">
                <div style="font-weight: bold;">${trackName}</div>
                <div style="font-size: 12px; color: #666;">${artistName}</div>
            </div>
            <a href="${url}" target="_blank" style="text-decoration: none; font-size: 20px;">🔗</a>
        </div>
    `;
}

// --- Modal Handlers ---

window.closePreview = function(event) {
    if (event && (event.target.id !== 'preview-modal' && !event.target.closest('.mac-title-bar button'))) return;
    const modal = document.getElementById('preview-modal');
    modal.classList.remove('show');
    document.getElementById('preview-body').innerHTML = '';
}

// --- Timeline UI Handlers ---

window.toggleReadMore = function(id) {
    const noteEl = document.getElementById(`note-${id}`);
    const btnEl = document.getElementById(`read-more-${id}`);
    
    if (noteEl.classList.contains('expanded')) {
        noteEl.classList.remove('expanded');
        btnEl.textContent = 'Read more';
    } else {
        noteEl.classList.add('expanded');
        btnEl.textContent = 'Show less';
    }
}

window.toggleDay = function(dayKey) {
    const content = document.getElementById(`day-content-${dayKey}`);
    const chevron = document.getElementById(`chevron-${dayKey}`);
    
    content.classList.toggle('expanded');
    chevron.classList.toggle('expanded');
}

window.toggleRecap = function(recapId) {
    const content = document.getElementById(`recap-content-${recapId}`);
    const chevron = document.getElementById(`chevron-recap-${recapId}`);
    
    content.classList.toggle('hidden');
    chevron.classList.toggle('expanded');
}

// --- FAB Menu ---

window.toggleFabMenu = function() {
    const fabActions = document.querySelectorAll('.fab-action-wrapper');
    const fabIcon = document.getElementById('fab-icon');
    
    fabMenuOpen = !fabMenuOpen; // De state-manager.js
    
    if (fabMenuOpen) {
        fabIcon.textContent = '×';
        fabIcon.style.transform = 'rotate(45deg)';
        
        fabActions.forEach((wrapper, index) => {
            setTimeout(() => {
                wrapper.classList.remove('hidden');
                setTimeout(() => wrapper.classList.add('show'), 10);
            }, index * 50);
        });
    } else {
        fabIcon.textContent = '+';
        fabIcon.style.transform = 'rotate(0deg)';
        
        fabActions.forEach((wrapper, index) => {
            setTimeout(() => {
                wrapper.classList.remove('show');
                setTimeout(() => wrapper.classList.add('hidden'), 300);
            }, (fabActions.length - index - 1) * 30); // Invertir orden al cerrar
        });
    }
}

function closeFabMenu() {
    if (fabMenuOpen) { // De state-manager.js
        window.toggleFabMenu();
    }
}

// Wrappers para que los toggles de formulario cierren el FAB
window.toggleCrumb = function() {
    closeFabMenu();
    window.toggleForm();
}
window.toggleTime = function() {
    closeFabMenu();
    window.toggleTimer();
}
window.toggleTrack = function() {
    closeFabMenu();
    window.toggleTrack();
}
window.toggleSpent = function() {
    closeFabMenu();
    window.toggleSpent();
}
window.showRecapFormWithFab = function() {
    closeFabMenu();
    window.showRecapForm();
}
