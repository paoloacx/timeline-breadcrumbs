// Global variables
let entries = [];
// currentImages, currentAudio, currentCoords, mediaRecorder, y audioChunks
// se manejan ahora en media-handlers.js, pero las declaramos aquí
// para que sigan siendo accesibles globalmente por ahora.
// En un futuro, las moveremos a un objeto de "estado" (state).
let currentImages = [];
let currentAudio = null;
let currentCoords = null;
let editingEntryId = null;
let selectedMood = null;
let selectedDuration = null;
let selectedActivity = null;
let selectedTrackItem = null;

let mediaRecorder = null;
let audioChunks = [];


// Refresh function
function refreshApp() {
    if (currentUser && !isOfflineMode) {
        loadDataFromFirebase();
        loadSettingsFromFirebase();
        alert('✅ Synced!');
    } else {
        location.reload();
    }
}



// Settings
let timeDurations = [15, 30, 60, 120, 180];
let timeActivities = ['Reading', 'Sports', 'Work', 'Cleaning', 'Errands'];
let trackItems = {
    meals: ['🍳 Breakfast', '🥗 Lunch', '🍽️ Dinner', '☕ Snack'],
    tasks: ['💊 Medicine', '💧 Water', '🚶 Walk', '📞 Call']
};

// Default moods
const defaultMoods = [
    { emoji: '😊', label: 'Happy' },
    { emoji: '😢', label: 'Sad' },
    { emoji: '😡', label: 'Angry' },
    { emoji: '😰', label: 'Anxious' },
    { emoji: '😴', label: 'Tired' }
];

let moods = [...defaultMoods];

// Load settings from localStorage
function loadSettings() {
    const savedDurations = localStorage.getItem('time-durations');
    const savedActivities = localStorage.getItem('time-activities');
    const savedTrackItems = localStorage.getItem('track-items');
    const savedMoods = localStorage.getItem('mood-config');
    
    if (savedDurations) timeDurations = JSON.parse(savedDurations);
    if (savedActivities) timeActivities = JSON.parse(savedActivities);
    if (savedTrackItems) trackItems = JSON.parse(savedTrackItems);
    if (savedMoods) moods = JSON.parse(savedMoods);
}

// Save settings to localStorage
function saveSettingsToStorage() {
    localStorage.setItem('time-durations', JSON.stringify(timeDurations));
    localStorage.setItem('time-activities', JSON.stringify(timeActivities));
    localStorage.setItem('track-items', JSON.stringify(trackItems));
    localStorage.setItem('mood-config', JSON.stringify(moods));
}

// Load data from localStorage
function loadData() {
    const saved = localStorage.getItem('timeline-entries');
    if (saved) {
        entries = JSON.parse(saved);
    }
    renderTimeline();
}

// Save data to localStorage
function saveData() {
    localStorage.setItem('timeline-entries', JSON.stringify(entries));
    if (!isOfflineMode && currentUser) {
        saveDataToFirebase();
    }
}


// Sync/Refresh data
function syncData() {
    // Usar la función de refresco que ya existe
    refreshApp();
}

// Toggle forms
function toggleForm() {
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
        renderMoodSelector();
        setCurrentDateTime('datetime-input');
        form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function toggleTimer() {
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
        setCurrentDateTime('datetime-input-time');
        timer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function toggleTrack() {
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
        renderTrackSelector();
        setCurrentDateTime('datetime-input-track');
        selectedTrackItem = null;
        document.getElementById('save-track-btn').disabled = true;
        document.getElementById('delete-track-btn').classList.add('hidden');
        document.getElementById('track-optional-note').value = '';
        track.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function toggleSpent() {
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
        setCurrentDateTime('datetime-input-spent');
        document.getElementById('delete-spent-btn').classList.add('hidden');
        spent.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// Set current date/time in input
function setCurrentDateTime(inputId) {
    const now = new Date();
    // Ajustar a la zona horaria local
    const offset = now.getTimezoneOffset();
    const localDate = new Date(now.getTime() - (offset * 60 * 1000));
    // Formatear a ISO string y cortar en 'T'HH:mm
    const dateTimeString = localDate.toISOString().substring(0, 16);
    
    const inputEl = document.getElementById(inputId);
    if (inputEl) {
        inputEl.value = dateTimeString;
    } else {
        console.error("Input element not found:", inputId);
    }
}

// Get timestamp from datetime input
function getTimestampFromInput(inputId) {
    const value = document.getElementById(inputId).value;
    if (!value) return new Date().toISOString();
    return new Date(value).toISOString();
}

// Clear form
function clearForm() {
    document.getElementById('note-input').value = '';
    document.getElementById('location-input').value = '';
    document.getElementById('weather-input').value = '';
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

function cancelEdit() {
    clearForm();
    toggleForm();
}

// GPS functions
function getGPS() {
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
            currentCoords = { lat, lon };
            
            locationInput.placeholder = 'Getting location...';
            
            showMiniMap(lat, lon, 'form-map');
            // Llama a la función que ahora está en api-services.js
            getWeather(lat, lon); 
            
            btn.textContent = '🌍 GPS OK';
            btn.disabled = false;
        },
        (error) => {
            console.error('GPS Error:', error);
            alert('GPS Error: ' + error.message);
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


function showMiniMap(lat, lon, containerId) {
    const mapContainer = document.getElementById(containerId);
    if (!mapContainer) return;

    mapContainer.innerHTML = ''; // Limpiar mapa anterior si existe
    mapContainer.style.display = 'block';

    try {
        const map = L.map(containerId).setView([lat, lon], 13);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap',
            maxZoom: 19
        }).addTo(map);

        L.marker([lat, lon]).addTo(map);

        // Forzar actualización de tamaño de Leaflet
        setTimeout(() => {
            map.invalidateSize();
        }, 100);
    } catch (e) {
        console.error("Error initializing Leaflet map:", e);
        mapContainer.innerHTML = "Error loading map.";
    }
}


// Mood functions
function renderMoodSelector() {
    const container = document.getElementById('mood-selector');
    container.innerHTML = moods.map((mood, index) => `
        <div class="mood-option ${selectedMood === index ? 'selected' : ''}" onclick="selectMood(${index})">
            ${mood.emoji}
            <span class="mood-label">${mood.label}</span>
        </div>
    `).join('');
}

function selectMood(index) {
    selectedMood = index;
    renderMoodSelector();
}

function toggleMoodConfig() {
    const panel = document.getElementById('mood-config');
    panel.classList.toggle('hidden');
    if (!panel.classList.contains('hidden')) {
        renderMoodConfig();
    }
}

function renderMoodConfig() {
    const container = document.getElementById('mood-config-list');
    container.innerHTML = moods.map((mood, index) => `
        <div class="config-item">
            <input type="text" value="${mood.emoji}" id="mood-emoji-${index}" maxlength="2">
            <input type="text" value="${mood.label}" id="mood-label-${index}" placeholder="Label">
        </div>
    `).join('');
}

function saveMoodConfig() {
    moods = moods.map((mood, index) => ({
        emoji: document.getElementById(`mood-emoji-${index}`).value || mood.emoji,
        label: document.getElementById(`mood-label-${index}`).value || mood.label
    }));
    
    saveSettingsToStorage(); // Guardar en localStorage
    if (currentUser && !isOfflineMode) {
        saveSettingsToFirebase(); // Guardar en Firebase
    }
    
    renderMoodSelector();
    toggleMoodConfig();
    alert('✅ Configuration saved');
}

// Time Event functions
function selectDuration(minutes) {
    selectedDuration = minutes;
    const options = document.querySelectorAll('.duration-option');
    options.forEach(el => {
        el.classList.remove('selected');
        const durationMinutes = parseInt(el.dataset.minutes || 0, 10);
        if (durationMinutes === minutes) {
            el.classList.add('selected');
        }
    });
    
    checkTimerReady();
}

function selectActivity(activity) {
    selectedActivity = activity;
    const options = document.querySelectorAll('#activity-selector .activity-option');
    options.forEach(el => {
        el.classList.remove('selected');
        if (el.textContent.trim() === activity) {
            el.classList.add('selected');
        }
    });
    
    checkTimerReady();
}

function checkTimerReady() {
    const createBtn = document.getElementById('create-time-btn');
    if (selectedDuration && selectedActivity) {
        createBtn.disabled = false;
    } else {
        createBtn.disabled = true;
    }
}

function resetTimerSelections() {
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

// Track Event functions
function renderTrackSelector() {
    const container = document.getElementById('track-selector');
    const allItems = [...trackItems.meals, ...trackItems.tasks];
    
    container.innerHTML = allItems.map((item) => `
        <div class="activity-option" onclick="selectTrackItem('${item.replace(/'/g, "\\'")}')">
            ${item}
        </div>
    `).join('');
}

function selectTrackItem(item) {
    selectedTrackItem = item;
    document.querySelectorAll('#track-selector .activity-option').forEach(el => {
        el.classList.remove('selected');
        if (el.textContent.trim() === item) {
            el.classList.add('selected');
        }
    });
    document.getElementById('save-track-btn').disabled = false;
}


// Preview functions
function previewEntry(id) {
    const entry = entries.find(e => e.id === id);
    if (!entry) return;

    const modal = document.getElementById('preview-modal');
    const body = document.getElementById('preview-body');
    
    let html = `
        <div style="margin-bottom: 16px;">
            <strong>Time:</strong> ${formatDate(entry.timestamp)} at ${formatTime(entry.timestamp)}
        </div>
        
        ${entry.mood ? `
            <div style="margin-bottom: 16px;">
                <strong>Mood:</strong> <span style="font-size: 24px;">${entry.mood.emoji}</span> ${entry.mood.label}
            </div>
        ` : ''}
        
        <div style="margin-bottom: 16px;">
            <strong>Note:</strong>
            <div style="margin-top: 8px; line-height: 1.6;">${entry.note.replace(/\n/g, '<br>')}</div>
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
                    ${entry.images.map((img, index) => `
                        <img src="${img}" class="preview-image-full" onclick="event.stopPropagation(); showImageInModal('${entry.id}', ${index});">
                    `).join('')}
                </div>
            </div>
        ` : ''}
        
        ${entry.isTimedActivity ? `
            <div style="margin-bottom: 16px;">
                <strong>Activity:</strong> ${entry.activity} (${entry.duration} minutes)
                ${entry.optionalNote ? `<div style="margin-top: 8px; line-height: 1.6; font-style: italic;">${entry.optionalNote.replace(/\n/g, '<br>')}</div>` : ''}
            </div>
        ` : ''}

        ${entry.isQuickTrack ? `
            <div style="margin-bottom: 16px;">
                ${entry.optionalNote ? `<div style="margin-top: 8px; line-height: 1.6; font-style: italic;">${entry.optionalNote.replace(/\n/g, '<br>')}</div>` : ''}
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
            if (mapContainer && !mapContainer.classList.contains('leaflet-container')) {
                try {
                    const map = L.map('preview-map-modal').setView([entry.coords.lat, entry.coords.lon], 13);
                    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                        attribution: '© OpenStreetMap'
                    }).addTo(map);
                    L.marker([entry.coords.lat, entry.coords.lon]).addTo(map);
                    
                    setTimeout(() => map.invalidateSize(), 100);
                } catch(e) {
                    console.error("Error initializing preview map:", e);
                    mapContainer.innerHTML = "Error loading map.";
                }
            }
        }, 100);
    }
}

function closePreview(event) {
    if (event && event.target.id !== 'preview-modal' && !event.target.closest('.preview-content')) return;
    if (event && event.target.id === 'preview-modal') { // Solo cerrar si se hace clic en el fondo
        const modal = document.getElementById('preview-modal');
        modal.classList.remove('show');
        document.getElementById('preview-body').innerHTML = '';
    }
}

// Función para cerrar el modal desde un botón (si se añade)
function forceClosePreview() {
    const modal = document.getElementById('preview-modal');
    modal.classList.remove('show');
    document.getElementById('preview-body').innerHTML = '';
}


// Settings functions
function openSettings() {
    const modal = document.getElementById('settings-modal');
    modal.classList.add('show');
    renderSettingsConfig();
}

// Show image preview
function showImageInModal(entryId, imageIndex) {
    const entry = entries.find(e => e.id == entryId);
    if (!entry || !entry.images || !entry.images[imageIndex]) {
        console.error('Image not found:', entryId, imageIndex);
        return;
    }
    
    const modal = document.getElementById('preview-modal');
    const body = document.getElementById('preview-body');
    
    // Re-usamos el modal de preview para mostrar la imagen en grande
    body.innerHTML = `
        <div style="text-align: center; padding: 20px;">
            <img src="${entry.images[imageIndex]}" style="max-width: 100%; max-height: 80vh; border: 2px solid #000;">
        </div>
    `;
    
    modal.classList.add('show');
}


function closeSettings(event) {
    if (event && event.target.id !== 'settings-modal' && !event.target.closest('.preview-content')) return;
    if (event && event.target.id === 'settings-modal') {
        const modal = document.getElementById('settings-modal');
        modal.classList.remove('show');
    }
}

// Función para cerrar el modal desde un botón
function forceCloseSettings() {
     const modal = document.getElementById('settings-modal');
    modal.classList.remove('show');
}

function renderSettingsConfig() {
    const durationsContainer = document.getElementById('time-durations-config');
    durationsContainer.innerHTML = timeDurations.map((duration, index) => `
        <div class="config-item">
            <input type="number" value="${duration}" id="duration-${index}" style="flex: 0 0 100px;">
            <span>minutes</span>
            <button class="mac-button" onclick="removeDuration(${index})" style="padding: 4px 8px; margin-left: auto;">✕</button>
        </div>
    `).join('') + `
        <button class="mac-button" onclick="addDuration()" style="margin-top: 8px;">➕ Add Duration</button>
    `;

    const activitiesContainer = document.getElementById('time-activities-config');
    activitiesContainer.innerHTML = timeActivities.map((activity, index) => `
        <div class="config-item">
            <input type="text" value="${activity}" id="activity-${index}">
            <button class="mac-button" onclick="removeActivity(${index})" style="padding: 4px 8px;">✕</button>
        </div>
    `).join('') + `
        <button class="mac-button" onclick="addActivity()" style="margin-top: 8px;">➕ Add Activity</button>
    `;

    const trackContainer = document.getElementById('track-items-config');
    trackContainer.innerHTML = `
        <div style="margin-bottom: 16px;">
            <strong>Meals:</strong>
            ${trackItems.meals.map((item, index) => `
                <div class="config-item">
                    <input type="text" value="${item}" id="meal-${index}">
                    <button class="mac-button" onclick="removeMeal(${index})" style="padding: 4px 8px;">✕</button>
                </div>
            `).join('')}
            <button class="mac-button" onclick="addMeal()" style="margin-top: 8px;">➕ Add Meal</button>
        </div>
        <div>
            <strong>Tasks:</strong>
            ${trackItems.tasks.map((item, index) => `
                <div class="config-item">
                    <input type="text" value="${item}" id="task-${index}">
                    <button class="mac-button" onclick="removeTask(${index})" style="padding: 4px 8px;">✕</button>
                </div>
            `).join('')}
            <button class="mac-button" onclick="addTask()" style="margin-top: 8px;">➕ Add Task</button>
        </div>
    `;
}

function addDuration() {
    timeDurations.push(60);
    renderSettingsConfig();
}

function removeDuration(index) {
    timeDurations.splice(index, 1);
    renderSettingsConfig();
}

function addActivity() {
    timeActivities.push('New Activity');
    renderSettingsConfig();
}

function removeActivity(index) {
    timeActivities.splice(index, 1);
    renderSettingsConfig();
}

function addMeal() {
    trackItems.meals.push('🍴 New Meal');
    renderSettingsConfig();
}

function removeMeal(index) {
    trackItems.meals.splice(index, 1);
    renderSettingsConfig();
}

function addTask() {
    trackItems.tasks.push('✓ New Task');
    renderSettingsConfig();
}

function removeTask(index) {
    trackItems.tasks.splice(index, 1);
    renderSettingsConfig();
}

function saveSettings() {
    timeDurations = timeDurations.map((_, index) => {
        const val = document.getElementById(`duration-${index}`);
        return val ? parseInt(val.value) || 60 : 60;
    }).filter(d => d > 0); // Filtrar valores no válidos

    timeActivities = timeActivities.map((_, index) => {
        const val = document.getElementById(`activity-${index}`);
        return val ? val.value : 'Activity';
    }).filter(a => a.trim() !== ''); // Filtrar valores vacíos

    trackItems.meals = trackItems.meals.map((_, index) => {
        const val = document.getElementById(`meal-${index}`);
        return val ? val.value : 'Meal';
    }).filter(m => m.trim() !== ''); // Filtrar valores vacíos

    trackItems.tasks = trackItems.tasks.map((_, index) => {
        const val = document.getElementById(`task-${index}`);
        return val ? val.value : 'Task';
    }).filter(t => t.trim() !== ''); // Filtrar valores vacíos

    saveSettingsToStorage();
    
    if (currentUser && !isOfflineMode) {
        saveSettingsToFirebase();
    }
    
    updateTimerOptions();
    updateTrackOptions();
    forceCloseSettings(); // Usar la función de cierre forzado
    alert('✅ Settings saved!');
}

function updateTimerOptions() {
    const container = document.getElementById('duration-selector');
    if (!container) return;
    
    container.innerHTML = timeDurations.map(duration => `
        <div class="duration-option" data-minutes="${duration}" onclick="selectDuration(${duration})">
            ${duration < 60 ? duration + ' min' : (duration / 60) + ' hour' + (duration > 60 ? 's' : '')}
        </div>
    `).join('');

    const actContainer = document.getElementById('activity-selector');
    if (!actContainer) return;
    
    actContainer.innerHTML = timeActivities.map(activity => `
        <div class="activity-option" onclick="selectActivity('${activity.replace(/'/g, "\\'")}')">
            ${activity}
        </div>
    `).join('');
}

function updateTrackOptions() {
    renderTrackSelector();
}


// Export functions
function exportCSV() {
    openExportModal('csv');
}

function exportICS() {
    openExportModal('ical');
}

function openExportModal(format) {
    const modal = document.getElementById('export-modal');
    if (!modal) {
        createExportModal(); // Crear el modal si no existe
    }
    
    // Configurar el modal según el formato
    document.getElementById('export-format-type').textContent = format === 'csv' ? 'CSV' : 'iCal';
    document.getElementById('export-modal').classList.add('show');
    
    // Actualizar opciones de fecha por defecto
    const today = new Date();
    const monthInput = document.getElementById('export-month');
    const dayInput = document.getElementById('export-day');
    
    const localDate = new Date(today.getTime() - (today.getTimezoneOffset() * 60 * 1000));
    const isoDate = localDate.toISOString();

    monthInput.value = isoDate.substring(0, 7); // YYYY-MM
    dayInput.value = isoDate.substring(0, 10); // YYYY-MM-DD
}

function createExportModal() {
    const modalHTML = `
        <div id="export-modal" class="preview-modal" onclick="closeExportModal(event)">
            <div class="preview-content" onclick="event.stopPropagation()">
                <div class="mac-title-bar">
                    <span>📤 Export <span id="export-format-type">CSV</span></span>
                    <button onclick="forceCloseExportModal()" style="background: #fff; border: 2px solid #000; padding: 2px 8px; cursor: pointer;">✕</button>
                </div>
                <div class="mac-content">
                    <h3 style="margin-bottom: 16px;">Select Export Range</h3>
                    
                    <div style="margin-bottom: 20px;">
                        <label class="mac-label" style="display: flex; align-items: center; gap: 8px;">
                            <input type="radio" name="export-range" value="all" checked onchange="updateExportOptions()"> 
                            Export All Entries
                        </label>
                    </div>
                    
                    <div style="margin-bottom: 20px;">
                        <label class="mac-label" style="display: flex; align-items: center; gap: 8px;">
                            <input type="radio" name="export-range" value="month" onchange="updateExportOptions()"> 
                            Export Specific Month
                        </label>
                        <div id="month-selector" style="margin-left: 28px; margin-top: 8px; display: none;">
                            <input type="month" class="mac-input" id="export-month" style="max-width: 200px;">
                        </div>
                    </div>
                    
                    <div style="margin-bottom: 20px;">
                        <label class="mac-label" style="display: flex; align-items: center; gap: 8px;">
                            <input type="radio" name="export-range" value="day" onchange="updateExportOptions()"> 
                            Export Specific Day
                        </label>
                        <div id="day-selector" style="margin-left: 28px; margin-top: 8px; display: none;">
                            <input type="date" class="mac-input" id="export-day" style="max-width: 200px;">
                        </div>
                    </div>
                    
                    <hr style="margin: 20px 0; border: none; border-top: 2px solid #000;">
                    
                    <div id="ical-options" style="display: none;">
                        <h3 style="margin-bottom: 16px;">iCal Options</h3>
                        
                        <div style="margin-bottom: 20px;">
                            <label class="mac-label" style="display: flex; align-items: center; gap: 8px;">
                                <input type="radio" name="ical-grouping" value="individual" checked> 
                                Each event as separate calendar entry
                            </label>
                        </div>
                        
                        <div style="margin-bottom: 20px;">
                            <label class="mac-label" style="display: flex; align-items: center; gap: 8px;">
                                <input type="radio" name="ical-grouping" value="daily"> 
                                Group all events per day as one calendar entry
                            </label>
                        </div>
                    </div>
                    
                    <button class="mac-button mac-button-primary" onclick="performExport()" style="width: 100%; margin-top: 24px;">
                        📥 Export
                    </button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function updateExportOptions() {
    const range = document.querySelector('input[name="export-range"]:checked').value;
    const format = document.getElementById('export-format-type').textContent.toLowerCase();
    
    document.getElementById('month-selector').style.display = range === 'month' ? 'block' : 'none';
    document.getElementById('day-selector').style.display = range === 'day' ? 'block' : 'none';
    document.getElementById('ical-options').style.display = format === 'ical' ? 'block' : 'none';
}

function closeExportModal(event) {
    if (event && event.target.id !== 'export-modal') return;
    const modal = document.getElementById('export-modal');
    if (modal) {
        modal.classList.remove('show');
    }
}

function forceCloseExportModal() {
    const modal = document.getElementById('export-modal');
    if (modal) {
        modal.classList.remove('show');
    }
}

function performExport() {
    const format = document.getElementById('export-format-type').textContent.toLowerCase();
    const range = document.querySelector('input[name="export-range"]:checked').value;
    const icalGrouping = document.querySelector('input[name="ical-grouping"]:checked').value;
    
    // Filtrar entradas según el rango seleccionado
    let filteredEntries = [...entries];
    let filenameSuffix = 'all';
    
    if (range === 'month') {
        const monthValue = document.getElementById('export-month').value;
        const [year, month] = monthValue.split('-');
        filteredEntries = entries.filter(e => {
            const date = new Date(e.timestamp);
            return date.getFullYear() === parseInt(year) && 
                   date.getMonth() + 1 === parseInt(month);
        });
        filenameSuffix = `${year}-${month}`;
    } else if (range === 'day') {
        const dayValue = document.getElementById('export-day').value;
        filteredEntries = entries.filter(e => {
            const date = new Date(e.timestamp);
            const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
            return dateStr === dayValue;
        });
        filenameSuffix = dayValue;
    }
    
    if (filteredEntries.length === 0) {
        alert('No entries found for the selected period.');
        return;
    }
    
    // Realizar la exportación
    if (format === 'csv') {
        exportCSVData(filteredEntries, filenameSuffix);
    } else {
        exportICSData(filteredEntries, filenameSuffix, icalGrouping);
    }
    
    forceCloseExportModal();
}

function exportCSVData(data, suffix) {
    const headers = ['Date and Time', 'Note', 'Type', 'Activity', 'Duration (min)', 'Location', 'Weather', 'Mood', 'Spent', 'Images', 'Audio', 'Optional Note', 'Highlights', 'Rating', 'BSO'];
    const rows = data.map(e => {
        let type = 'Crumb';
        if (e.isTimedActivity) type = 'Time';
        if (e.isQuickTrack) type = 'Track';
        if (e.isSpent) type = 'Spent';
        if (e.type === 'recap') type = 'Recap';

        return [
            new Date(e.timestamp).toLocaleString(),
            e.note || '',
            type,
            e.activity || '',
            e.duration || '',
            e.location || '',
            e.weather || '',
            e.mood ? `${e.mood.emoji} ${e.mood.label}` : '',
            e.spentAmount ? `€${e.spentAmount.toFixed(2)}` : '',
            e.images ? e.images.length : 0,
            e.audio ? 'Yes' : 'No',
            e.optionalNote || '',
            e.highlights ? e.highlights.join('; ') : '',
            e.rating || '',
            e.track ? `${e.track.name} - ${e.track.artist}` : ''
        ];
    });
    
    const csv = [headers, ...rows].map(row => 
        row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `breadcrumbs-${suffix}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

function exportICSData(data, suffix, grouping) {
    let icsEvents = '';
    
    // Helper para escapar texto de iCal
    const escapeICS = (str = '') => {
        return str.replace(/\\/g, '\\\\')
                  .replace(/;/g, '\\;')
                  .replace(/,/g, '\\,')
                  .replace(/\n/g, '\\n');
    }

    if (grouping === 'daily') {
        // Agrupar por día
        const groupedByDay = {};
        data.forEach(e => {
            const date = new Date(e.timestamp);
            const dayKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
            if (!groupedByDay[dayKey]) {
                groupedByDay[dayKey] = [];
            }
            groupedByDay[dayKey].push(e);
        });
        
        // Crear un evento por día
        icsEvents = Object.keys(groupedByDay).map(dayKey => {
            const dayEntries = groupedByDay[dayKey];
            const firstEntry = dayEntries[0];
            const date = new Date(firstEntry.timestamp);
            const dateStr = date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
            
            // Crear descripción con todos los eventos del día
            const description = dayEntries.map(e => {
                const time = new Date(e.timestamp).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
                let text = `${time}: `;
                
                if (e.type === 'recap') {
                    text += `🌟 DAY RECAP (Rating: ${e.rating}/10)`;
                    if(e.reflection) text += `\\nReflexión: ${escapeICS(e.reflection)}`;
                    if(e.highlights) text += `\\nHighlights: ${escapeICS(e.highlights.join(', '))}`;
                } else if (e.isTimedActivity) {
                    text += `⏱️ ${escapeICS(e.activity)} (${e.duration} min)`;
                } else if (e.isQuickTrack) {
                    text += `📊 ${escapeICS(e.note)}`;
                } else if (e.isSpent) {
                    text += `💰 €${e.spentAmount.toFixed(2)} - ${escapeICS(e.note)}`;
                } else {
                    text += `📝 ${escapeICS(e.note)}`;
                }
                return text;
            }).join('\\n\\n');
            
            return `BEGIN:VEVENT
UID:${dayKey}@breadcrumbs
DTSTAMP:${dateStr}
DTSTART;VALUE=DATE:${dayKey.replace(/-/g, '')}
SUMMARY:Breadcrumbs - ${dayEntries.length} entries on ${dayKey}
DESCRIPTION:${description}
END:VEVENT`;
        }).join('\n');

    } else {
        // Evento individual por cada entrada
        icsEvents = data.map(e => {
            const date = new Date(e.timestamp);
            const dateStr = date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
            
            let endDate = new Date(date);
            if (e.duration) {
                endDate.setMinutes(endDate.getMinutes() + e.duration);
            } else if (e.type === 'recap') {
                endDate.setMinutes(endDate.getMinutes() + 60); // 1 hora para recaps
            } else {
                endDate.setMinutes(endDate.getMinutes() + 30); // 30 min por defecto
            }
            const endDateStr = endDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
            
            let summary = '';
            let description = '';

            if (e.type === 'recap') {
                summary = `🌟 Day Recap (Rating: ${e.rating}/10)`;
                if(e.reflection) description += `Reflexión: ${escapeICS(e.reflection)}\\n`;
                if(e.highlights) description += `Highlights: ${escapeICS(e.highlights.join(', '))}\\n`;
                if(e.track) description += `BSO: ${escapeICS(e.track.name)} - ${escapeICS(e.track.artist)}\\n`;
            } else if (e.isTimedActivity) {
                summary = `⏱️ ${escapeICS(e.activity)} (${e.duration} min)`;
                description = escapeICS(e.optionalNote || e.note);
            } else if (e.isQuickTrack) {
                summary = `📊 ${escapeICS(e.note)}`;
                description = escapeICS(e.optionalNote || '');
            } else if (e.isSpent) {
                summary = `💰 €${e.spentAmount.toFixed(2)} - ${escapeICS(e.note)}`;
            } else {
                summary = `📝 ${escapeICS(e.note?.substring(0, 50))}`;
                description = escapeICS(e.note || '');
            }
            
            if(e.location) description += `\\n📍 Location: ${escapeICS(e.location)}`;
            if(e.weather) description += `\\n☁️ Weather: ${escapeICS(e.weather)}`;

            return `BEGIN:VEVENT
UID:${e.id}@breadcrumbs
DTSTAMP:${dateStr}
DTSTART:${dateStr}
DTEND:${endDateStr}
SUMMARY:${summary}
DESCRIPTION:${description}
LOCATION:${escapeICS(e.location || '')}
END:VEVENT`;
        }).join('\n');
    }

    const ics = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Breadcrumbs Timeline//ES
CALSCALE:GREGORIAN
METHOD:PUBLISH
${icsEvents}
END:VCALENDAR`;

    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `breadcrumbs-${suffix}.ics`;
    a.click();
    URL.revokeObjectURL(url);
}

// Stats functions
function openStats() {
    calculateStats();
    const modal = document.getElementById('stats-modal');
    if (modal) {
        modal.classList.add('show');
    }
}

function calculateStats() {
    const totalEntries = entries.length;
    const recaps = entries.filter(e => e.type === 'recap').length;
    const timeEvents = entries.filter(e => e.isTimedActivity).length;
    const trackEvents = entries.filter(e => e.isQuickTrack).length;
    const spentEvents = entries.filter(e => e.isSpent).length;
    const breadcrumbs = totalEntries - recaps - timeEvents - trackEvents - spentEvents;
    
    const totalSpent = entries
        .filter(e => e.isSpent)
        .reduce((sum, e) => sum + (e.spentAmount || 0), 0);
    
    const totalMinutes = entries
        .filter(e => e.isTimedActivity)
        .reduce((sum, e) => sum + (e.duration || 0), 0);
    
    const totalHours = (totalMinutes / 60).toFixed(1);

    const avgRating = entries.filter(e => e.type === 'recap' && e.rating)
                             .reduce((sum, e, i, arr) => sum + e.rating / arr.length, 0);
    
    // Actividades más frecuentes
    const activityCount = {};
    entries.filter(e => e.isTimedActivity).forEach(e => {
        activityCount[e.activity] = (activityCount[e.activity] || 0) + e.duration; // Sumar por duración
    });
    const topActivity = Object.keys(activityCount).length > 0 
        ? Object.keys(activityCount).reduce((a, b) => activityCount[a] > activityCount[b] ? a : b)
        : 'N/A';
    
    // Tracks más frecuentes
    const trackCount = {};
    entries.filter(e => e.isQuickTrack).forEach(e => {
        trackCount[e.note] = (trackCount[e.note] || 0) + 1;
    });
    const topTrack = Object.keys(trackCount).length > 0
        ? Object.keys(trackCount).reduce((a, b) => trackCount[a] > trackCount[b] ? a : b)
        : 'N/A';
    
    const statsHTML = `
        <div class="stat-card">
            <div class="stat-number">${totalEntries}</div>
            <div class="stat-label">Total Entries</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${breadcrumbs}</div>
            <div class="stat-label">📝 Breadcrumbs</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${recaps}</div>
            <div class="stat-label">🌟 Day Recaps</div>
        </div>
         <div class="stat-card">
            <div class="stat-number">${avgRating.toFixed(1)} / 10</div>
            <div class="stat-label">Avg. Rating</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${timeEvents}</div>
            <div class="stat-label">⏱️ Time Events</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${totalHours}h</div>
            <div class="stat-label">Hours Tracked</div>
        </div>
         <div class="stat-card">
            <div class="stat-number" style="font-size: 18px;">${topActivity}</div>
            <div class="stat-label">Top Activity (by time)</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${trackEvents}</div>
            <div class="stat-label">📊 Tracked Items</div>
        </div>
        <div class="stat-card">
            <div class="stat-number" style="font-size: 16px;">${topTrack}</div>
            <div class="stat-label">Most Tracked</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${spentEvents}</div>
            <div class="stat-label">💰 Expenses</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">€${totalSpent.toFixed(2)}</div>
            <div class="stat-label">Total Spent</div>
        </div>
    `;
    
    document.getElementById('stats-content').innerHTML = statsHTML;
}

function closeStats(event) {
    if (event && event.target.id !== 'stats-modal' && !event.target.closest('.preview-content')) return;
     if (event && event.target.id === 'stats-modal') {
        const modal = document.getElementById('stats-modal');
        if (modal) {
            modal.classList.remove('show');
        }
    }
}

function forceCloseStats() {
     const modal = document.getElementById('stats-modal');
    if (modal) {
        modal.classList.remove('show');
    }
}
// Initialize app
loadData();
loadSettings();

// ===== RECAP FUNCTIONS =====

function showRecapForm() {
    // Ocultar otros formularios
    document.getElementById('form-window').classList.add('hidden');
    document.getElementById('timer-window').classList.add('hidden');
    document.getElementById('track-window').classList.add('hidden');
    document.getElementById('spent-window').classList.add('hidden');
    
    const recapForm = document.getElementById('recap-form');
    recapForm.classList.remove('hidden');
    
    // Limpiar formulario antes de mostrar
    document.getElementById('recap-reflection').value = '';
    document.getElementById('recap-rating').value = '5';
    document.getElementById('recap-rating-value').textContent = '5';
    document.getElementById('recap-highlight-1').value = '';
    document.getElementById('recap-highlight-2').value = '';
    document.getElementById('recap-highlight-3').value = '';
    document.getElementById('recap-bso').value = '';
    document.getElementById('recap-bso-results').innerHTML = '';
    document.getElementById('recap-selected-track').value = '';
    editingEntryId = null; // Asegurarse de que no estamos editando
    
    // Establecer fecha actual
    setCurrentDateTime('datetime-input-recap');
    
    // Listener para el slider
    const slider = document.getElementById('recap-rating');
    const valueDisplay = document.getElementById('recap-rating-value');
    
    slider.oninput = function() {
        valueDisplay.textContent = this.value;
    };

    recapForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function closeRecapForm() {
    document.getElementById('recap-form').classList.add('hidden');
    // Limpiar formulario al cerrar
    document.getElementById('recap-reflection').value = '';
    document.getElementById('recap-rating').value = '5';
    document.getElementById('recap-rating-value').textContent = '5';
    document.getElementById('recap-highlight-1').value = '';
    document.getElementById('recap-highlight-2').value = '';
    document.getElementById('recap-highlight-3').value = '';
    document.getElementById('recap-bso').value = '';
    document.getElementById('recap-bso-results').innerHTML = '';
    document.getElementById('recap-selected-track').value = '';
    editingEntryId = null;
}


// ===== FAB MENU =====

let fabMenuOpen = false;

function toggleFabMenu() {
    const fabActions = document.querySelectorAll('.fab-action'); // Corregido: .fab-action
    const fabIcon = document.getElementById('fab-icon');
    
    fabMenuOpen = !fabMenuOpen;
    
    if (fabMenuOpen) {
        fabIcon.textContent = '×';
        fabIcon.style.transform = 'rotate(45deg)';
        
        fabActions.forEach((wrapper, index) => {
            wrapper.classList.remove('hidden'); // Quitar 'hidden' para que la animación funcione
            setTimeout(() => {
                wrapper.classList.add('show');
            }, index * 40 + 20); // Añadir un pequeño retraso escalonado
        });
    } else {
        fabIcon.textContent = '+';
        fabIcon.style.transform = 'rotate(0deg)';
        
        // Animar en orden inverso
        Array.from(fabActions).reverse().forEach((wrapper, index) => {
            setTimeout(() => {
                wrapper.classList.remove('show');
                // Añadir 'hidden' después de que termine la animación
                setTimeout(() => wrapper.classList.add('hidden'), 300); 
            }, index * 30);
        });
    }
}

// Cerrar FAB menu al hacer click en una acción
function closeFabMenu() {
    if (fabMenuOpen) {
        toggleFabMenu();
    }
}

// Inicialización de los botones del footer
document.addEventListener('DOMContentLoaded', () => {
    // Asignar listeners a los botones del footer
    const statsBtn = document.querySelector('.footer .mac-button[onclick="openStats()"]');
    if (statsBtn) statsBtn.onclick = openStats;
    
    const csvBtn = document.querySelector('.footer .mac-button[onclick="exportCSV()"]');
    if (csvBtn) csvBtn.onclick = exportCSV;

    const icsBtn = document.querySelector('.footer .mac-button[onclick="exportICS()"]');
    if (icsBtn) icsBtn.onclick = exportICS;

    const settingsBtn = document.querySelector('.footer .mac-button[onclick="openSettings()"]');
    if (settingsBtn) settingsBtn.onclick = openSettings;

    // Asignar listeners a los botones FAB
    const fabMain = document.getElementById('fab-main');
    if(fabMain) fabMain.onclick = toggleFabMenu;

    const fabCrumb = document.querySelector('.fab-action[title="Breadcrumb"]');
    if(fabCrumb) fabCrumb.onclick = () => { toggleForm(); closeFabMenu(); };

    const fabTime = document.querySelector('.fab-action[title="Time Event"]');
    if(fabTime) fabTime.onclick = () => { toggleTimer(); closeFabMenu(); };

    const fabTrack = document.querySelector('.fab-action[title="Quick Track"]');
    if(fabTrack) fabTrack.onclick = () => { toggleTrack(); closeFabMenu(); };

    const fabSpent = document.querySelector('.fab-action[title="Spent"]');
    if(fabSpent) fabSpent.onclick = () => { toggleSpent(); closeFabMenu(); };

    const fabRecap = document.querySelector('.fab-action[title="Day Recap"]');
    if(fabRecap) fabRecap.onclick = () => { showRecapForm(); closeFabMenu(); };

    // Asignar listeners a los botones principales
    const syncBtn = document.querySelector('.sync-button');
    if (syncBtn) syncBtn.onclick = syncData;

    // ... (otros listeners si es necesario) ...

    // Inicializar las opciones de los formularios
    updateTimerOptions();
    updateTrackOptions();
});

