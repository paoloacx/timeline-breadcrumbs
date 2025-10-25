// Weather API Key
const WEATHER_API_KEY = '317f7bcb07cf05e2c6265176c502a4bb';

// Global variables
let entries = [];
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
window.moods = [...defaultMoods];

// CAMBIO: loadSettings() se movió a settings-manager.js
// CAMBIO: saveSettingsToStorage() se movió a settings-manager.js

// Load data from localStorage
function loadData() {
    const saved = localStorage.getItem('timeline-entries');
    if (saved) {
        try {
            entries = JSON.parse(saved);
        } catch(e) {
            console.error("Error parsing entries from localStorage", e);
            entries = [];
        }
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
    location.reload();
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
            getWeather(lat, lon);
            
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
function handleImages(event) {
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
async function startRecording() {
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

function stopRecording() {
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

function removeImage(index) {
    currentImages.splice(index, 1);
    renderImagePreviews();
}

function removeAudio() {
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

function selectMood(index) {
    selectedMood = index;
    window.renderMoodSelector();
}

// CAMBIO: toggleMoodConfig() movido a settings-manager.js
// CAMBIO: renderMoodConfig() movido a settings-manager.js
// CAMBIO: saveMoodConfig() movido a settings-manager.js

// Save/Edit entry functions
function saveEntry() {
    const note = document.getElementById('note-input').value.trim();
    if (!note) {
        alert('Please write a note');
        return;
    }

    // CAMBIO: Usar variable global window.moods
    const moodData = selectedMood !== null ? window.moods[selectedMood] : null;
    const timestamp = getTimestampFromInput('datetime-input');

    if (editingEntryId) {
        const entryIndex = entries.findIndex(e => e.id === editingEntryId);
        if (entryIndex !== -1) {
            entries[entryIndex] = {
                ...entries[entryIndex], // Mantener tipo (isTimedActivity, etc)
                timestamp: timestamp,
                note: note,
                location: document.getElementById('location-input').value,
                weather: document.getElementById('weather-input').value,
                images: [...currentImages],
                audio: currentAudio,
                coords: currentCoords ? { ...currentCoords } : entries[entryIndex].coords,
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
        entries.unshift(entry);
    }

    saveData();
    renderTimeline();
    toggleForm();
}

function editEntry(id) {
    const entry = entries.find(e => e.id === id);
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

function selectDuration(minutes) {
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

function selectActivity(activity) {
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

function createTimeEvent() {
    if (!selectedDuration || !selectedActivity) return;
    
    const timestamp = getTimestampFromInput('datetime-input-time');
    const optionalNote = document.getElementById('time-optional-note').value.trim();
    
    if (editingEntryId) {
        const entryIndex = entries.findIndex(e => e.id === editingEntryId);
        if (entryIndex !== -1) {
            entries[entryIndex] = {
                ...entries[entryIndex],
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
        
        entries.unshift(entry);
    }
    
    saveData();
    renderTimeline();
    
    alert(`✅ Time event ${editingEntryId ? 'updated' : 'created'}!`);
    toggleTimer();
    
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

function selectTrackItem(item) {
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

function saveTrackEvent() {
    if (!selectedTrackItem) return;
    
    const timestamp = getTimestampFromInput('datetime-input-track');
    const optionalNote = document.getElementById('track-optional-note').value.trim();
    
    if (editingEntryId) {
        const entryIndex = entries.findIndex(e => e.id === editingEntryId);
        if (entryIndex !== -1) {
            entries[entryIndex] = {
                ...entries[entryIndex],
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
        
        entries.unshift(entry);
        alert(`✅ Tracked: ${selectedTrackItem}`);
    }
    
    saveData();
    renderTimeline();
    toggleTrack();
    
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

function saveSpent() {
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
        const entryIndex = entries.findIndex(e => e.id === editingEntryId);
        if (entryIndex !== -1) {
            entries[entryIndex] = {
                ...entries[entryIndex],
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
        
        entries.unshift(entry);
        alert(`✅ Spent tracked: €${amount.toFixed(2)}`);
    }
    
    saveData();
    renderTimeline();
    toggleSpent();
    document.getElementById('delete-spent-btn').classList.add('hidden');
}

// Delete entry
function deleteCurrentEntry() {
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
        entries = entries.filter(e => e.id !== editingEntryId);
        
        if (currentUser && !isOfflineMode) {
            deleteEntryFromFirebase(editingEntryId); // Función de firebase-config.js
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

function closePreview(event) {
    if (event && event.target.id !== 'preview-modal') return;
    const modal = document.getElementById('preview-modal');
    modal.classList.remove('show');
    document.getElementById('preview-body').innerHTML = '';
}

// CAMBIO: openSettings() movido a settings-manager.js

// Show image preview
function showImageInModal(entryId, imageIndex) {
    const entry = entries.find(e => e.id == entryId);
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
function toggleReadMore(id) {
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

function toggleDay(dayKey) {
    const content = document.getElementById(`day-content-${dayKey}`);
    const chevron = document.getElementById(`chevron-${dayKey}`);
    
    content.classList.toggle('expanded');
    chevron.classList.toggle('expanded');
}

function toggleRecap(recapId) {
    const content = document.getElementById(`recap-content-${recapId}`);
    const chevron = document.getElementById(`chevron-recap-${recapId}`);
    
    content.classList.toggle('hidden');
    chevron.classList.toggle('expanded');
}


// Show image in modal
function showImageInModal(entryId, imageIndex) {
    const entry = entries.find(e => e.id == entryId);
    if (!entry || !entry.images || !entry.images[imageIndex]) {
        console.error('Image not found');
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


// Toggle note expansion
function toggleNote(entryId) {
    const noteDiv = document.getElementById('note-' + entryId);
    const btn = event.target;
    
    if (noteDiv) {
        if (noteDiv.classList.contains('expanded')) {
            noteDiv.classList.remove('expanded');
            btn.textContent = 'Read more';
        } else {
            noteDiv.classList.add('expanded');
            btn.textContent = 'Read less';
        }
    }
}

function renderTimeline() {
    const container = document.getElementById('timeline-container');
    const emptyState = document.getElementById('empty-state');
    const footer = document.getElementById('footer');

    if (entries.length === 0) {
        container.innerHTML = '';
        emptyState.classList.remove('hidden');
        footer.style.display = 'none';
        return;
    }

    emptyState.classList.add('hidden');
    footer.style.display = 'flex';

    const groupedByDay = {};
    entries.forEach(entry => {
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
    entries.forEach(entry => {
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
                        mapEl.onclick = () => previewEntry(entry.id);
                    } catch (e) {
                        console.error('Error creating mini map:', e);
                        mapEl.innerHTML = "Map failed";
                    }
                }
            }, 100);
        }
    });
}

// Export functions
function exportCSV() {
    openExportModal('csv');
}

function exportICS() {
    openExportModal('ical');
}

function openExportModal(format) {
    let modal = document.getElementById('export-modal');
    if (!modal) {
        createExportModal(); // Crear si no existe
        modal = document.getElementById('export-modal');
    }
    
    // Configurar el modal según el formato
    document.getElementById('export-format-type').textContent = format === 'csv' ? 'CSV' : 'iCal';
    document.getElementById('export-modal').classList.add('show');
    
    // Configurar opciones de iCal
    const icalOptions = document.getElementById('ical-options');
    if (format === 'ical') {
        icalOptions.style.display = 'block';
    } else {
        icalOptions.style.display = 'none';
    }
}

function createExportModal() {
    const modalHTML = `
        <div id="export-modal" class="preview-modal" onclick="closeExportModal(event)">
            <div class="preview-content" onclick="event.stopPropagation()">
                <div class="mac-title-bar">
                    <span>📤 Export <span id="export-format-type">CSV</span></span>
                    <button onclick="closeExportModal()" style="background: #fff; border: 2px solid #000; padding: 2px 8px; cursor: pointer;">✕</button>
                </div>
                <div class="mac-content">
                    <h3 style="margin-bottom: 16px;">Select Export Range</h3>
                    
                    <div style="margin-bottom: 20px;">
                        <label class="mac-label">
                            <input type="radio" name="export-range" value="all" checked onchange="updateExportOptions()"> 
                            Export All Entries
                        </label>
                    </div>
                    
                    <div style="margin-bottom: 20px;">
                        <label class="mac-label">
                            <input type="radio" name="export-range" value="month" onchange="updateExportOptions()"> 
                            Export Specific Month
                        </label>
                        <div id="month-selector" style="margin-left: 20px; margin-top: 8px; display: none;">
                            <input type="month" class="mac-input" id="export-month" style="max-width: 200px;">
                        </div>
                    </div>
                    
                    <div style="margin-bottom: 20px;">
                        <label class="mac-label">
                            <input type="radio" name="export-range" value="day" onchange="updateExportOptions()"> 
                            Export Specific Day
                        </label>
                        <div id="day-selector" style="margin-left: 20px; margin-top: 8px; display: none;">
                            <input type="date" class="mac-input" id="export-day" style="max-width: 200px;">
                        </div>
                    </div>
                    
                    <div id="ical-options" style="display: none;">
                        <hr style="margin: 20px 0; border: 1px solid #ddd;">
                        <h3 style="margin-bottom: 16px;">iCal Options</h3>
                        <div style="margin-bottom: 20px;">
                            <label class="mac-label">
                                <input type="radio" name="ical-grouping" value="individual" checked> 
                                Each event as separate calendar entry
                            </label>
                        </div>
                        <div style="margin-bottom: 20px;">
                            <label class="mac-label">
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
    
    // Establecer fechas por defecto
    const today = new Date();
    const monthInput = document.getElementById('export-month');
    const dayInput = document.getElementById('export-day');
    
    monthInput.value = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    dayInput.value = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
}

function updateExportOptions() {
    const range = document.querySelector('input[name="export-range"]:checked').value;
    
    document.getElementById('month-selector').style.display = range === 'month' ? 'block' : 'none';
    document.getElementById('day-selector').style.display = range === 'day' ? 'block' : 'none';
}

function closeExportModal(event) {
    if (event && event.target.id !== 'export-modal') return;
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
    
    closeExportModal();
}

function exportCSVData(data, suffix) {
    const headers = ['ID', 'Timestamp', 'Type', 'Note', 'Optional Note', 'Mood', 'Location', 'Weather', 'Activity', 'Duration (min)', 'Spent Amount', 'Images (count)', 'Audio (exists)', 'Coords (lat)', 'Coords (lon)', 'Recap Rating', 'Recap Highlights'];
    const rows = data.map(e => {
        let type = 'Crumb';
        if (e.isTimedActivity) type = 'Time';
        if (e.isQuickTrack) type = 'Track';
        if (e.isSpent) type = 'Spent';
        if (e.type === 'recap') type = 'Recap';
        
        return [
            e.id,
            e.timestamp,
            type,
            e.note || '',
            e.optionalNote || '',
            e.mood ? `${e.mood.emoji} ${e.mood.label}` : '',
            e.location || '',
            e.weather || '',
            e.activity || '',
            e.duration || '',
            e.spentAmount || '',
            e.images ? e.images.length : 0,
            e.audio ? 'Yes' : 'No',
            e.coords ? e.coords.lat : '',
            e.coords ? e.coords.lon : '',
            e.rating || '',
            e.highlights ? e.highlights.join('; ') : ''
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
                let text = `${time}: ${e.note || e.activity || 'Event'}`;
                if (e.duration) text += ` (${e.duration} min)`;
                if (e.optionalNote) text += `\\n  - Note: ${e.optionalNote}`;
                if (e.type === 'recap') text = `${time}: 🌟 DAY RECAP (Rating: ${e.rating}/10)`;
                return text;
            }).join('\\n\\n');
            
            return `BEGIN:VEVENT
UID:${dayKey}@breadcrumbs
DTSTAMP:${dateStr}
DTSTART;VALUE=DATE:${dayKey.replace(/-/g, '')}
SUMMARY:Breadcrumbs - ${dayEntries.length} events
DESCRIPTION:${description.replace(/\n/g, '\\n')}
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
                 endDate.setMinutes(endDate.getMinutes() + 15); // 15 min para recap
            } else {
                endDate.setMinutes(endDate.getMinutes() + 30); // 30 min por defecto
            }
            const endDateStr = endDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
            
            let summary = 'Breadcrumb';
            if (e.isTimedActivity) summary = `⏱️ ${e.activity}`;
            else if (e.isQuickTrack) summary = `📊 ${e.note}`;
            else if (e.isSpent) summary = `💰 ${e.note} (€${e.spentAmount})`;
            else if (e.type === 'recap') summary = `🌟 Day Recap (Rating: ${e.rating}/10)`;
            else if (e.note) summary = `📝 ${e.note.substring(0, 50)}${e.note.length > 50 ? '...' : ''}`;
            
            let description = (e.note || '');
            if (e.optionalNote) description += `\\n\\nOptional Note: ${e.optionalNote}`;
            if (e.location) description += `\\n\\n📍 Location: ${e.location}`;
            if (e.weather) description += `\\n☁️ Weather: ${e.weather}`;
            if (e.type === 'recap') {
                description = `Reflection: ${e.reflection || 'N/A'}\\nHighlights:\\n${(e.highlights || []).map(h => `- ${h}`).join('\\n')}`;
            }

            return `BEGIN:VEVENT
UID:${e.id}@breadcrumbs
DTSTAMP:${dateStr}
DTSTART:${dateStr}
DTEND:${endDateStr}
SUMMARY:${summary.replace(/\n/g, ' ')}
DESCRIPTION:${description.replace(/\n/g, '\\n')}
LOCATION:${e.location || ''}
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
    const breadcrumbs = entries.filter(e => !e.isTimedActivity && !e.isQuickTrack && !e.isSpent && e.type !== 'recap').length;
    const timeEvents = entries.filter(e => e.isTimedActivity).length;
    const trackEvents = entries.filter(e => e.isQuickTrack).length;
    const spentEvents = entries.filter(e => e.isSpent).length;
    const recapEvents = entries.filter(e => e.type === 'recap').length;
    
    const totalSpent = entries
        .filter(e => e.isSpent)
        .reduce((sum, e) => sum + (e.spentAmount || 0), 0);
    
    const totalMinutes = entries
        .filter(e => e.isTimedActivity)
        .reduce((sum, e) => sum + (e.duration || 0), 0);
    
    const totalHours = (totalMinutes / 60).toFixed(1);
    
    // Actividades más frecuentes
    const activityCount = {};
    entries.filter(e => e.isTimedActivity).forEach(e => {
        activityCount[e.activity] = (activityCount[e.activity] || 0) + 1;
    });
    const topActivity = Object.keys(activityCount).length > 0 
        ? Object.keys(activityCount).reduce((a, b) => activityCount[a] > activityCount[b] ? a : b)
        : 'None';
    
    // Tracks más frecuentes
    const trackCount = {};
    entries.filter(e => e.isQuickTrack).forEach(e => {
        trackCount[e.note] = (trackCount[e.note] || 0) + 1;
    });
    const topTrack = Object.keys(trackCount).length > 0
        ? Object.keys(trackCount).reduce((a, b) => trackCount[a] > trackCount[b] ? a : b)
        : 'None';
    
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
            <div class="stat-number">${timeEvents}</div>
            <div class="stat-label">⏱️ Time Events</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${trackEvents}</div>
            <div class="stat-label">📊 Tracked Items</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${spentEvents}</div>
            <div class="stat-label">💰 Expenses</div>
        </div>
         <div class="stat-card">
            <div class="stat-number">${recapEvents}</div>
            <div class="stat-label">🌟 Recaps</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">€${totalSpent.toFixed(2)}</div>
            <div class="stat-label">Total Spent</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${totalHours}h</div>
            <div class="stat-label">Hours Tracked</div>
        </div>
        <div class="stat-card">
            <div class="stat-number" style="font-size: 18px;">${topActivity}</div>
            <div class="stat-label">Top Activity</div>
        </div>
        <div class="stat-card">
            <div class="stat-number" style="font-size: 16px;">${topTrack}</div>
            <div class="stat-label">Most Tracked</div>
        </div>
    `;
    
    document.getElementById('stats-content').innerHTML = statsHTML;
}

function closeStats(event) {
    if (event && event.target.id !== 'stats-modal') return;
    const modal = document.getElementById('stats-modal');
    if (modal) {
        modal.classList.remove('show');
    }
}
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

function showRecapForm() {
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

function closeRecapForm() {
    document.getElementById('recap-form').classList.add('hidden');
    editingEntryId = null; // Asegurarse de limpiar el ID de edición
}

async function buscarBSO() {
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

function selectTrack(trackName, artistName, url, artwork) {
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
        selectTrack(entry.track.name, entry.track.artist, entry.track.url, entry.track.artwork);
    }
    
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
        const entryIndex = entries.findIndex(e => e.id === editingEntryId);
        if (entryIndex !== -1) {
            entries[entryIndex] = recapEntry;
        }
        editingEntryId = null;
        alert('🌟 Recap updated!');
    } else {
        entries.unshift(recapEntry);
        alert('🌟 Recap saved!');
    }
    
    saveData();
    renderTimeline();
    closeRecapForm();
}

// ===== FAB MENU =====

let fabMenuOpen = false;

function toggleFabMenu() {
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
        toggleFabMenu();
    }
}

// Modificar las funciones toggle para cerrar el menú
// (Las funciones toggleForm, etc. ya están definidas arriba)
// (Los onclick en el HTML ya llaman a closeFabMenu())

