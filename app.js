// Weather API Key
const WEATHER_API_KEY = '317f7bcb07cf05e2c6265176c502a4bb';

// Global variables
// CAMBIO: Definidas como 'window.' para ser accesibles por los módulos
window.entries = [];
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
    // Las funciones de FB (currentUser, isOfflineMode) están en firebase-config.js
    if (window.currentUser && !window.isOfflineMode) {
        window.loadDataFromFirebase();
        window.loadSettingsFromFirebase();
        alert('✅ Synced!');
    } else {
        location.reload();
    }
}

// Settings
// CAMBIO: Definidas como variables GLOBALES (window.)
// para que settings-manager.js pueda acceder a ellas.
window.timeDurations = [15, 30, 60, 120, 180];
window.timeActivities = ['Reading', 'Sports', 'Work', 'Cleaning', 'Errands'];
window.trackItems = {
    meals: ['🍳 Breakfast', '🥗 Lunch', '🍽️ Dinner', '☕ Snack'],
    tasks: ['💊 Medicine', '💧 Water', '🚶 Walk', '📞 Call']
};

// Default moods
// CAMBIO: Definidas como variables GLOBALES (window.)
window.defaultMoods = [
    { emoji: '😊', label: 'Happy' },
    { emoji: '😢', label: 'Sad' },
    { emoji: '😡', label: 'Angry' },
    { emoji: '😰', label: 'Anxious' },
    { emoji: '😴', label: 'Tired' }
];
window.moods = [...window.defaultMoods];

// CAMBIO: loadSettings() se movió a settings-manager.js
// CAMBIO: saveSettingsToStorage() se movió a settings-manager.js

// Load data from localStorage
function loadData() {
    const saved = localStorage.getItem('timeline-entries');
    if (saved) {
        try {
            // CAMBIO: Usar variable global
            window.entries = JSON.parse(saved);
        } catch(e) {
            console.error("Error parsing entries from localStorage", e);
            window.entries = [];
        }
    }
    renderTimeline(); // Esta función sigue aquí por ahora
}

// Save data to localStorage
function saveData() {
    // CAMBIO: Usar variable global
    localStorage.setItem('timeline-entries', JSON.stringify(window.entries));
    // Las variables (isOfflineMode, currentUser) y la función (saveDataToFirebase) están en firebase-config.js
    if (!window.isOfflineMode && window.currentUser) {
        window.saveDataToFirebase();
    }
}


// Sync/Refresh data
// CAMBIO: Hacer global para que el botón la llame
window.syncData = function() {
    location.reload();
}

// Toggle forms
// CAMBIO: Hacer global para que el botón la llame
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
        window.renderMoodSelector(); // CAMBIO: Llamar a global
        setCurrentDateTime('datetime-input');
        form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// CAMBIO: Hacer global para que el botón la llame
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
        setCurrentDateTime('datetime-input-time');
        timer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// CAMBIO: Hacer global para que el botón la llame
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
        window.renderTrackSelector(); // CAMBIO: Llamar a global
        setCurrentDateTime('datetime-input-track');
        selectedTrackItem = null;
        document.getElementById('save-track-btn').disabled = true;
        document.getElementById('delete-track-btn').classList.add('hidden');
        document.getElementById('track-optional-note').value = '';
        track.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// CAMBIO: Hacer global para que el botón la llame
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
        setCurrentDateTime('datetime-input-spent');
        document.getElementById('delete-spent-btn').classList.add('hidden');
        spent.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// Set current date/time in input
function setCurrentDateTime(inputId) {
    const input = document.getElementById(inputId);
    if (!input) return; // Guard clause
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    
    const dateTimeString = `${year}-${month}-${day}T${hours}:${minutes}`;
    input.value = dateTimeString;
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

// CAMBIO: Hacer global para que el botón la llame
window.cancelEdit = function() {
    clearForm();
    window.toggleForm(); // CAMBIO: Llamar a global
}

// GPS functions
// CAMBIO: Hacer global para que el botón la llame
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
            currentCoords = { lat, lon };
            
            locationInput.placeholder = 'Getting location...';
            
            showMiniMap(lat, lon, 'form-map'); // Sigue en app.js (es de render)
            getWeather(lat, lon); // Sigue en app.js
            
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

async function getWeather(lat, lon) {
    const weatherInput = document.getElementById('weather-input');
    const locationInput = document.getElementById('location-input');
    
    weatherInput.value = '⏳ Getting weather...';
    
    try {
        const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=metric&lang=en`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error('Weather API returned ' + response.status);
        }
        
        const data = await response.json();
        
        const temp = Math.round(data.main.temp);
        const description = data.weather[0].description;
        const emoji = getWeatherEmoji(data.weather[0].id);
        const city = data.name || 'Unknown';
        
        weatherInput.value = `${emoji} ${description}, ${temp}°C in ${city}`;
        locationInput.value = city;
    } catch (error) {
        console.error('Error getting weather:', error);
        weatherInput.value = '';
        locationInput.value = ''; // Limpiar si falla
    }
}

function getWeatherEmoji(code) {
    if (code >= 200 && code < 300) return '⛈️';
    if (code >= 300 && code < 400) return '🌦️';
    if (code >= 500 && code < 600) return '🌧️';
    if (code >= 600 && code < 700) return '❄️';
    if (code >= 700 && code < 800) return '🌫️';
    if (code === 800) return '☀️';
    if (code > 800) return '☁️';
    return '🌤️';
}

function showMiniMap(lat, lon, containerId) {
    const mapContainer = document.getElementById(containerId);
    if (!mapContainer) return;

    mapContainer.innerHTML = '';
    mapContainer.style.display = 'block';

    try {
        const map = L.map(containerId).setView([lat, lon], 13);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap',
            maxZoom: 19
        }).addTo(map);

        L.marker([lat, lon]).addTo(map);

        setTimeout(() => {
            map.invalidateSize();
        }, 100);
    } catch(e) {
        console.error("Error initializing Leaflet map:", e);
        mapContainer.innerHTML = "Map failed to load. Are you online?";
    }
}

// Image handling
// CAMBIO: Hacer global para que el input la llame
window.handleImages = function(event) {
    const files = Array.from(event.target.files);
    
    files.forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = function() {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                let width = img.width;
                let height = img.height;
                const maxSize = 800;
                
                if (width > height && width > maxSize) {
                    height = (height * maxSize) / width;
                    width = maxSize;
                } else if (height > maxSize) {
                    width = (width * maxSize) / height;
                    height = maxSize;
                }
                
                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);
                
                const resizedImage = canvas.toDataURL('image/jpeg', 0.8);
                
                currentImages.push(resizedImage);
                renderImagePreviews();
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

// Audio recording - iOS compatible
// CAMBIO: Hacer global para que el botón la llame
window.startRecording = async function() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                sampleRate: 44100
            } 
        });
        
        // Detectar formato compatible con iOS
        let options = {};
        if (MediaRecorder.isTypeSupported('audio/mp4')) {
            options = { mimeType: 'audio/mp4' };
        } else if (MediaRecorder.isTypeSupported('audio/webm')) {
            options = { mimeType: 'audio/webm' };
        } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
            options = { mimeType: 'audio/ogg' };
        }
        
        mediaRecorder = new MediaRecorder(stream, options);
        audioChunks = [];

        mediaRecorder.ondataavailable = (event) => {
            audioChunks.push(event.data);
        };

        mediaRecorder.onstop = () => {
            const mimeType = mediaRecorder.mimeType || 'audio/webm';
            const audioBlob = new Blob(audioChunks, { type: mimeType });
            const reader = new FileReader();
            reader.onloadend = () => {
                currentAudio = reader.result;
                renderAudioPreview();
            };
            reader.readAsDataURL(audioBlob);
            
            stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorder.start();
        document.getElementById('record-btn').disabled = true;
        document.getElementById('stop-record-btn').disabled = false;
        document.querySelector('.audio-recorder').classList.add('recording');
    } catch (error) {
        console.error('Error accessing microphone:', error);
        alert('Could not access microphone.');
    }
}

// CAMBIO: Hacer global para que el botón la llame
window.stopRecording = function() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
        document.getElementById('record-btn').disabled = false;
        document.getElementById('stop-record-btn').disabled = true;
        document.querySelector('.audio-recorder').classList.remove('recording');
    }
}

function renderImagePreviews() {
    const container = document.getElementById('image-previews');
    container.innerHTML = currentImages.map((img, idx) => `
        <div class="image-preview">
            <img src="${img}" alt="Preview image ${idx+1}">
            <div class="image-remove" onclick="removeImage(${idx})">✕</div>
        </div>
    `).join('');
}

function renderAudioPreview() {
    const container = document.getElementById('audio-preview');
    if (currentAudio) {
        container.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px; margin-top: 8px;">
                <audio controls style="flex: 1;">
                    <source src="${currentAudio}">
                </audio>
                <button class="mac-button" onclick="removeAudio()" style="padding: 4px 8px;">✕</button>
            </div>
        `;
    } else {
        container.innerHTML = '';
    }
}

// CAMBIO: Hacer global para que el botón la llame
window.removeImage = function(index) {
    currentImages.splice(index, 1);
    renderImagePreviews();
}

// CAMBIO: Hacer global para que el botón la llame
window.removeAudio = function() {
    currentAudio = null;
    renderAudioPreview();
}
// Mood functions
// CAMBIO: Hacer global para que settings-manager.js la llame
window.renderMoodSelector = function() {
    const container = document.getElementById('mood-selector');
    // CAMBIO: Usar variable global window.moods
    container.innerHTML = window.moods.map((mood, index) => `
        <div class="mood-option ${selectedMood === index ? 'selected' : ''}" onclick="selectMood(${index})">
            ${mood.emoji}
            <span class="mood-label">${mood.label}</span>
        </div>
    `).join('');
}

// CAMBIO: Hacer global para que el botón la llame
window.selectMood = function(index) {
    selectedMood = index;
    window.renderMoodSelector();
}

// CAMBIO: toggleMoodConfig() movido a settings-manager.js
// CAMBIO: renderMoodConfig() movido a settings-manager.js
// CAMBIO: saveMoodConfig() movido a settings-manager.js

// Save/Edit entry functions
// CAMBIO: Hacer global para que el botón la llame
window.saveEntry = function() {
    const note = document.getElementById('note-input').value.trim();
    if (!note) {
        alert('Please write a note');
        return;
    }

    // CAMBIO: Usar variable global window.moods
    const moodData = selectedMood !== null ? window.moods[selectedMood] : null;
    const timestamp = getTimestampFromInput('datetime-input');

    if (editingEntryId) {
        const entryIndex = window.entries.findIndex(e => e.id === editingEntryId);
        if (entryIndex !== -1) {
            window.entries[entryIndex] = {
                ...window.entries[entryIndex], // Mantener tipo (isTimedActivity, etc)
                timestamp: timestamp,
                note: note,
                location: document.getElementById('location-input').value,
                weather: document.getElementById('weather-input').value,
                images: [...currentImages],
                audio: currentAudio,
                coords: currentCoords ? { ...currentCoords } : window.entries[entryIndex].coords,
                mood: moodData,
                // Asegurarse de que no se marquen como otros tipos
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

    saveData();
    renderTimeline();
    window.toggleForm(); // CAMBIO: Llamar a global
}

// CAMBIO: Hacer global para que el botón la llame
window.editEntry = function(id) {
    const entry = window.entries.find(e => e.id === id);
    if (!entry) return;

    // Redirigir a funciones de edición específicas si es necesario
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
        // CAMBIO: Usar variable global window.moods
        const moodIndex = window.moods.findIndex(m => m.emoji === entry.mood.emoji && m.label === entry.mood.label);
        selectedMood = moodIndex !== -1 ? moodIndex : null;
    } else {
        selectedMood = null;
    }

    renderImagePreviews();
    renderAudioPreview();
    window.renderMoodSelector(); // Usar la global

    if (entry.coords) {
        showMiniMap(entry.coords.lat, entry.coords.lon, 'form-map');
    }

    document.getElementById('delete-btn').classList.remove('hidden');
    document.getElementById('save-btn').textContent = '💾 Update';
    
    // Ocultar otros formularios y mostrar el correcto
    const formWindow = document.getElementById('form-window');
    document.getElementById('timer-window').classList.add('hidden');
    document.getElementById('track-window').classList.add('hidden');
    document.getElementById('spent-window').classList.add('hidden');
    document.getElementById('recap-form').classList.add('hidden');
    
    formWindow.classList.remove('hidden');
    formWindow.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Time Event functions
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
    
    document.getElementById('time-optional-note').value = entry.optionalNote || '';
    
    // CAMBIO: Asegurarse de que las opciones estén renderizadas
    // La función updateTimerOptions() está en settings-manager.js
    if (typeof window.updateTimerOptions === 'function') {
        window.updateTimerOptions();
    }
    
    document.querySelectorAll('.duration-option').forEach(el => {
        el.classList.remove('selected');
        // Usar data-duration para una comparación más fiable
        if (parseInt(el.dataset.duration) === selectedDuration) {
            el.classList.add('selected');
        }
    });
    
    document.querySelectorAll('#activity-selector .activity-option').forEach(el => {
        el.classList.remove('selected');
        // Usar data-activity para una comparación más fiable
        if (el.dataset.activity === selectedActivity) {
            el.classList.add('selected');
        }
    });
    
    checkTimerReady();
    
    const timerWindow = document.getElementById('timer-window');
    const createBtn = document.getElementById('create-time-btn');
    createBtn.textContent = '💾 Update Event';
    document.getElementById('delete-time-btn').classList.remove('hidden');
    
    // Ocultar otros formularios y mostrar el correcto
    document.getElementById('form-window').classList.add('hidden');
    document.getElementById('track-window').classList.add('hidden');
    document.getElementById('spent-window').classList.add('hidden');
    document.getElementById('recap-form').classList.add('hidden');

    timerWindow.classList.remove('hidden');
    timerWindow.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// CAMBIO: Hacer global para que el botón la llame
window.selectDuration = function(minutes) {
    selectedDuration = minutes;
    const options = document.querySelectorAll('.duration-option');
    options.forEach(el => {
        el.classList.remove('selected');
        // Usar data-duration
        if (parseInt(el.dataset.duration) === minutes) {
            el.classList.add('selected');
        }
    });
    
    checkTimerReady();
}

// CAMBIO: Hacer global para que el botón la llame
window.selectActivity = function(activity) {
    selectedActivity = activity;
    const options = document.querySelectorAll('#activity-selector .activity-option');
    options.forEach(el => {
        el.classList.remove('selected');
        // Usar data-activity
        if (el.dataset.activity === activity) {
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

// CAMBIO: Hacer global para que el botón la llame
window.createTimeEvent = function() {
    if (!selectedDuration || !selectedActivity) return;
    
    const timestamp = getTimestampFromInput('datetime-input-time');
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
                isTimedActivity: true, // Asegurar
                // Limpiar otros tipos
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
    
    saveData();
    renderTimeline();
    
    alert(`✅ Time event ${editingEntryId ? 'updated' : 'created'}!`);
    window.toggleTimer(); // CAMBIO: Llamar a global
    
    document.getElementById('create-time-btn').textContent = 'Create Event';
    document.getElementById('delete-time-btn').classList.add('hidden');
    document.getElementById('time-optional-note').value = '';
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
// CAMBIO: Hacer global para que settings-manager.js la llame
window.renderTrackSelector = function() {
    const container = document.getElementById('track-selector');
    if (!container) return; // Guard clause
    // CAMBIO: Usar variable global window.trackItems
    const allItems = [...window.trackItems.meals, ...window.trackItems.tasks];
    
    container.innerHTML = allItems.map((item, index) => `
        <div class="activity-option" data-item="${item.replace(/'/g, "\\'")}" onclick="selectTrackItem('${item.replace(/'/g, "\\'")}')">
            ${item}
        </div>
    `).join('');
}

// CAMBIO: Hacer global para que el botón la llame
window.selectTrackItem = function(item) {
    selectedTrackItem = item;
    document.querySelectorAll('#track-selector .activity-option').forEach(el => {
        el.classList.remove('selected');
        // Usar data-item
        if (el.dataset.item === item) {
            el.classList.add('selected');
        }
    });
    document.getElementById('save-track-btn').disabled = false;
}

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
    
    // CAMBIO: Asegurarse de que las opciones estén renderizadas
    // La función updateTrackOptions() está en settings-manager.js
    if (typeof window.updateTrackOptions === 'function') {
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
    
    // Ocultar otros formularios y mostrar el correcto
    const trackWindow = document.getElementById('track-window');
    document.getElementById('form-window').classList.add('hidden');
    document.getElementById('timer-window').classList.add('hidden');
    document.getElementById('spent-window').classList.add('hidden');
    document.getElementById('recap-form').classList.add('hidden');

    trackWindow.classList.remove('hidden');
    trackWindow.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// CAMBIO: Hacer global para que el botón la llame
window.saveTrackEvent = function() {
    if (!selectedTrackItem) return;
    
    const timestamp = getTimestampFromInput('datetime-input-track');
    const optionalNote = document.getElementById('track-optional-note').value.trim();
    
    if (editingEntryId) {
        const entryIndex = window.entries.findIndex(e => e.id === editingEntryId);
        if (entryIndex !== -1) {
            window.entries[entryIndex] = {
                ...window.entries[entryIndex],
                timestamp: timestamp,
                note: selectedTrackItem,
                optionalNote: optionalNote,
                isQuickTrack: true, // Asegurar
                // Limpiar otros tipos
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
    
    saveData();
    renderTimeline();
    window.toggleTrack(); // CAMBIO: Llamar a global
    
    document.getElementById('save-track-btn').textContent = 'Save Track';
    document.getElementById('delete-track-btn').classList.add('hidden');
}

// Spent Event functions
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
    
    // Ocultar otros formularios y mostrar el correcto
    const spentWindow = document.getElementById('spent-window');
    document.getElementById('form-window').classList.add('hidden');
    document.getElementById('timer-window').classList.add('hidden');
    document.getElementById('track-window').classList.add('hidden');
    document.getElementById('recap-form').classList.add('hidden');

    spentWindow.classList.remove('hidden');
    spentWindow.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// CAMBIO: Hacer global para que el botón la llame
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

    const timestamp = getTimestampFromInput('datetime-input-spent');

    if (editingEntryId) {
        const entryIndex = window.entries.findIndex(e => e.id === editingEntryId);
        if (entryIndex !== -1) {
            window.entries[entryIndex] = {
                ...window.entries[entryIndex],
                timestamp: timestamp,
                note: description,
                spentAmount: amount,
                isSpent: true, // Asegurar
                // Limpiar otros tipos
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
    
    saveData();
    renderTimeline();
    window.toggleSpent(); // CAMBIO: Llamar a global
    document.getElementById('delete-spent-btn').classList.add('hidden');
}

// Delete entry
// CAMBIO: Hacer global para que el botón la llame
window.deleteCurrentEntry = function() {
    if (!editingEntryId) return;
    
    // Determinar de qué formulario se está eliminando
    let formIdToDelete = null;
    if (!document.getElementById('form-window').classList.contains('hidden')) formIdToDelete = 'form-window';
    else if (!document.getElementById('timer-window').classList.contains('hidden')) formIdToDelete = 'timer-window';
    else if (!document.getElementById('track-window').classList.contains('hidden')) formIdToDelete = 'track-window';
    else if (!document.getElementById('spent-window').classList.contains('hidden')) formIdToDelete = 'spent-window';
    // (Añadir recap si tuviera botón delete)
    // else if (!document.getElementById('recap-form').classList.contains('hidden')) formIdToDelete = 'recap-form';
    
    if (confirm('Delete this entry?')) {
        window.entries = window.entries.filter(e => e.id !== editingEntryId);
        
        // Las variables (currentUser, isOfflineMode) y la función (deleteEntryFromFirebase) están en firebase-config.js
        if (window.currentUser && !window.isOfflineMode) {
            window.deleteEntryFromFirebase(editingEntryId); 
        }
        
        saveData();
        renderTimeline();
        
        // Cerrar el formulario activo
        if (formIdToDelete) {
            document.getElementById(formIdToDelete).classList.add('hidden');
        }
        
        editingEntryId = null;
    }
}
// Preview functions
// CAMBIO: Hacer global para que el botón la llame
window.previewEntry = function(id) {
    const entry = window.entries.find(e => e.id === id);
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

// CAMBIO: Hacer global para que el botón la llame
window.closePreview = function(event) {
    if (event && (event.target.id !== 'preview-modal' && !event.target.closest('.mac-title-bar button'))) return;
    const modal = document.getElementById('preview-modal');
    modal.classList.remove('show');
    document.getElementById('preview-body').innerHTML = '';
}

// CAMBIO: openSettings() movido a settings-manager.js

// Show image preview
// CAMBIO: Hacer global para que el botón la llame
window.showImageInModal = function(entryId, imageIndex) {
    const entry = window.entries.find(e => e.id == entryId);
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


// CAMBIO: closeSettings() movido a settings-manager.js
// CAMBIO: renderSettingsConfig() movido a settings-manager.js
// CAMBIO: addDuration() movido a settings-manager.js
// CAMBIO: removeDuration() movido a settings-manager.js
// CAMBIO: addActivity() movido a settings-manager.js
// CAMBIO: removeActivity() movido a settings-manager.js
// CAMBIO: addMeal() movido a settings-manager.js
// CAMBIO: removeMeal() movido a settings-manager.js
// CAMBIO: addTask() movido a settings-manager.js
// CAMBIO: removeTask() movido a settings-manager.js
// CAMBIO: saveSettings() movido a settings-manager.js
// CAMBIO: updateTimerOptions() movido a settings-manager.js
// CAMBIO: updateTrackOptions() movido a settings-manager.js

// Timeline rendering
// CAMBIO: Hacer global para que el botón la llame
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

function formatDate(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en', { // 'en' para formato consistente
        weekday: 'long',
        day: 'numeric', 
        month: 'long', 
        year: 'numeric'
    });
}

function formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function calculateEndTime(timestamp, durationMinutes) {
    const date = new Date(timestamp);
    date.setMinutes(date.getMinutes() + durationMinutes);
    return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function getDayKey(timestamp) {
    const date = new Date(timestamp);
    return date.toISOString().split('T')[0];
}

// CAMBIO: Hacer global para que el botón la llame
window.toggleDay = function(dayKey) {
    const content = document.getElementById(`day-content-${dayKey}`);
    const chevron = document.getElementById(`chevron-${dayKey}`);
    
    content.classList.toggle('expanded');
    chevron.classList.toggle('expanded');
}

// CAMBIO: Hacer global para que el botón la llame
window.toggleRecap = function(recapId) {
    const content = document.getElementById(`recap-content-${recapId}`);
    const chevron = document.getElementById(`chevron-recap-${recapId}`);
    
    content.classList.toggle('hidden');
    chevron.classList.toggle('expanded');
}

// Toggle note expansion (ya está toggleReadMore, esta parece duplicada)
// function toggleNote(entryId) { ... }

function renderTimeline() {
    const container = document.getElementById('timeline-container');
    const emptyState = document.getElementById('empty-state');
    const footer = document.getElementById('footer');

    if (window.entries.length === 0) {
        container.innerHTML = '';
        emptyState.classList.remove('hidden');
        footer.style.display = 'none';
        return;
    }

    emptyState.classList.add('hidden');
    footer.style.display = 'flex';

    const groupedByDay = {};
    window.entries.forEach(entry => {
        const dayKey = getDayKey(entry.timestamp);
        if (!groupedByDay[dayKey]) {
            groupedByDay[dayKey] = [];
        }
        groupedByDay[dayKey].push(entry);
    });

    // Ordenar días de más reciente a más antiguo
    const sortedDayKeys = Object.keys(groupedByDay).sort((a, b) => b.localeCompare(a));

    const html = `
        <div class="timeline">
            <div class="timeline-line"></div>
            ${sortedDayKeys.map(dayKey => {
                const dayEntries = groupedByDay[dayKey];
                const firstEntry = dayEntries[0];
                
                // Separar recaps de otros eventos
                const recaps = dayEntries.filter(e => e.type === 'recap');
                const regularEntries = dayEntries.filter(e => e.type !== 'recap');
                
                // Abrir el primer día por defecto
                const isFirstDay = sortedDayKeys.indexOf(dayKey) === 0;
                const expandedClass = isFirstDay ? 'expanded' : '';
                
                return `
                    <div class="day-block">
                        <div class="day-header" onclick="toggleDay('${dayKey}')">
                            <span>${formatDate(firstEntry.timestamp)}</span>
                            <span class="chevron ${expandedClass}" id="chevron-${dayKey}">▼</span>
                        </div>
                        
                        ${recaps.map(recap => `
                            <div class="recap-block">
                                <div class="recap-header" onclick="toggleRecap('${recap.id}')">
                                    <span>🌟 Day Recap</span>
                                    <span class="chevron-recap" id="chevron-recap-${recap.id}">▼</span>
                                </div>
                                <div class="recap-content hidden" id="recap-content-${recap.id}">
                                    <button class="mac-button edit-button" onclick="editEntry(${recap.id})" style="position: absolute; top: 12px; right: 12px;">✏️ Edit</button>
                                    
                                    <div style="margin-bottom: 16px;">
                                        <strong>Rating:</strong> ${recap.rating}/10 ${'⭐'.repeat(Math.round(recap.rating / 2))}
                                    </div>
                                    
                                    ${recap.reflection ? `
                                        <div style="margin-bottom: 16px;">
                                            <strong>Reflection:</strong>
                                            <div style="margin-top: 8px; line-height: 1.6; white-space: pre-wrap;">${recap.reflection}</div>
                                        </div>
                                    ` : ''}
                                    
                                    ${recap.highlights && recap.highlights.length > 0 ? `
                                        <div style="margin-bottom: 16px;">
                                            <strong>Highlights:</strong>
                                            <ul style="margin-top: 8px; padding-left: 20px;">
                                                ${recap.highlights.map(h => `<li style="margin-bottom: 4px;">${h}</li>`).join('')}
                                            </ul>
                                        </div>
                                    ` : ''}
                                    
                                    ${recap.track ? `
                                        <div style="margin-bottom: 16px;">
                                            <strong>Day's Soundtrack:</strong>
                                            <div class="bso-result" style="display: flex; align-items: center; gap: 12px; margin-top: 8px; padding: 12px; border: 2px solid #000; background: #f9f9f9;">
                                                <img src="${recap.track.artwork}" style="width: 50px; height: 50px; border: 2px solid #000;">
                                                <div style="flex: 1;">
                                                    <div style="font-weight: bold; font-size: 13px;">${recap.track.name}</div>
                                                    <div style="font-size: 11px; color: #666;">${recap.track.artist}</div>
                                                </div>
                                                <a href="${recap.track.url}" target="_blank" style="text-decoration: none; font-size: 18px;">🔗</a>
                                            </div>
                                        </div>
                                    ` : ''}
                                </div>
                            </div>
                        `).join('')}
                        
                        <div class="day-content ${expandedClass}" id="day-content-${dayKey}">
                            ${regularEntries.map(entry => {
                                const heightStyle = entry.isTimedActivity && entry.duration ? `min-height: ${Math.max(120, Math.min(150 + entry.duration * 0.5, 300))}px;` : '';
                                const trackClass = entry.isQuickTrack ? 'track-event' : '';
                                const spentClass = entry.isSpent ? 'spent-event' : '';
                                const crumbClass = (!entry.isTimedActivity && !entry.isQuickTrack && !entry.isSpent && entry.type !== 'recap') ? 'crumb-event' : ''; // Clase para crumbs
                                
                                const noteContent = entry.note || '';
                                const optionalNoteContent = entry.optionalNote || '';
                                const needsReadMore = noteContent.length > 200 || noteContent.split('\n').length > 4;
                                const needsReadMoreOptional = optionalNoteContent.length > 200 || optionalNoteContent.split('\n').length > 4;

                                return `
                                <div class="breadcrumb-entry ${entry.isTimedActivity ? 'time-event' : ''} ${trackClass} ${spentClass} ${crumbClass}" style="${heightStyle}">
                                    <button class="mac-button edit-button" onclick="editEntry(${entry.id})">✏️ Edit</button>
                                    
                                    ${entry.isTimedActivity ? 
                                        `<div>
                                            <div class="breadcrumb-time">⏰ ${formatTime(entry.timestamp)} - ${calculateEndTime(entry.timestamp, entry.duration)}</div>
                                            <div class="activity-label">${entry.activity}</div>
                                            <div style="font-size: 13px; color: #666; margin-top: 8px;">Duration: ${entry.duration} minutes</div>
                                        </div>
                                        ${entry.optionalNote ? `
                                            <div class="optional-note" id="note-${entry.id}">${entry.optionalNote}</div>
                                            ${needsReadMoreOptional ? `<button class="read-more-btn" id="read-more-${entry.id}" onclick="toggleReadMore(${entry.id})">Read more</button>` : ''}
                                        ` : ''}` :
                                        `<div class="breadcrumb-time">
                                            ${entry.isQuickTrack ?
                                                `<span class="compact-time">⏰ ${formatTime(entry.timestamp)} ${entry.note}</span>` :
                                                `⏰ ${formatTime(entry.timestamp)}`
                                            }
                                            ${entry.isSpent ? `<span class="spent-badge">💰 €${entry.spentAmount.toFixed(2)}</span>` : ''}
                                        </div>`
                                    }
                                    
                                    ${entry.isQuickTrack && entry.optionalNote ? `
                                        <div class="optional-note" id="note-${entry.id}">${entry.optionalNote}</div>
                                        ${needsReadMoreOptional ? `<button class="read-more-btn" id="read-more-${entry.id}" onclick="toggleReadMore(${entry.id})">Read more</button>` : ''}
                                    ` : ''}
                                    
                                    ${!entry.isTimedActivity && !entry.isQuickTrack && !entry.isSpent && entry.type !== 'recap' ? `
                                        <div style="display: flex; align-items: flex-start; gap: 12px; margin-bottom: 8px;">
                                            ${entry.mood ? `<span class="mood-display">${entry.mood.emoji}</span>` : ''}
                                            <div style="flex: 1;">
                                                <div class="breadcrumb-note" id="note-${entry.id}">${entry.note}</div>
                                                ${needsReadMore ? `<button class="read-more-btn" id="read-more-${entry.id}" onclick="toggleReadMore(${entry.id})">Read more</button>` : ''}
                                            </div>
                                        </div>
                                    ` : ''}
                                    
                                    ${(entry.weather || entry.location) ? `
                                        <div class="breadcrumb-meta">
                                            ${entry.weather ? `<span>${entry.weather}</span>` : ''}
                                            ${entry.weather && entry.location ? ` • ` : ''}
                                            ${entry.location ? `<span>📍 ${entry.location}</span>` : ''}
                                        </div>
                                    ` : ''}
                                    
                                    ${entry.audio ? `
                                        <div style="margin-top: 12px; margin-bottom: 12px;">
                                            <audio controls style="width: 100%; max-width: 300px;">
                                                <source src="${entry.audio}">
                                            </audio>
                                        </div>
                                    ` : ''}
                                    
                                    <div class="breadcrumb-preview">
                                        ${entry.images && entry.images.length > 0 ? entry.images.map((img, idx) => `
                                            <img src="${img}" class="preview-image-thumb" alt="Thumbnail ${idx+1}" onclick="event.stopPropagation(); showImageInModal('${entry.id}', ${idx});">
                                        `).join('') : ''}
                                        ${entry.coords ? `<div class="preview-map-thumb" id="mini-map-${entry.id}"></div>` : ''}
                                        <button class="mac-button preview-button" onclick="previewEntry(${entry.id})">🔍 Preview</button>
                                    </div>
                                </div>
                            `}).join('')}
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;

    container.innerHTML = html;
    
    // Renderizar mini-mapas después de que el HTML esté en el DOM
    window.entries.forEach(entry => {
        if (entry.coords) {
            setTimeout(() => {
                const mapEl = document.getElementById(`mini-map-${entry.id}`);
                if (mapEl && !mapEl.classList.contains('leaflet-container')) {
                    try {
                        const miniMap = L.map(`mini-map-${entry.id}`, {
                            zoomControl: false,
                            attributionControl: false,
                            dragging: false,
                            scrollWheelZoom: false,
                            doubleClickZoom: false,
                            boxZoom: false,
                            keyboard: false
                        }).setView([entry.coords.lat, entry.coords.lon], 13);
                        
                        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                            maxZoom: 19
                        }).addTo(miniMap);
                        
                        L.marker([entry.coords.lat, entry.coords.lon]).addTo(miniMap);
                        
                        mapEl.style.cursor = 'pointer';
                        mapEl.onclick = () => window.previewEntry(entry.id); // CAMBIO: Llamar a global
                    } catch (e) {
                        console.error('Error creating mini map:', e);
                        mapEl.innerHTML = "Map failed";
                    }
                }
            }, 100);
        }
    });
}

// CAMBIO: exportCSV() movido a data-tools.js
// CAMBIO: exportICS() movido a data-tools.js
// CAMBIO: openExportModal() movido a data-tools.js
// CAMBIO: createExportModal() movido a data-tools.js
// CAMBIO: updateExportOptions() movido a data-tools.js
// CAMBIO: closeExportModal() movido a data-tools.js
// CAMBIO: performExport() movido a data-tools.js
// CAMBIO: exportCSVData() movido a data-tools.js
// CAMBIO: exportICSData() movido a data-tools.js

// Stats functions
// CAMBIO: openStats() movido a data-tools.js
// CAMBIO: calculateStats() movido a data-tools.js
// CAMBIO: closeStats() movido a data-tools.js

// Initialize app
// Cargar datos y settings al inicio
document.addEventListener('DOMContentLoaded', () => {
    // CAMBIO: Llamar a la función global de settings-manager.js
    if (typeof window.loadSettings === 'function') {
        window.loadSettings();
    } else {
        console.error("Error: settings-manager.js no se ha cargado.");
    }
    
    loadData(); // Carga datos locales
    
    // CAMBIO: Llamar a las funciones globales de settings-manager.js
    // para poblar los selectores de los formularios (que están ocultos)
    if (typeof window.updateTimerOptions === 'function') {
        window.updateTimerOptions();
    }
    if (typeof window.updateTrackOptions === 'function') {
        window.updateTrackOptions();
    }
    
    // Las funciones de login (signInWithGoogle, etc.) están en firebase-config.js
    // y se llaman directamente desde el HTML.
    
    // El listener onAuthStateChanged en firebase-config.js
    // se encargará de llamar a loadDataFromFirebase y loadSettingsFromFirebase
});

// ===== RECAP FUNCTIONS =====

// CAMBIO: Hacer global para que el botón la llame
window.showRecapForm = function() {
    // Ocultar otros formularios
    document.getElementById('form-window').classList.add('hidden');
    document.getElementById('timer-window').classList.add('hidden');
    document.getElementById('track-window').classList.add('hidden');
    document.getElementById('spent-window').classList.add('hidden');
    
    const recapForm = document.getElementById('recap-form');
    recapForm.classList.remove('hidden');
    
    // Establecer fecha actual
    setCurrentDateTime('datetime-input-recap');
    
    // Limpiar formulario (excepto si estamos editando, lo cual se maneja en editRecapEvent)
    if (!editingEntryId) { // Solo limpiar si no estamos editando
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

    // Listener para el slider
    const slider = document.getElementById('recap-rating');
    const valueDisplay = document.getElementById('recap-rating-value');
    
    slider.oninput = function() {
        valueDisplay.textContent = this.value;
    };
    
    recapForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// CAMBIO: Hacer global para que el botón la llame
window.closeRecapForm = function() {
    document.getElementById('recap-form').classList.add('hidden');
    editingEntryId = null; // Asegurarse de limpiar el ID de edición
}

// CAMBIO: Hacer global para que el botón la llame
window.buscarBSO = async function() {
    const query = document.getElementById('recap-bso').value.trim();
    if (!query) {
        alert('Please enter a song or artist name');
        return;
    }
    
    const resultsDiv = document.getElementById('recap-bso-results');
    resultsDiv.innerHTML = '<div style="padding: 12px; text-align: center;">Searching...</div>';
    
    try {
        const url = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=5`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`iTunes API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.results && data.results.length > 0) {
            const html = data.results.map(track => `
                <div class="bso-result" style="display: flex; align-items: center; gap: 12px; padding: 8px; border: 2px solid #999; margin-bottom: 8px; cursor: pointer; background: white;" onclick="selectTrack('${track.trackName.replace(/'/g, "\\'")}', '${track.artistName.replace(/'/g, "\\'")}', '${track.trackViewUrl}', '${track.artworkUrl100}')">
                    <img src="${track.artworkUrl100}" style="width: 50px; height: 50px; border: 2px solid #000;">
                    <div style="flex: 1;">
                        <div style="font-weight: bold; font-size: 13px;">${track.trackName}</div>
                        <div style="font-size: 11px; color: #666;">${track.artistName}</div>
                    </div>
                    <div style="font-size: 18px;">▶️</div>
                </div>
            `).join('');
            resultsDiv.innerHTML = html;
        } else {
            resultsDiv.innerHTML = '<div style="padding: 12px; text-align: center; color: #666;">No results found</div>';
        }
    } catch (error) {
        console.error('Error searching BSO:', error);
        resultsDiv.innerHTML = '<div style="padding: 12px; text-align: center; color: red;">Error searching. Try again.</div>';
    }
}

// CAMBIO: Hacer global para que el botón la llame
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

function editRecapEvent(entry) {
    editingEntryId = entry.id;
    
    // Ocultar otros formularios y mostrar el de Recap
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
    
    // Limpiar búsqueda anterior
    document.getElementById('recap-bso').value = '';
    document.getElementById('recap-bso-results').innerHTML = '';
    document.getElementById('recap-selected-track').value = '';
    
    if (entry.track) {
        // Mostrar la pista seleccionada
        window.selectTrack(entry.track.name, entry.track.artist, entry.track.url, entry.track.artwork); // CAMBIO: Llamar a global
    }
    
    recapForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// CAMBIO: Hacer global para que el botón la llame
window.saveRecap = function() {
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
    
    const recapEntry = {
        id: editingEntryId || Date.now(),
        timestamp: timestamp,
        type: 'recap',
        reflection: reflection,
        rating: parseInt(rating),
        highlights: [highlight1, highlight2, highlight3].filter(h => h), // Solo guardar highlights no vacíos
        track: selectedTrackJson ? JSON.parse(selectedTrackJson) : null,
        // Asegurar que otros campos estén limpios
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
    
    saveData();
    renderTimeline();
    window.closeRecapForm(); // CAMBIO: Llamar a global
}

// ===== FAB MENU =====

let fabMenuOpen = false;

// CAMBIO: Hacer global para que el botón la llame
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
            }, (fabActions.length - index - 1) * 30); // Invertir orden al cerrar
        });
    }
}

// Cerrar FAB menu al hacer click en una acción
function closeFabMenu() {
    if (fabMenuOpen) {
        window.toggleFabMenu(); // CAMBIO: Llamar a global
    }
}

// Envolver los toggles para que cierren el menú
// Los onclick en index.html ahora llaman a estas funciones
// CAMBIO: Hacer globales
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
window.showRecapFormWithFab = function() { // Renombrada para evitar colisión
    closeFabMenu();
    window.showRecapForm();
}

