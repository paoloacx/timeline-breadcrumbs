// ===== UI HANDLER FUNCTIONS =====

// Toggle forms
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
        window.clearForm(); // global function in app.js
        window.renderMoodSelector(); // global function in ui-renderer.js
        window.setCurrentDateTime('datetime-input'); // global function in utils.js
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
        window.resetTimerSelections(); // global function in app.js
        window.setCurrentDateTime('datetime-input-time'); // global function in utils.js
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
        window.renderTrackSelector(); // global function in ui-renderer.js
        window.setCurrentDateTime('datetime-input-track'); // global function in utils.js
        window.selectedTrackItem = null; // global variable from app.js
        
        // CAMBIO: Arregla el bug del "Cancel"
        window.editingEntryId = null; 

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
        window.setCurrentDateTime('datetime-input-spent'); // global function in utils.js
        
        // CAMBIO: Arregla el bug del "Cancel"
        window.editingEntryId = null; 

        document.getElementById('delete-spent-btn').classList.add('hidden');
        spent.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

window.cancelEdit = function() {
    window.clearForm(); // global function in app.js
    window.toggleForm();
}

// Mood selection
window.selectMood = function(index) {
    window.selectedMood = index; // global variable from app.js
    window.renderMoodSelector(); // global function in ui-renderer.js
}

// Time event selections
window.selectDuration = function(minutes) {
    window.selectedDuration = minutes; // global variable from app.js
    const options = document.querySelectorAll('.duration-option');
    options.forEach(el => {
        el.classList.remove('selected');
        if (parseInt(el.dataset.duration) === minutes) {
            el.classList.add('selected');
        }
    });
    window.checkTimerReady(); // global function in app.js
}

window.selectActivity = function(activity) {
    window.selectedActivity = activity; // global variable from app.js
    const options = document.querySelectorAll('#activity-selector .activity-option');
    options.forEach(el => {
        el.classList.remove('selected');
        if (el.dataset.activity === activity) {
            el.classList.add('selected');
        }
    });
    window.checkTimerReady(); // global function in app.js
}

// Track event selection
window.selectTrackItem = function(item) {
    window.selectedTrackItem = item; // global variable from app.js
    document.querySelectorAll('#track-selector .activity-option').forEach(el => {
        el.classList.remove('selected');
        if (el.dataset.item === item) {
            el.classList.add('selected');
        }
    });
    document.getElementById('save-track-btn').disabled = false;
}

// Preview modal functions
window.previewEntry = function(id) {
    const entry = window.entries.find(e => e.id === id); // global variable from app.js
    if (!entry) return;

    const modal = document.getElementById('preview-modal');
    const body = document.getElementById('preview-body');
    
    let html = `
        <div style="margin-bottom: 16px;">
            <strong>Time:</strong> ${window.formatDate(entry.timestamp)} at ${window.formatTime(entry.timestamp)}
        </div>
        
        ${entry.mood ? `
            <div style="margin-bottom: 16px;">
                <strong>Mood:</strong> <span style="font-size: 24px;">${entry.mood.emoji}</span> ${entry.mood.label}
            </div>
        ` : ''}
        
        <div style="margin-bottom: 16px;">
            <strong>Note:</strong>
            <div style="margin-top: 8px; line-height: 1.6; white-space: pre-wrap;">${entry.note || ''}</div>
        </div>
        
        ${entry.location ? `
            <div style="margin-bottom: 16px;">
                <strong>Location:</strong> ${entry.location}
            </div>
        ` : ''}
        
        ${entry.weather ? `
            <div style="margin-bottom: 16px;">
                <strong>Weather:</strong> ${entry.weather}
            </div>
        ` : ''}
        
        ${entry.coords ? `
            <div style="margin-bottom: 16px;">
                <strong>Map:</strong>
                <div class="preview-map-full" id="preview-map-modal"></div>
            </div>
        ` : ''}
        
        ${entry.audio ? `
            <div style="margin-bottom: 16px;">
                <strong>Audio:</strong>
                <audio controls style="width: 100%; margin-top: 8px;">
                    <source src="${entry.audio}">
                </audio>
            </div>
        ` : ''}
        
        ${entry.images && entry.images.length > 0 ? `
            <div style="margin-bottom: 16px;">
                <strong>Images:</strong>
                <div class="preview-images-full">
                    ${entry.images.map((img, idx) => `
                        <img src="${img}" class="preview-image-full" onclick="event.stopPropagation(); showImageInModal('${entry.id}', ${idx});">
                    `).join('')}
                </div>
            </div>
        ` : ''}
        
        ${entry.isTimedActivity ? `
            <div style="margin-bottom: 16px;">
                <strong>Activity:</strong> ${entry.activity} (${entry.duration} minutes)
                ${entry.optionalNote ? `<div style="margin-top: 8px; line-height: 1.6; white-space: pre-wrap; font-style: italic;">${entry.optionalNote}</div>` : ''}
            </div>
        ` : ''}
        
        ${entry.isQuickTrack && entry.optionalNote ? `
            <div style="margin-bottom: 16px;">
                <strong>Optional Note:</strong>
                <div style="margin-top: 8px; line-height: 1.6; white-space: pre-wrap; font-style: italic;">${entry.optionalNote}</div>
            </div>
        ` : ''}
        
        ${entry.isSpent ? `
            <div style="margin-bottom: 16px;">
                <strong>Amount Spent:</strong> €${entry.spentAmount.toFixed(2)}
            </div>
        ` : ''}
    `;
    
    body.innerHTML = html;
    modal.classList.add('show');
    
    if (entry.coords) {
        setTimeout(() => {
            const mapContainer = document.getElementById('preview-map-modal');
            if (mapContainer) {
                try {
                    const map = L.map('preview-map-modal').setView([entry.coords.lat, entry.coords.lon], 13);
                    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                        attribution: '© OpenStreetMap'
                    }).addTo(map);
                    L.marker([entry.coords.lat, entry.coords.lon]).addTo(map);
                    
                    setTimeout(() => map.invalidateSize(), 100);
                } catch(e) {
                    console.error("Error initializing preview map:", e);
                    mapContainer.innerHTML = "Map failed to load.";
                }
            }
        }, 100);
    }
}

window.closePreview = function(event) {
    if (event && (event.target.id !== 'preview-modal' && !event.target.closest('.mac-title-bar button'))) return;
    const modal = document.getElementById('preview-modal');
    modal.classList.remove('show');
    document.getElementById('preview-body').innerHTML = '';
}

window.showImageInModal = function(entryId, imageIndex) {
    const entry = window.entries.find(e => e.id == entryId); // global variable from app.js
    if (!entry || !entry.images || !entry.images[imageIndex]) {
        console.error('Image not found:', entryId, imageIndex);
        return;
    }
    
    const modal = document.getElementById('preview-modal');
    const body = document.getElementById('preview-body');
    
    body.innerHTML = `
        <div style="text-align: center; padding: 20px;">
            <img src="${entry.images[imageIndex]}" style="max-width: 100%; max-height: 80vh; border: 2px solid #000;">
        </div>
    `;
    
    modal.classList.add('show');
}

// Timeline interactions
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

// ===== RECAP FUNCTIONS (UI) =====

window.showRecapForm = function() {
    // Hide other forms
    document.getElementById('form-window').classList.add('hidden');
    document.getElementById('timer-window').classList.add('hidden');
    document.getElementById('track-window').classList.add('hidden');
    document.getElementById('spent-window').classList.add('hidden');
    
    const recapForm = document.getElementById('recap-form');
    recapForm.classList.remove('hidden');
    
    // Set current date
    window.setCurrentDateTime('datetime-input-recap'); // global util
    
    // Clear form only if not editing
    if (!window.editingEntryId) { // global var from app.js
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

    // Slider listener
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
    window.editingEntryId = null; // global var from app.js
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

// ===== FAB MENU =====

let fabMenuOpen = false;

window.toggleFabMenu = function() {
    const fabActions = document.querySelectorAll('.fab-action-wrapper');
    const fabIcon = document.getElementById('fab-icon');
    
    fabMenuOpen = !fabMenuOpen;
    
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
            }, (fabActions.length - index - 1) * 30); // Reverse order on close
        });
    }
}

// Close FAB menu when clicking an action
function closeFabMenu() {
    if (fabMenuOpen) {
        window.toggleFabMenu();
    }
}

// Wrappers for FAB actions
window.handleFabCrumb = function() {
    closeFabMenu();
    window.toggleForm(); // Llama a la función real
}
window.handleFabTime = function() {
    closeFabMenu();
    window.toggleTimer(); // Llama a la función real
}
window.handleFabTrack = function() {
    closeFabMenu();
    window.toggleTrack(); // Llama a la función real
}
window.handleFabSpent = function() {
    closeFabMenu();
    window.toggleSpent(); // Llama a la función real
}
window.handleFabRecap = function() {
    closeFabMenu();
    window.showRecapForm(); // Llama a la función real
}
