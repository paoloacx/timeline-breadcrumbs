// --- Variables Globales ---
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

// --- Configuración (Settings) ---
// (Estas se moverán a settings-manager.js después)
let timeDurations = [15, 30, 60, 120, 180];
let timeActivities = ['Reading', 'Sports', 'Work', 'Cleaning', 'Errands'];
let trackItems = {
    meals: ['🍳 Breakfast', '🥗 Lunch', '🍽️ Dinner', '☕ Snack'],
    tasks: ['💊 Medicine', '💧 Water', '🚶 Walk', '📞 Call']
};
const defaultMoods = [
    { emoji: '😊', label: 'Happy' },
    { emoji: '😢', label: 'Sad' },
    { emoji: '😡', label: 'Angry' },
    { emoji: '😰', label: 'Anxious' },
    { emoji: '😴', label: 'Tired' }
];
let moods = [...defaultMoods];


// --- Inicialización y Datos Principales ---

/**
 * Función de refresco/sincronización principal
 */
function refreshApp() {
    if (currentUser && !isOfflineMode) {
        loadDataFromFirebase();
        loadSettingsFromFirebase();
        alert('✅ Synced!');
    } else {
        location.reload();
    }
}

/**
 * Carga las configuraciones desde localStorage (o Firebase si está conectado)
 */
function loadSettings() {
    if (currentUser && !isOfflineMode) {
        loadSettingsFromFirebase();
        return;
    }
    const savedDurations = localStorage.getItem('time-durations');
    const savedActivities = localStorage.getItem('time-activities');
    const savedTrackItems = localStorage.getItem('track-items');
    const savedMoods = localStorage.getItem('mood-config');
    
    if (savedDurations) timeDurations = JSON.parse(savedDurations);
    if (savedActivities) timeActivities = JSON.parse(savedActivities);
    if (savedTrackItems) trackItems = JSON.parse(savedTrackItems);
    if (savedMoods) moods = JSON.parse(savedMoods);
    
    // Actualizar UI con los settings cargados
    updateTimerOptions();
    updateTrackOptions();
}

/**
 * Guarda las configuraciones en localStorage (y Firebase si está conectado)
 */
function saveSettingsToStorage() {
    localStorage.setItem('time-durations', JSON.stringify(timeDurations));
    localStorage.setItem('time-activities', JSON.stringify(timeActivities));
    localStorage.setItem('track-items', JSON.stringify(trackItems));
    localStorage.setItem('mood-config', JSON.stringify(moods));
    
    if (currentUser && !isOfflineMode) {
        saveSettingsToFirebase();
    }
}

/**
 * Carga las entradas (entries) desde localStorage (o Firebase)
 */
function loadData() {
    if (currentUser && !isOfflineMode) {
        loadDataFromFirebase();
        return;
    }
    const saved = localStorage.getItem('timeline-entries');
    if (saved) {
        entries = JSON.parse(saved);
    }
    renderTimeline();
}

/**
 * Guarda las entradas (entries) en localStorage (y Firebase)
 */
function saveData() {
    localStorage.setItem('timeline-entries', JSON.stringify(entries));
    if (!isOfflineMode && currentUser) {
        saveDataToFirebase();
    }
}

// (La función syncData() estaba duplicada con refreshApp(), así que usamos refreshApp)
// Renombramos syncData a refreshApp en el HTML si es necesario.
// Dejamos esta aquí por si algún `onclick` antiguo la llama.
function syncData() {
    refreshApp();
}


// --- Lógica de Moods (Se moverá a settings-manager.js) ---

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
    if (!panel) return;
    panel.classList.toggle('hidden');
    if (!panel.classList.contains('hidden')) {
        renderMoodConfig();
    }
}

function renderMoodConfig() {
    const container = document.getElementById('mood-config-list');
    if (!container) return;
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
    
    saveSettingsToStorage(); // Guarda en LocalStorage y Firebase
    
    renderMoodSelector();
    toggleMoodConfig();
    alert('✅ Configuration saved');
}


// --- Lógica de Timers (Se moverá a settings-manager.js) ---

function selectDuration(minutes) {
    selectedDuration = minutes;
    const options = document.querySelectorAll('.duration-option');
    options.forEach(el => {
        el.classList.remove('selected');
        const text = el.textContent.trim();
        // Lógica de selección más robusta
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
        if (el.textContent.trim() === activity) {
            el.classList.add('selected');
        }
    });
    checkTimerReady();
}

function checkTimerReady() {
    const createBtn = document.getElementById('create-time-btn');
    if (createBtn) {
        createBtn.disabled = !(selectedDuration && selectedActivity);
    }
}

function resetTimerSelections() {
    selectedDuration = null;
    selectedActivity = null;
    editingEntryId = null;
    document.querySelectorAll('.duration-option').forEach(el => el.classList.remove('selected'));
    document.querySelectorAll('#activity-selector .activity-option').forEach(el => el.classList.remove('selected'));
    
    const createBtn = document.getElementById('create-time-btn');
    if (createBtn) {
        createBtn.disabled = true;
        createBtn.textContent = 'Create Event';
    }
    
    const deleteBtn = document.getElementById('delete-time-btn');
    if (deleteBtn) {
        deleteBtn.classList.add('hidden');
    }
    
    const noteInput = document.getElementById('time-optional-note');
    if (noteInput) {
        noteInput.value = '';
    }
}

// Actualiza la UI de los selectores (se llamará desde settings-manager.js)
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
        <div class="activity-option" onclick="selectActivity('${activity}')">
            ${activity}
        </div>
    `).join('');
}


// --- Lógica de Track (Se moverá a settings-manager.js) ---

function renderTrackSelector() {
    const container = document.getElementById('track-selector');
    if (!container) return;
    
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
    const saveBtn = document.getElementById('save-track-btn');
    if (saveBtn) {
        saveBtn.disabled = false;
    }
}

// Actualiza la UI del selector (se llamará desde settings-manager.js)
function updateTrackOptions() {
    renderTrackSelector();
}


// --- Lógica de Configuración de Settings (Se moverá a settings-manager.js) ---

function renderSettingsConfig() {
    const durationsContainer = document.getElementById('time-durations-config');
    if (durationsContainer) {
        durationsContainer.innerHTML = timeDurations.map((duration, index) => `
            <div class="config-item">
                <input type="number" value="${duration}" id="duration-${index}" style="flex: 0 0 100px;">
                <span>minutes</span>
                <button class="mac-button" onclick="removeDuration(${index})" style="padding: 4px 8px; margin-left: auto;">✕</button>
            </div>
        `).join('') + `
            <button class="mac-button" onclick="addDuration()" style="margin-top: 8px;">➕ Add Duration</button>
        `;
    }

    const activitiesContainer = document.getElementById('time-activities-config');
    if (activitiesContainer) {
        activitiesContainer.innerHTML = timeActivities.map((activity, index) => `
            <div class="config-item">
                <input type="text" value="${activity}" id="activity-${index}">
                <button class="mac-button" onclick="removeActivity(${index})" style="padding: 4px 8px;">✕</button>
            </div>
        `).join('') + `
            <button class="mac-button" onclick="addActivity()" style="margin-top: 8px;">➕ Add Activity</button>
        `;
    }

    const trackContainer = document.getElementById('track-items-config');
    if (trackContainer) {
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
    });

    timeActivities = timeActivities.map((_, index) => {
        const val = document.getElementById(`activity-${index}`);
        return val ? val.value : 'Activity';
    });

    trackItems.meals = trackItems.meals.map((_, index) => {
        const val = document.getElementById(`meal-${index}`);
        return val ? val.value : 'Meal';
    });

    trackItems.tasks = trackItems.tasks.map((_, index) => {
        const val = document.getElementById(`task-${index}`);
        return val ? val.value : 'Task';
    });

    saveSettingsToStorage(); // Guarda en LocalStorage y Firebase
    
    updateTimerOptions();
    updateTrackOptions();
    forceCloseSettings(); // Cierra el modal de settings
    alert('✅ Settings saved!');
}


// --- Lógica de Exportación (Se moverá a data-tools.js) ---

function exportCSV() {
    openExportModal('csv');
}

function exportICS() {
    openExportModal('ical');
}

function openExportModal(format) {
    let modal = document.getElementById('export-modal');
    if (!modal) {
        createExportModal();
        modal = document.getElementById('export-modal');
    }
    
    document.getElementById('export-format-type').textContent = format.toUpperCase();
    modal.classList.add('show');
    
    // Ocultar/mostrar opciones de iCal
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
                    <button onclick="forceCloseExportModal()" style="background: #fff; border: 2px solid #000; padding: 2px 8px; cursor: pointer;">✕</button>
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
                    
                    <hr style="margin: 20px 0; border: 1px solid #ddd;">
                    
                    <div id="ical-options" style="display: none;">
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
    forceCloseExportModal();
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
    const headers = ['Date and Time', 'Note', 'Type', 'Activity', 'Duration (min)', 'Optional Note', 'Location', 'Weather', 'Mood', 'Spent', 'Images', 'Audio', 'Recap Rating', 'Recap Reflection', 'Recap Highlight 1', 'Recap Highlight 2', 'Recap Highlight 3', 'Recap Track'];
    const rows = data.map(e => [
        new Date(e.timestamp).toLocaleString(),
        e.note || '',
        e.type || (e.isTimedActivity ? 'Time' : (e.isQuickTrack ? 'Track' : (e.isSpent ? 'Spent' : 'Crumb'))),
        e.activity || '',
        e.duration || '',
        e.optionalNote || '',
        e.location || '',
        e.weather || '',
        e.mood ? `${e.mood.emoji} ${e.mood.label}` : '',
        e.spentAmount ? `€${e.spentAmount.toFixed(2)}` : '',
        e.images ? e.images.length : 0,
        e.audio ? 'Yes' : 'No',
        e.rating || '',
        e.reflection || '',
        e.highlights ? e.highlights[0] || '' : '',
        e.highlights ? e.highlights[1] || '' : '',
        e.highlights ? e.highlights[2] || '' : '',
        e.track ? `${e.track.name} - ${e.track.artist}` : ''
    ]);
    
    const csv = [headers, ...rows].map(row => 
        row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ).join('\n');
    
    downloadFile(csv, `breadcrumbs-${suffix}.csv`, 'text/csv;charset=utf-8;');
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
            const dateStr = date.toISOString().replace(/[-:.]/g, '').substring(0, 15) + 'Z';
            
            // Crear descripción con todos los eventos del día
            const description = dayEntries.map(e => {
                const time = new Date(e.timestamp).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
                let text = `${time}: ${e.note || e.activity || 'Event'}`;
                if (e.duration) text += ` (${e.duration} min)`;
                if (e.optionalNote) text += ` - ${e.optionalNote}`;
                return text;
            }).join('\\n');
            
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
            const dateStr = date.toISOString().replace(/[-:.]/g, '').substring(0, 15) + 'Z';
            
            let endDate = new Date(date);
            if (e.duration) {
                endDate.setMinutes(endDate.getMinutes() + e.duration);
            } else {
                endDate.setMinutes(endDate.getMinutes() + 30); // 30 min por defecto
            }
            const endDateStr = endDate.toISOString().replace(/[-:.]/g, '').substring(0, 15) + 'Z';
            
            const summary = e.activity || e.note?.substring(0, 50) || 'Breadcrumb Event';
            const description = (e.note || '') + (e.optionalNote ? `\\nNote: ${e.optionalNote}` : '') + (e.location ? `\\nLocation: ${e.location}` : '') + (e.weather ? `\\nWeather: ${e.weather}` : '');
            
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

    downloadFile(ics, `breadcrumbs-${suffix}.ics`, 'text/calendar;charset=utf-8;');
}

/**
 * Ayudante para descargar archivos
 * @param {string} data - El contenido del archivo
 * @param {string} filename - El nombre del archivo
 * @param {string} type - El MIME type
 */
function downloadFile(data, filename, type) {
    const blob = new Blob([data], { type: type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}


// --- Lógica de Estadísticas (Se moverá a data-tools.js) ---

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
    
    const statsContent = document.getElementById('stats-content');
    if (statsContent) {
        statsContent.innerHTML = statsHTML;
    }
}

// --- Punto de entrada principal ---
// Se ejecuta cuando el DOM está listo
document.addEventListener('DOMContentLoaded', () => {
    // Cargar datos y configuraciones iniciales
    loadSettings();
    loadData();
    
    // (firebase-config.js maneja la autenticación y llama a loadData/loadSettings
    // de nuevo cuando el usuario inicia sesión)
});

