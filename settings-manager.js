// settings-manager.js

// Variables de Configuración (serán inicializadas o cargadas por app.js/firebase-config.js)
// Hacemos referencia a las variables globales definidas en app.js
// let timeDurations = [];
// let timeActivities = [];
// let trackItems = { meals: [], tasks: [] };
// let moods = [];
// const defaultMoods = []; // Referencia a la constante en app.js

// Load settings from localStorage (llamada desde app.js o firebase-config.js)
// Hacemos la función global para que pueda ser llamada desde otros archivos
window.loadSettings = function() {
    console.log("Loading settings from localStorage via settings-manager.js...");
    const savedDurations = localStorage.getItem('time-durations');
    const savedActivities = localStorage.getItem('time-activities');
    const savedTrackItems = localStorage.getItem('track-items');
    const savedMoods = localStorage.getItem('mood-config');

    // Usamos las variables globales definidas en app.js
    if (savedDurations) window.timeDurations = JSON.parse(savedDurations);
    if (savedActivities) window.timeActivities = JSON.parse(savedActivities);
    if (savedTrackItems) window.trackItems = JSON.parse(savedTrackItems);
    // Usamos || window.defaultMoods para asegurar que haya un valor inicial
    if (savedMoods) window.moods = JSON.parse(savedMoods);
    else window.moods = [...window.defaultMoods]; // Asegurar que moods tenga un valor

    // Actualizar UI al cargar (funciones definidas aquí o en ui-renderer)
    window.updateTimerOptions();
    window.updateTrackOptions();
    // renderMoodSelector() está en app.js (versión actual), necesita acceso a 'moods'
    // Si renderMoodSelector está en ui-renderer.js, asegurarse que es global
     if (typeof window.renderMoodSelector === 'function') {
        window.renderMoodSelector();
     } else if (typeof renderMoodSelector === 'function') {
         renderMoodSelector(); // Si está en app.js (versión actual)
     }
}

// Save settings to localStorage (llamada desde saveSettings y saveMoodConfig)
function saveSettingsToStorage() {
    // Usamos las variables globales definidas en app.js
    localStorage.setItem('time-durations', JSON.stringify(window.timeDurations));
    localStorage.setItem('time-activities', JSON.stringify(window.timeActivities));
    localStorage.setItem('track-items', JSON.stringify(window.trackItems));
    localStorage.setItem('mood-config', JSON.stringify(window.moods));
}

// --- Funciones del Modal de Ajustes ---

// Hacemos global para que el botón del footer la llame
window.openSettings = function() {
    const modal = document.getElementById('settings-modal');
    modal.classList.add('show');
    renderSettingsConfig(); // Definida abajo
}

// Hacemos global para que el botón de cerrar y el fondo la llamen
window.closeSettings = function(event) {
    // Permitir cerrar haciendo clic fuera del contenido
    if (event && event.target.id !== 'settings-modal' && !event.target.closest('.preview-content')) return;
    const modal = document.getElementById('settings-modal');
    modal.classList.remove('show');
}


function renderSettingsConfig() {
    const durationsContainer = document.getElementById('time-durations-config');
    // Usamos las variables globales definidas en app.js
    durationsContainer.innerHTML = window.timeDurations.map((duration, index) => `
        <div class="config-item">
            <input type="number" value="${duration}" id="duration-${index}" style="flex: 0 0 100px;">
            <span>minutes</span>
            <button class="mac-button" onclick="removeDuration(${index})" style="padding: 4px 8px; margin-left: auto;">✕</button>
        </div>
    `).join('') + `
        <button class="mac-button" onclick="addDuration()" style="margin-top: 8px;">➕ Add Duration</button>
    `;

    const activitiesContainer = document.getElementById('time-activities-config');
    activitiesContainer.innerHTML = window.timeActivities.map((activity, index) => `
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
            ${window.trackItems.meals.map((item, index) => `
                <div class="config-item">
                    <input type="text" value="${item}" id="meal-${index}">
                    <button class="mac-button" onclick="removeMeal(${index})" style="padding: 4px 8px;">✕</button>
                </div>
            `).join('')}
            <button class="mac-button" onclick="addMeal()" style="margin-top: 8px;">➕ Add Meal</button>
        </div>
        <div>
            <strong>Tasks:</strong>
            ${window.trackItems.tasks.map((item, index) => `
                <div class="config-item">
                    <input type="text" value="${item}" id="task-${index}">
                    <button class="mac-button" onclick="removeTask(${index})" style="padding: 4px 8px;">✕</button>
                </div>
            `).join('')}
            <button class="mac-button" onclick="addTask()" style="margin-top: 8px;">➕ Add Task</button>
        </div>
    `;
}

// Funciones auxiliares para modificar settings (llamadas desde los botones en renderSettingsConfig)
// Estas pueden quedarse locales si no se llaman desde fuera.
function addDuration() {
    window.timeDurations.push(60); // Modifica la global
    renderSettingsConfig();
}

function removeDuration(index) {
    window.timeDurations.splice(index, 1); // Modifica la global
    renderSettingsConfig();
}

function addActivity() {
    window.timeActivities.push('New Activity'); // Modifica la global
    renderSettingsConfig();
}

function removeActivity(index) {
    window.timeActivities.splice(index, 1); // Modifica la global
    renderSettingsConfig();
}

function addMeal() {
    window.trackItems.meals.push('🍴 New Meal'); // Modifica la global
    renderSettingsConfig();
}

function removeMeal(index) {
    window.trackItems.meals.splice(index, 1); // Modifica la global
    renderSettingsConfig();
}

function addTask() {
    window.trackItems.tasks.push('✓ New Task'); // Modifica la global
    renderSettingsConfig();
}

function removeTask(index) {
    window.trackItems.tasks.splice(index, 1); // Modifica la global
    renderSettingsConfig();
}

// Hacemos global para que el botón del modal la llame
window.saveSettings = function() {
    // Leemos los valores del DOM y actualizamos las variables globales en app.js
    window.timeDurations = Array.from(document.querySelectorAll('#time-durations-config input[type="number"]'))
        .map(input => parseInt(input.value) || 0)
        .filter(d => d > 0);

    window.timeActivities = Array.from(document.querySelectorAll('#time-activities-config input[type="text"]'))
        .map(input => input.value.trim())
        .filter(a => a !== '');

    window.trackItems.meals = Array.from(document.querySelectorAll('#track-items-config input[id^="meal-"]'))
        .map(input => input.value.trim())
        .filter(m => m !== '');

    window.trackItems.tasks = Array.from(document.querySelectorAll('#track-items-config input[id^="task-"]'))
        .map(input => input.value.trim())
        .filter(t => t !== '');

    saveSettingsToStorage(); // Guardar en localStorage

    // Guardar en Firebase (la función está en firebase-config.js, la hacemos global)
    if (typeof window.saveSettingsToFirebase === 'function' && window.currentUser && !window.isOfflineMode) {
        window.saveSettingsToFirebase();
    }

    // Actualizar la UI que depende de los settings
    window.updateTimerOptions();
    window.updateTrackOptions();
    window.closeSettings(); // Cerrar el modal
    alert('✅ Settings saved!');
}

// --- Funciones que actualizan otras partes de la UI ---

// Hacemos global para ser llamada al cargar/guardar settings
window.updateTimerOptions = function() {
    const container = document.getElementById('duration-selector');
    if (!container) return;
    // Usamos la variable global
    container.innerHTML = window.timeDurations.map(duration => `
        <div class="duration-option" data-duration="${duration}" onclick="selectDuration(${duration})">
            ${duration < 60 ? duration + ' min' : (duration / 60) + ' hour' + (duration > 60 ? 's' : '')}
        </div>
    `).join('');

    const actContainer = document.getElementById('activity-selector');
    if (!actContainer) return;
    // Usamos la variable global
    actContainer.innerHTML = window.timeActivities.map(activity => `
        <div class="activity-option" data-activity="${activity}" onclick="selectActivity('${activity}')">
            ${activity}
        </div>
    `).join('');
}

// Hacemos global para ser llamada al cargar/guardar settings
window.updateTrackOptions = function() {
    // renderTrackSelector ahora está en app.js (versión actual)
    // o debería estar en ui-renderer.js
    if (typeof window.renderTrackSelector === 'function') {
       window.renderTrackSelector();
    } else if (typeof renderTrackSelector === 'function') {
        renderTrackSelector(); // Si está en app.js
    }
}


// --- Funciones de Configuración de Moods ---
// (Estas también son parte de los settings)

// Hacemos global para que el botón la llame
window.toggleMoodConfig = function() {
    const panel = document.getElementById('mood-config');
    panel.classList.toggle('hidden');
    if (!panel.classList.contains('hidden')) {
        renderMoodConfig(); // Definida abajo
    }
}

function renderMoodConfig() {
    const container = document.getElementById('mood-config-list');
    // Usa la variable global 'moods' de app.js
    container.innerHTML = window.moods.map((mood, index) => `
        <div class="config-item">
            <input type="text" value="${mood.emoji}" id="mood-emoji-${index}" maxlength="2">
            <input type="text" value="${mood.label}" id="mood-label-${index}" placeholder="Label">
        </div>
    `).join('');
}

// Hacemos global para que el botón la llame
window.saveMoodConfig = function() {
    // Modifica la variable global 'moods' de app.js
    window.moods = window.moods.map((mood, index) => {
        const emojiInput = document.getElementById(`mood-emoji-${index}`);
        const labelInput = document.getElementById(`mood-label-${index}`);
        return {
            emoji: emojiInput ? emojiInput.value : mood.emoji,
            label: labelInput ? labelInput.value : mood.label
        };
    });

    saveSettingsToStorage(); // Guardar todos los settings (incluidos moods)

    // Guardar en Firebase (la función está en firebase-config.js)
    if (typeof window.saveSettingsToFirebase === 'function' && window.currentUser && !window.isOfflineMode) {
        window.saveSettingsToFirebase();
    }

    // Actualizar el selector de moods (función en app.js o ui-renderer.js)
    if (typeof window.renderMoodSelector === 'function') {
        window.renderMoodSelector();
     } else if (typeof renderMoodSelector === 'function') {
         renderMoodSelector();
     }
    window.toggleMoodConfig(); // Cerrar el panel
    alert('✅ Mood configuration saved');
}
