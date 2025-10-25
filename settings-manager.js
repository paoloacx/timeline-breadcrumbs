// settings-manager.js
// Módulo para gestionar la configuración de la app.
// Extraído de app.js (versión "gigante")

// Load settings from localStorage
// Hacemos global para que app.js la llame al arrancar
window.loadSettings = function() {
    // Estas variables (timeDurations, etc.) se definen en app.js
    // Aquí solo las leemos de localStorage si existen
    const savedDurations = localStorage.getItem('time-durations');
    const savedActivities = localStorage.getItem('time-activities');
    const savedTrackItems = localStorage.getItem('track-items');
    const savedMoods = localStorage.getItem('mood-config');
    
    // Sobrescribir las variables globales (definidas en app.js) si hay algo guardado
    if (savedDurations) window.timeDurations = JSON.parse(savedDurations);
    if (savedActivities) window.timeActivities = JSON.parse(savedActivities);
    if (savedTrackItems) window.trackItems = JSON.parse(savedTrackItems);
    if (savedMoods) window.moods = JSON.parse(savedMoods);
}

// Save settings to localStorage
// Hacemos global para que saveSettings() y saveMoodConfig() la usen
window.saveSettingsToStorage = function() {
    // Guardar las variables globales (de app.js) en localStorage
    localStorage.setItem('time-durations', JSON.stringify(window.timeDurations));
    localStorage.setItem('time-activities', JSON.stringify(window.timeActivities));
    localStorage.setItem('track-items', JSON.stringify(window.trackItems));
    localStorage.setItem('mood-config', JSON.stringify(window.moods));
}

// --- Funciones del Modal de Ajustes ---

// Hacemos global para que el botón del footer la llame (onclick)
window.openSettings = function() {
    const modal = document.getElementById('settings-modal');
    modal.classList.add('show');
    renderSettingsConfig(); // Es local de este módulo
}

// Hacemos global para que el botón de cerrar la llame (onclick)
window.closeSettings = function(event) {
    // Si se hace clic en el fondo (el modal en sí)
    if (event && event.target.id === 'settings-modal') {
        const modal = document.getElementById('settings-modal');
        modal.classList.remove('show');
        return;
    }
    // Si se hace clic en el botón de cerrar (que no tiene ID)
    if (event && event.target.closest('.mac-title-bar button')) {
         const modal = document.getElementById('settings-modal');
         modal.classList.remove('show');
         return;
    }
    // Si se llama sin evento (desde saveSettings)
    if (!event) {
        const modal = document.getElementById('settings-modal');
        modal.classList.remove('show');
        return;
    }
    // Si no, no hacer nada (se hizo clic dentro del contenido)
}

// Esta función solo es usada por openSettings, puede ser local
function renderSettingsConfig() {
    const durationsContainer = document.getElementById('time-durations-config');
    // Usar las variables globales de app.js
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

// --- Funciones auxiliares de config ---
// (Llamadas por onclick, deben ser globales)

window.addDuration = function() {
    window.timeDurations.push(60); // Modifica la global de app.js
    renderSettingsConfig();
}

window.removeDuration = function(index) {
    window.timeDurations.splice(index, 1); // Modifica la global
    renderSettingsConfig();
}

window.addActivity = function() {
    window.timeActivities.push('New Activity'); // Modifica la global
    renderSettingsConfig();
}

window.removeActivity = function(index) {
    window.timeActivities.splice(index, 1); // Modifica la global
    renderSettingsConfig();
}

window.addMeal = function() {
    window.trackItems.meals.push('🍴 New Meal'); // Modifica la global
    renderSettingsConfig();
}

window.removeMeal = function(index) {
    window.trackItems.meals.splice(index, 1); // Modifica la global
    renderSettingsConfig();
}

window.addTask = function() {
    window.trackItems.tasks.push('✓ New Task'); // Modifica la global
    renderSettingsConfig();
}

window.removeTask = function(index) {
    window.trackItems.tasks.splice(index, 1); // Modifica la global
    renderSettingsConfig();
}

// Hacemos global para que el botón de guardar la llame (onclick)
window.saveSettings = function() {
    // Leer del DOM y actualizar las variables globales de app.js
    window.timeDurations = Array.from(document.querySelectorAll('#time-durations-config input[type="number"]'))
        .map(input => parseInt(input.value) || 0)
        .filter(d => d > 0); // Asegurarse de que no haya ceros o NaN

    window.timeActivities = Array.from(document.querySelectorAll('#time-activities-config input[type="text"]'))
        .map(input => input.value.trim())
        .filter(a => a); // Quitar vacíos

    window.trackItems.meals = Array.from(document.querySelectorAll('#track-items-config input[id^="meal-"]'))
        .map(input => input.value.trim())
        .filter(m => m); // Quitar vacíos

    window.trackItems.tasks = Array.from(document.querySelectorAll('#track-items-config input[id^="task-"]'))
        .map(input => input.value.trim())
        .filter(t => t); // Quitar vacíos

    window.saveSettingsToStorage(); // Guardar en local
    
    // Guardar en Firebase (la función está en firebase-config.js)
    if (typeof window.saveSettingsToFirebase === 'function' && window.currentUser && !window.isOfflineMode) {
        window.saveSettingsToFirebase();
    }
    
    window.updateTimerOptions(); // Actualizar UI (función en este archivo)
    window.updateTrackOptions(); // Actualizar UI (función en este archivo)
    window.closeSettings(); // Cerrar el modal
    alert('✅ Settings saved!');
}

// --- Funciones de Configuración de Moods ---
// (También son parte de los settings)

// Hacemos global para que el botón la llame (onclick)
window.toggleMoodConfig = function() {
    const panel = document.getElementById('mood-config');
    panel.classList.toggle('hidden');
    if (!panel.classList.contains('hidden')) {
        renderMoodConfigInternal(); // Es local
    }
}

// Función interna, no necesita ser global
function renderMoodConfigInternal() {
    const container = document.getElementById('mood-config-list');
    // Usar la variable global 'moods' de app.js
    container.innerHTML = window.moods.map((mood, index) => `
        <div class="config-item">
            <input type="text" value="${mood.emoji}" id="mood-emoji-${index}" maxlength="2">
            <input type="text" value="${mood.label}" id="mood-label-${index}" placeholder="Label">
        </div>
    `).join('');
}

// Hacemos global para que el botón la llame (onclick)
window.saveMoodConfig = function() {
    // Modificar la variable global 'moods' de app.js
    window.moods = window.moods.map((mood, index) => ({
        emoji: document.getElementById(`mood-emoji-${index}`).value || mood.emoji,
        label: document.getElementById(`mood-label-${index}`).value || mood.label
    }));
    
    window.saveSettingsToStorage(); // Guardar en local
    
    // Guardar en Firebase (la función está en firebase-config.js)
    if (typeof window.saveSettingsToFirebase === 'function' && window.currentUser && !window.isOfflineMode) {
        window.saveSettingsToFirebase();
    }
    
    window.renderMoodSelector(); // Actualizar UI (función en app.js)
    window.toggleMoodConfig(); // Cerrar el panel
    alert('✅ Configuration saved');
}

// --- Funciones que actualizan otras partes de la UI ---
// (Dependen de los settings)

// Hacemos global para ser llamada al cargar/guardar settings
window.updateTimerOptions = function() {
    const container = document.getElementById('duration-selector');
    if (!container) return;
    
    // Usar la variable global de app.js
    container.innerHTML = window.timeDurations.map(duration => `
        <div class="duration-option" data-duration="${duration}" onclick="selectDuration(${duration})">
            ${duration < 60 ? duration + ' min' : (duration / 60) + ' hour' + (duration > 60 ? 's' : '')}
        </div>
    `).join('');

    const actContainer = document.getElementById('activity-selector');
    if (!actContainer) return;
    
    // Usar la variable global de app.js
    actContainer.innerHTML = window.timeActivities.map(activity => `
        <div class="activity-option" data-activity="${activity.replace(/'/g, "\\'")}" onclick="selectActivity('${activity.replace(/'/g, "\\'")}')">
            ${activity}
        </div>
    `).join('');
}

// Hacemos global para ser llamada al cargar/guardar settings
window.updateTrackOptions = function() {
    // La función renderTrackSelector() está en app.js
    if (typeof window.renderTrackSelector === 'function') {
        window.renderTrackSelector();
    }
}

