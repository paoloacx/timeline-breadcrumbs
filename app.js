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

    // Actualizar UI al cargar
    updateTimerOptions();
    updateTrackOptions();
    renderMoodSelector();
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
    // Esta función es llamada por firebase-config.js, 
    // pero la lógica de sync/refresh está en refreshApp()
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
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    
    const dateTimeString = `${year}-${month}-${day}T${hours}:${minutes}`;
    document.getElementById(inputId).value = dateTimeString;
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
        locationInput.value = '';
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

    const map = L.map(containerId).setView([lat, lon], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        maxZoom: 19
    }).addTo(map);

    L.marker([lat, lon]).addTo(map);

    setTimeout(() => {
        map.invalidateSize();
    }, 100);
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
            <img src="${img}" alt="">
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
                    <source src="${currentAudio}" type="audio/webm">
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
function renderMoodSelector() {
    const container = document.getElementById('mood-selector');
    if (!container) return;
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
    
    saveSettingsToStorage();
    if (currentUser && !isOfflineMode) {
        saveSettingsToFirebase();
    }
    
    renderMoodSelector();
    toggleMoodConfig();
    alert('✅ Configuration saved');
}

// Save/Edit entry functions
function saveEntry() {
    const note = document.getElementById('note-input').value.trim();
    if (!note) {
        alert('Please write a note');
        return;
    }

    const moodData = selectedMood !== null ? moods[selectedMood] : null;
    const timestamp = getTimestampFromInput('datetime-input');

    if (editingEntryId) {
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
                mood: moodData,
                // Asegurarse de no sobreescribir flags
                isTimedActivity: entries[entryIndex].isTimedActivity,
                isQuickTrack: entries[entryIndex].isQuickTrack,
                isSpent: entries[entryIndex].isSpent,
                type: entries[entryIndex].type
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
            mood: moodData,
            type: 'crumb' // Añadir tipo
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

    // ARREGLO: Añadir comprobación para 'recap'
    if (entry.type === 'recap') {
        editRecapEvent(entry);
        return;
    }

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

    // Es un 'crumb' normal
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
    
    // Ocultar otros formularios y mostrar el de crumb
    document.getElementById('timer-window').classList.add('hidden');
    document.getElementById('track-window').classList.add('hidden');
    document.getElementById('spent-window').classList.add('hidden');
    document.getElementById('recap-form').classList.add('hidden');
    const formWindow = document.getElementById('form-window');
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
    
    // Seleccionar opciones
    updateTimerOptions(); // Asegura que los botones existan
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
    
    checkTimerReady();
    
    // Ocultar otros formularios y mostrar el de timer
    document.getElementById('form-window').classList.add('hidden');
    document.getElementById('track-window').classList.add('hidden');
    document.getElementById('spent-window').classList.add('hidden');
    document.getElementById('recap-form').classList.add('hidden');
    const timerWindow = document.getElementById('timer-window');
    const createBtn = document.getElementById('create-time-btn');
    createBtn.textContent = '💾 Update Event';
    document.getElementById('delete-time-btn').classList.remove('hidden');
    
    timerWindow.classList.remove('hidden');
    timerWindow.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function selectDuration(minutes) {
    selectedDuration = minutes;
    const options = document.querySelectorAll('.duration-option');
    options.forEach(el => {
        el.classList.remove('selected');
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
                isTimedActivity: true, // Asegurar flag
                type: 'time' // Añadir tipo
            };
        }
    } else {
        const entry = {
            id: Date.now(),
            timestamp: timestamp,
            note: `${selectedActivity} - ${selectedDuration} minutes`,
            activity: selectedActivity,
            duration: selectedDuration,
            isTimedActivity: true,
            optionalNote: optionalNote,
            type: 'time' // Añadir tipo
        };
        
        entries.unshift(entry);
    }
    
    saveData();
    renderTimeline();
    
    alert(`✅ Time event ${editingEntryId ? 'updated' : 'created'}!`);
    toggleTimer();
    
    editingEntryId = null; // Limpiar
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
function renderTrackSelector() {
    const container = document.getElementById('track-selector');
    if (!container) return;
    const allItems = [...trackItems.meals, ...trackItems.tasks];
    
    container.innerHTML = allItems.map((item, index) => `
        <div class="activity-option" data-item="${item}" onclick="selectTrackItem('${item}')">
            ${item}
        </div>
    `).join('');
}

function selectTrackItem(item) {
    selectedTrackItem = item;
    document.querySelectorAll('#track-selector .activity-option').forEach(el => {
        el.classList.remove('selected');
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
    
    renderTrackSelector();
    
    document.querySelectorAll('#track-selector .activity-option').forEach(el => {
        if (el.dataset.item === selectedTrackItem) {
            el.classList.add('selected');
        }
    });
    
    document.getElementById('save-track-btn').disabled = false;
    document.getElementById('save-track-btn').textContent = '💾 Update Track';
    document.getElementById('delete-track-btn').classList.remove('hidden');
    
    // Ocultar otros formularios y mostrar el de track
    document.getElementById('form-window').classList.add('hidden');
    document.getElementById('timer-window').classList.add('hidden');
    document.getElementById('spent-window').classList.add('hidden');
    document.getElementById('recap-form').classList.add('hidden');
    const trackWindow = document.getElementById('track-window');
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
                isQuickTrack: true, // Asegurar flag
                type: 'track' // Añadir tipo
            };
        }
        alert(`✅ Track updated: ${selectedTrackItem}`);
    } else {
        const entry = {
            id: Date.now(),
            timestamp: timestamp,
            note: selectedTrackItem,
            isQuickTrack: true,
            optionalNote: optionalNote,
            type: 'track' // Añadir tipo
        };
        
        entries.unshift(entry);
        alert(`✅ Tracked: ${selectedTrackItem}`);
    }
    
    saveData();
    renderTimeline();
    toggleTrack();
    
    editingEntryId = null; // Limpiar
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
    
    // Ocultar otros formularios y mostrar el de spent
    document.getElementById('form-window').classList.add('hidden');
    document.getElementById('timer-window').classList.add('hidden');
    document.getElementById('track-window').classList.add('hidden');
    document.getElementById('recap-form').classList.add('hidden');
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

    if (isNaN(amount) || amount <= 0) {
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
                isSpent: true, // Asegurar flag
                type: 'spent' // Añadir tipo
            };
        }
        alert(`✅ Spent updated: €${amount.toFixed(2)}`);
    } else {
        const entry = {
            id: Date.now(),
            timestamp: timestamp,
            note: description,
            spentAmount: amount,
            isSpent: true,
            type: 'spent' // Añadir tipo
        };
        
        entries.unshift(entry);
        alert(`✅ Spent tracked: €${amount.toFixed(2)}`);
    }
    
    saveData();
    renderTimeline();
    toggleSpent();
    
    editingEntryId = null; // Limpiar
    document.getElementById('delete-spent-btn').classList.add('hidden');
}

// Delete entry
function deleteCurrentEntry() {
    if (!editingEntryId) return;
    
    if (confirm('Delete this entry?')) {
        
        if (currentUser && !isOfflineMode) {
            deleteEntryFromFirebase(editingEntryId);
        }

        entries = entries.filter(e => e.id !== editingEntryId);
        
        saveData(); // Guardar después de eliminar de Firebase
        renderTimeline();
        
        // Close all windows
        document.getElementById('form-window').classList.add('hidden');
        document.getElementById('timer-window').classList.add('hidden');
        document.getElementById('track-window').classList.add('hidden');
        document.getElementById('spent-window').classList.add('hidden');
        document.getElementById('recap-form').classList.add('hidden');
        
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
            <div style="margin-top: 8px; line-height: 1.6; white-space: pre-wrap;">${entry.note}</div>
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
                    <source src="${entry.audio}" type="audio/webm">
                </audio>
            </div>
        ` : ''}
        
        ${entry.images && entry.images.length > 0 ? `
            <div style="margin-bottom: 16px;">
                <strong>Images:</strong>
                <div class="preview-images-full">
                    ${entry.images.map(img => `
                        <img src="${img}" class="preview-image-full" onclick="event.stopPropagation(); showImageInModal('${entry.id}', ${entry.images.indexOf(img)});">
                    `).join('')}
                </div>
            </div>
        ` : ''}
        
        ${entry.isTimedActivity ? `
            <div style="margin-bottom: 16px;">
                <strong>Activity:</strong> ${entry.activity} (${entry.duration} minutes)
            </div>
            ${entry.optionalNote ? `
                <div style="margin-bottom: 16px;">
                    <strong>Optional Note:</strong>
                    <div style="margin-top: 8px; line-height: 1.6; white-space: pre-wrap;">${entry.optionalNote}</div>
                </div>
            ` : ''}
        ` : ''}

        ${entry.isQuickTrack && entry.optionalNote ? `
            <div style="margin-bottom: 16px;">
                <strong>Optional Note:</strong>
                <div style="margin-top: 8px; line-height: 1.6; white-space: pre-wrap;">${entry.optionalNote}</div>
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
                const map = L.map('preview-map-modal').setView([entry.coords.lat, entry.coords.lon], 13);
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '© OpenStreetMap'
                }).addTo(map);
                L.marker([entry.coords.lat, entry.coords.lon]).addTo(map);
                
                setTimeout(() => map.invalidateSize(), 100);
            }
        }, 100);
    }
}

function closePreview(event) {
    if (event && event.target.id !== 'preview-modal' && !event.target.classList.contains('preview-modal')) return;
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
    
    body.innerHTML = `
        <div style="text-align: center; padding: 20px;">
            <img src="${entry.images[imageIndex]}" style="max-width: 100%; max-height: 80vh; border: 2px solid #000;">
        </div>
    `;
    
    modal.classList.add('show');
}


function closeSettings(event) {
    if (event && event.target.id !== 'settings-modal' && !event.target.classList.contains('settings-modal')) return;
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
    }).filter(a => a.trim() !== ''); // Filtrar vacíos

    trackItems.meals = trackItems.meals.map((_, index) => {
        const val = document.getElementById(`meal-${index}`);
        return val ? val.value : 'Meal';
    }).filter(m => m.trim() !== ''); // Filtrar vacíos

    trackItems.tasks = trackItems.tasks.map((_, index) => {
        const val = document.getElementById(`task-${index}`);
        return val ? val.value : 'Task';
    }).filter(t => t.trim() !== ''); // Filtrar vacíos

    saveSettingsToStorage();
    
    if (currentUser && !isOfflineMode) {
        saveSettingsToFirebase();
    }
    
    updateTimerOptions();
    updateTrackOptions();
    closeSettings();
    alert('✅ Settings saved!');
}

function updateTimerOptions() {
    const container = document.getElementById('duration-selector');
    if (!container) return;
    
    container.innerHTML = timeDurations.map(duration => `
        <div class="duration-option" data-duration="${duration}" onclick="selectDuration(${duration})">
            ${duration < 60 ? duration + ' min' : (duration / 60) + ' hour' + (duration > 60 ? 's' : '')}
        </div>
    `).join('');

    const actContainer = document.getElementById('activity-selector');
    if (!actContainer) return;
    
    actContainer.innerHTML = timeActivities.map(activity => `
        <div class="activity-option" data-activity="${activity}" onclick="selectActivity('${activity}')">
            ${activity}
        </div>
    `).join('');
}

function updateTrackOptions() {
    renderTrackSelector();
}

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
    return date.toLocaleDateString('en-US', { // 'en-US' es más compatible
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


// Toggle note expansion (unificada)
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

    const html = `
        <div class="timeline">
            <div class="timeline-line"></div>
            ${Object.keys(groupedByDay).sort().reverse().map(dayKey => { // Asegurar orden
                const dayEntries = groupedByDay[dayKey];
                const firstEntry = dayEntries[0];
                
                // Separar recaps de otros eventos
                const recaps = dayEntries.filter(e => e.type === 'recap');
                const regularEntries = dayEntries.filter(e => e.type !== 'recap');
                
                return `
                    <div class="day-block">
                        <div class="day-header" onclick="toggleDay('${dayKey}')">
                            <span>${formatDate(firstEntry.timestamp)}</span>
                            <span class="chevron expanded" id="chevron-${dayKey}">▼</span>
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
                                            <div style="display: flex; align-items: center; gap: 12px; margin-top: 8px; padding: 12px; border: 2px solid #000; background: #f9f9f9;">
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
                        
                        <div class="day-content expanded" id="day-content-${dayKey}">
                            ${regularEntries.map(entry => {
                                const heightStyle = entry.isTimedActivity && entry.duration ? `min-height: ${Math.min(150 + entry.duration * 0.5, 300)}px;` : '';
                                const trackClass = entry.isQuickTrack ? 'track-event' : '';
                                const spentClass = entry.isSpent ? 'spent-event' : '';
                                const timeClass = entry.isTimedActivity ? 'time-event' : '';
                                
                                return `
                                <div class="breadcrumb-entry ${timeClass} ${trackClass} ${spentClass}" style="${heightStyle}">
                                    <button class="mac-button edit-button" onclick="editEntry(${entry.id})">✏️ Edit</button>
                                    
                                    ${entry.isTimedActivity ? 
                                        `<div class="breadcrumb-time">⏰ ${formatTime(entry.timestamp)} - ${calculateEndTime(entry.timestamp, entry.duration)}</div>
                                        <div class="activity-label">${entry.activity}</div>
                                        <div style="font-size: 13px; color: #666; margin-top: 8px;">Duration: ${entry.duration} minutes</div>
                                        ${entry.optionalNote ? `
                                            <div class="optional-note" id="note-${entry.id}">${entry.optionalNote}</div>
                                            ${entry.optionalNote.length > 200 ? `<button class="read-more-btn" id="read-more-${entry.id}" onclick="toggleNote(${entry.id})">Read more</button>` : ''}
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
                                        ${entry.optionalNote.length > 200 ? `<button class="read-more-btn" id="read-more-${entry.id}" onclick="toggleNote(${entry.id})">Read more</button>` : ''}
                                    ` : ''}
                                    
                                    ${!entry.isTimedActivity && !entry.isQuickTrack ? `
                                        <div style="display: flex; align-items: flex-start; gap: 12px; margin-bottom: 8px;">
                                            ${entry.mood ? `<span class="mood-display">${entry.mood.emoji}</span>` : ''}
                                            <div style="flex: 1;">
                                                <div class="breadcrumb-note" id="note-${entry.id}">${entry.note}</div>
                                                ${entry.note && entry.note.length > 200 ? `<button class="read-more-btn" id="read-more-${entry.id}" onclick="toggleNote(${entry.id})">Read more</button>` : ''}
                                            </div>
                                        </div>
                                    ` : ''}
                                    
                                    ${entry.weather || entry.location ? `
                                        <div class="breadcrumb-meta">
                                            ${entry.weather ? `${entry.weather}` : ''}
                                            ${entry.weather && entry.location ? ` • 📍 ${entry.location}` : ''}
                                            ${!entry.weather && entry.location ? `📍 ${entry.location}` : ''}
                                        </div>
                                    ` : ''}
                                    
                                    ${entry.audio ? `
                                        <div style="margin-top: 12px; margin-bottom: 12px;">
                                            <audio controls style="width: 100%; max-width: 300px;">
                                                <source src="${entry.audio}" type="audio/webm">
                                            </audio>
                                        </div>
                                    ` : ''}
                                    
                                    <div class="breadcrumb-preview">
                                        ${entry.images && entry.images.length > 0 ? entry.images.map(img => `
                                            <img src="${img}" class="preview-image-thumb" onclick="event.stopPropagation(); showImageInModal('${entry.id}', ${entry.images.indexOf(img)});">
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
                    }
                }
            }, 100);
        }
    });
}

// Export functions
function exportCSV() {
    const headers = ['Date and Time', 'Type', 'Note', 'Activity', 'Duration (min)', 'Location', 'Weather', 'Mood', 'Spent', 'Optional Note', 'Images'];
    const rows = entries.map(e => [
        new Date(e.timestamp).toLocaleString(),
        e.type || (e.isTimedActivity ? 'time' : (e.isQuickTrack ? 'track' : (e.isSpent ? 'spent' : 'crumb'))),
        e.note || '',
        e.activity || '',
        e.duration || '',
        e.location || '',
        e.weather || '',
        e.mood ? `${e.mood.emoji} ${e.mood.label}` : '',
        e.spentAmount ? `€${e.spentAmount.toFixed(2)}` : '',
        e.optionalNote || '',
        e.images ? e.images.length : 0
    ]);
    
    const csv = [headers, ...rows].map(row => 
        row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `breadcrumbs-export.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

function exportICS() {
    const icsEvents = entries.map(e => {
        const date = new Date(e.timestamp);
        const dateStr = date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        
        let endDate = new Date(date);
        if (e.duration) {
            endDate.setMinutes(endDate.getMinutes() + e.duration);
        } else {
            endDate.setMinutes(endDate.getMinutes() + 15); // 15 min por defecto
        }
        const endDateStr = endDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        
        const summary = e.activity || e.note?.substring(0, 50) || 'Breadcrumb Event';
        let description = (e.note || '');
        if (e.optionalNote) description += `\\nNote: ${e.optionalNote}`;
        if (e.location) description += `\\nLocation: ${e.location}`;
        if (e.weather) description += `\\nWeather: ${e.weather}`;
        if (e.spentAmount) description += `\\nSpent: €${e.spentAmount.toFixed(2)}`;
        
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
    a.download = `breadcrumbs-export.ics`;
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
    const breadcrumbs = entries.filter(e => e.type === 'crumb' || (!e.type && !e.isTimedActivity && !e.isQuickTrack && !e.isSpent)).length;
    const timeEvents = entries.filter(e => e.isTimedActivity).length;
    const trackEvents = entries.filter(e => e.isQuickTrack).length;
    const spentEvents = entries.filter(e => e.isSpent).length;
    
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
    if (event && event.target.id !== 'stats-modal' && !event.target.classList.contains('stats-modal')) return;
    const modal = document.getElementById('stats-modal');
    if (modal) {
        modal.classList.remove('show');
    }
}
// Initialize app (en firebase-config.js)
// loadData();
// loadSettings();

// ===== RECAP FUNCTIONS =====

function showRecapForm() {
    // Ocultar otros formularios
    document.getElementById('form-window').classList.add('hidden');
    document.getElementById('timer-window').classList.add('hidden');
    document.getElementById('track-window').classList.add('hidden');
    document.getElementById('spent-window').classList.add('hidden');
    
    document.getElementById('recap-form').classList.remove('hidden');
    
    // Establecer fecha actual
    setCurrentDateTime('datetime-input-recap');
    
    // Limpiar formulario (excepto si se está editando)
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
    
    // Listener para el slider
    const slider = document.getElementById('recap-rating');
    const valueDisplay = document.getElementById('recap-rating-value');
    
    slider.oninput = function() {
        valueDisplay.textContent = this.value;
    };

    document.getElementById('recap-form').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function closeRecapForm() {
    document.getElementById('recap-form').classList.add('hidden');
    // Limpiar formulario
    document.getElementById('recap-reflection').value = '';
    document.getElementById('recap-rating').value = '5';
    document.getElementById('recap-rating-value').textContent = '5';
    document.getElementById('recap-highlight-1').value = '';
    document.getElementById('recap-highlight-2').value = '';
    document.getElementById('recap-highlight-3').value = '';
    document.getElementById('recap-bso').value = '';
    document.getElementById('recap-bso-results').innerHTML = '';
    document.getElementById('recap-selected-track').value = '';
    editingEntryId = null; // Asegurar que se limpia
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
        // Usar un proxy simple si es necesario para CORS, pero iTunes suele ser abierto
        const url = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=5`;
        const response = await fetch(url);
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

function editRecapEvent(entry) {
    editingEntryId = entry.id;
    
    // Ocultar otros formularios
    document.getElementById('form-window').classList.add('hidden');
    document.getElementById('timer-window').classList.add('hidden');
    document.getElementById('track-window').classList.add('hidden');
    document.getElementById('spent-window').classList.add('hidden');
    
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
    
    document.getElementById('recap-bso').value = '';
    document.getElementById('recap-bso-results').innerHTML = '';
    
    if (entry.track) {
        document.getElementById('recap-selected-track').value = JSON.stringify(entry.track);
        document.getElementById('recap-bso-results').innerHTML = `
            <div style="display: flex; align-items: center; gap: 12px; padding: 12px; border: 3px solid #000; background: #f0f0f0;">
                <img src="${entry.track.artwork}" style="width: 60px; height: 60px; border: 2px solid #000;">
                <div style="flex: 1;">
                    <div style="font-weight: bold;">${entry.track.name}</div>
                    <div style="font-size: 12px; color: #666;">${entry.track.artist}</div>
                </div>
                <a href="${entry.track.url}" target="_blank" style="text-decoration: none; font-size: 20px;">🔗</a>
            </div>
        `;
    } else {
        document.getElementById('recap-selected-track').value = '';
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
    
    const highlights = [highlight1, highlight2, highlight3].filter(h => h); // Filtrar vacíos
    
    if (!reflection && highlights.length === 0) {
        alert('Please add at least one reflection or highlight');
        return;
    }
    
    if (editingEntryId) {
        const entryIndex = entries.findIndex(e => e.id === editingEntryId);
        if (entryIndex !== -1) {
            entries[entryIndex] = {
                ...entries[entryIndex], // Conservar datos antiguos
                timestamp: timestamp,
                type: 'recap',
                reflection: reflection,
                rating: parseInt(rating),
                highlights: highlights,
                track: selectedTrackJson ? JSON.parse(selectedTrackJson) : null,
                // Limpiar flags de otros tipos
                isTimedActivity: false,
                isQuickTrack: false,
                isSpent: false
            };
        }
        alert('🌟 Recap updated!');
    } else {
        const recap = {
            id: Date.now(),
            timestamp: timestamp,
            type: 'recap',
            reflection: reflection,
            rating: parseInt(rating),
            highlights: highlights,
            track: selectedTrackJson ? JSON.parse(selectedTrackJson) : null
        };
        
        entries.unshift(recap);
        alert('🌟 Recap saved!');
    }
    
    saveData();
    renderTimeline();
    closeRecapForm();
    editingEntryId = null; // Limpiar
}

// ===== FAB MENU =====

let fabMenuOpen = false;

function toggleFabMenu() {
    // ARREGLO: Selector corregido a .fab-action
    const fabActions = document.querySelectorAll('.fab-action');
    const fabIcon = document.getElementById('fab-icon');
    
    fabMenuOpen = !fabMenuOpen;
    
    if (fabMenuOpen) {
        fabIcon.textContent = '×';
        fabIcon.style.transform = 'rotate(45deg)';
        
        fabActions.forEach((wrapper, index) => {
            wrapper.closest('.fab-action-wrapper').classList.remove('hidden');
            setTimeout(() => wrapper.closest('.fab-action-wrapper').classList.add('show'), 10 + (index * 40));
        });
    } else {
        fabIcon.textContent = '+';
        fabIcon.style.transform = 'rotate(0deg)';
        
        // Invertir el orden para cerrar
        const reversedActions = Array.from(fabActions).reverse();
        reversedActions.forEach((wrapper, index) => {
            wrapper.closest('.fab-action-wrapper').classList.remove('show');
            setTimeout(() => wrapper.closest('.fab-action-wrapper').classList.add('hidden'), 300); // Dar tiempo a la anim
        });
    }
}

// Cerrar FAB menu al hacer click en una acción
function closeFabMenu() {
    if (fabMenuOpen) {
        toggleFabMenu();
    }
}

// Las funciones de toggle (toggleForm, toggleTimer, etc.) 
// y showRecapForm() son llamadas directamente desde el HTML,
// y ahora incluyen closeFabMenu() en el onclick.

// Cargar datos y settings al inicio (si no estamos esperando a Firebase)
// Esto se maneja ahora desde firebase-config.js y el DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    loadSettings();
    loadData();
});

