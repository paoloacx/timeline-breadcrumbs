// settings-manager.js

// Este archivo maneja la lógica de configuración de la aplicación.
// Depende de las variables globales definidas en app.js (e.g., window.timeDurations)
// y funciones globales de otros módulos (e.g., window.saveSettingsToFirebase).

// Load settings from localStorage (llamada desde app.js durante el arranque)
// Hacemos la función global para que pueda ser llamada desde app.js
window.loadSettings = function() {
    console.log("Loading settings from localStorage via settings-manager.js...");
    try {
        const savedDurations = localStorage.getItem('time-durations');
        const savedActivities = localStorage.getItem('time-activities');
        const savedTrackItems = localStorage.getItem('track-items');
        const savedMoods = localStorage.getItem('mood-config');

        // Usamos las variables globales definidas en app.js
        // Si no hay nada guardado, MANTIENE los valores por defecto de app.js
        if (savedDurations) window.timeDurations = JSON.parse(savedDurations);
        if (savedActivities) window.timeActivities = JSON.parse(savedActivities);
        if (savedTrackItems) window.trackItems = JSON.parse(savedTrackItems);
        if (savedMoods) window.moods = JSON.parse(savedMoods);
        // Asegurar que moods tenga un valor si no hay nada guardado
        else if (window.defaultMoods) window.moods = [...window.defaultMoods];

        console.log("Settings loaded:", {
            durations: window.timeDurations,
            activities: window.timeActivities,
            trackItems: window.trackItems,
            moods: window.moods
        });


        // Actualizar UI al cargar (estas funciones deben ser globales)
        if (typeof window.updateTimerOptions === 'function') window.updateTimerOptions();
        if (typeof window.updateTrackOptions === 'function') window.updateTrackOptions();
        if (typeof window.renderMoodSelector === 'function') window.renderMoodSelector();

    } catch (error) {
         console.error("Error loading settings:", error);
         // En caso de error, podríamos intentar resetear a los defaults
         if(window.defaultMoods) window.moods = [...window.defaultMoods];
         // Faltaría resetear los otros arrays si fallara el parseo
    }
}

// Save settings to localStorage (llamada desde saveSettings y saveMoodConfig)
function saveSettingsToStorage() {
    try {
        // Usamos las variables globales definidas en app.js
        localStorage.setItem('time-durations', JSON.stringify(window.timeDurations));
        localStorage.setItem('time-activities', JSON.stringify(window.timeActivities));
        localStorage.setItem('track-items', JSON.stringify(window.trackItems));
        localStorage.setItem('mood-config', JSON.stringify(window.moods));
        console.log("Settings saved to localStorage.");
    } catch (error) {
        console.error("Error saving settings to localStorage:", error);
    }
}

// --- Funciones del Modal de Ajustes ---

// Hacemos global para que el botón del footer la llame
window.openSettings = function() {
    const modal = document.getElementById('settings-modal');
    if (!modal) return; // Control de seguridad
    modal.classList.add('show');
    renderSettingsConfig(); // Definida abajo
}

// Hacemos global para que el botón de cerrar y el fondo la llamen
window.closeSettings = function(event) {
    // Permitir cerrar haciendo clic en el fondo oscuro (.preview-modal)
    // O en el botón de cerrar (que no tiene id específico, pero está dentro de .preview-content)
    // No cerrar si se hace clic dentro del contenido del modal
    if (event && event.target.id !== 'settings-modal' && event.target.closest('.preview-content')) {
         // Si el clic es DENTRO del contenido Y NO es el modal mismo, no hacer nada
         // (Excepto si es el botón de cerrar, que tiene su propio onclick)
         // Necesitamos una forma de identificar el botón de cerrar si no tiene ID
         // Por ahora, asumimos que tiene un onclick="closeSettings()" y funciona
         if (!event.target.closest('button[onclick^="closeSettings"]')) {
            return;
         }
    }

    const modal = document.getElementById('settings-modal');
    if (!modal) return;
    modal.classList.remove('show');
}


function renderSettingsConfig() {
    const durationsContainer = document.getElementById('time-durations-config');
    if (!durationsContainer) return;
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
     if (!activitiesContainer) return;
    activitiesContainer.innerHTML = window.timeActivities.map((activity, index) => `
        <div class="config-item">
            <input type="text" value="${activity}" id="activity-${index}">
            <button class="mac-button" onclick="removeActivity(${index})" style="padding: 4px 8px;">✕</button>
        </div>
    `).join('') + `
        <button class="mac-button" onclick="addActivity()" style="margin-top: 8px;">➕ Add Activity</button>
    `;

    const trackContainer = document.getElementById('track-items-config');
     if (!trackContainer) return;
     // Asegurarse que trackItems exista y tenga meals/tasks
     const mealsHtml = (window.trackItems && window.trackItems.meals) ? window.trackItems.meals.map((item, index) => `
                <div class="config-item">
                    <input type="text" value="${item}" id="meal-${index}">
                    <button class="mac-button" onclick="removeMeal(${index})" style="padding: 4px 8px;">✕</button>
                </div>
            `).join('') : '';
     const tasksHtml = (window.trackItems && window.trackItems.tasks) ? window.trackItems.tasks.map((item, index) => `
                <div class="config-item">
                    <input type="text" value="${item}" id="task-${index}">
                    <button class="mac-button" onclick="removeTask(${index})" style="padding: 4px 8px;">✕</button>
                </div>
            `).join('') : '';

    trackContainer.innerHTML = `
        <div style="margin-bottom: 16px;">
            <strong>Meals:</strong>
            ${mealsHtml}
            <button class="mac-button" onclick="addMeal()" style="margin-top: 8px;">➕ Add Meal</button>
        </div>
        <div>
            <strong>Tasks:</strong>
            ${tasksHtml}
            <button class="mac-button" onclick="addTask()" style="margin-top: 8px;">➕ Add Task</button>
        </div>
    `;
}

// Funciones auxiliares para modificar settings (llamadas desde los botones en renderSettingsConfig)
// Estas deben ser globales porque los botones onclick las llaman.
window.addDuration = function() {
    window.timeDurations.push(60); // Modifica la global
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
    // Asegurar que el array exista
    if (!window.trackItems) window.trackItems = { meals: [], tasks: [] };
    if (!window.trackItems.meals) window.trackItems.meals = [];
    window.trackItems.meals.push('🍴 New Meal'); // Modifica la global
    renderSettingsConfig();
}

window.removeMeal = function(index) {
    if (window.trackItems && window.trackItems.meals) {
        window.trackItems.meals.splice(index, 1); // Modifica la global
        renderSettingsConfig();
    }
}

window.addTask = function() {
     // Asegurar que el array exista
    if (!window.trackItems) window.trackItems = { meals: [], tasks: [] };
    if (!window.trackItems.tasks) window.trackItems.tasks = [];
    window.trackItems.tasks.push('✓ New Task'); // Modifica la global
    renderSettingsConfig();
}

window.removeTask = function(index) {
     if (window.trackItems && window.trackItems.tasks) {
        window.trackItems.tasks.splice(index, 1); // Modifica la global
        renderSettingsConfig();
     }
}

// Hacemos global para que el botón del modal la llame
window.saveSettings = function() {
    try {
        // Leemos los valores del DOM y actualizamos las variables globales en app.js
        const durationInputs = document.querySelectorAll('#time-durations-config input[type="number"]');
        window.timeDurations = durationInputs ? Array.from(durationInputs)
            .map(input => parseInt(input.value) || 0)
            .filter(d => d > 0) : [];

        const activityInputs = document.querySelectorAll('#time-activities-config input[type="text"]');
        window.timeActivities = activityInputs ? Array.from(activityInputs)
            .map(input => input.value.trim())
            .filter(a => a !== '') : [];

        const mealInputs = document.querySelectorAll('#track-items-config input[id^="meal-"]');
        const taskInputs = document.querySelectorAll('#track-items-config input[id^="task-"]');

        window.trackItems = {
            meals: mealInputs ? Array.from(mealInputs)
                   .map(input => input.value.trim())
                   .filter(m => m !== '') : [],
            tasks: taskInputs ? Array.from(taskInputs)
                   .map(input => input.value.trim())
                   .filter(t => t !== '') : []
        };


        saveSettingsToStorage(); // Guardar en localStorage

        // Guardar en Firebase (la función es global, definida en firebase-config.js)
        if (typeof window.saveSettingsToFirebase === 'function' && window.currentUser && !window.isOfflineMode) {
            window.saveSettingsToFirebase();
        }

        // Actualizar la UI que depende de los settings (funciones globales)
        if (typeof window.updateTimerOptions === 'function') window.updateTimerOptions();
        if (typeof window.updateTrackOptions === 'function') window.updateTrackOptions();
        window.closeSettings(); // Cerrar el modal (es global)
        alert('✅ Settings saved!');

    } catch (error) {
        console.error("Error saving settings:", error);
        alert("Error saving settings. Check console for details.");
    }
}

// --- Funciones que actualizan otras partes de la UI ---

// Hacemos global para ser llamada al cargar/guardar settings
window.updateTimerOptions = function() {
    const container = document.getElementById('duration-selector');
    if (!container) return;
    // Usamos la variable global
    container.innerHTML = (window.timeDurations || []).map(duration => `
        <div class="duration-option" data-duration="${duration}" onclick="selectDuration(${duration})">
            ${duration < 60 ? duration + ' min' : (duration / 60) + ' hour' + (duration > 60 ? 's' : '')}
        </div>
    `).join('');

    const actContainer = document.getElementById('activity-selector');
    if (!actContainer) return;
    // Usamos la variable global
    actContainer.innerHTML = (window.timeActivities || []).map(activity => `
        <div class="activity-option" data-activity="${activity}" onclick="selectActivity('${activity}')">
            ${activity}
        </div>
    `).join('');
}

// Hacemos global para ser llamada al cargar/guardar settings
window.updateTrackOptions = function() {
    // renderTrackSelector debe ser global (definida en app.js o ui-renderer.js)
    if (typeof window.renderTrackSelector === 'function') {
       window.renderTrackSelector();
    }
}


// --- Funciones de Configuración de Moods ---
// (Estas también son parte de los settings)

// Hacemos global para que el botón la llame
window.toggleMoodConfig = function() {
    const panel = document.getElementById('mood-config');
    if (!panel) return;
    panel.classList.toggle('hidden');
    if (!panel.classList.contains('hidden')) {
        renderMoodConfig(); // Definida abajo
    }
}

// Función interna, no necesita ser global
function renderMoodConfig() {
    const container = document.getElementById('mood-config-list');
    if (!container) return;
    // Usa la variable global 'moods' de app.js
    container.innerHTML = (window.moods || []).map((mood, index) => `
        <div class="config-item">
            <input type="text" value="${mood.emoji}" id="mood-emoji-${index}" maxlength="2">
            <input type="text" value="${mood.label}" id="mood-label-${index}" placeholder="Label">
        </div>
    `).join('');
}

// Hacemos global para que el botón la llame
window.saveMoodConfig = function() {
    try {
        // Modifica la variable global 'moods' de app.js
        window.moods = (window.moods || []).map((mood, index) => {
            const emojiInput = document.getElementById(`mood-emoji-${index}`);
            const labelInput = document.getElementById(`mood-label-${index}`);
            // Devolver un objeto válido incluso si los inputs no existen
            return {
                emoji: emojiInput ? emojiInput.value : (mood.emoji || '❓'),
                label: labelInput ? labelInput.value : (mood.label || 'Unknown')
            };
        });

        saveSettingsToStorage(); // Guardar todos los settings (incluidos moods)

        // Guardar en Firebase (función global de firebase-config.js)
        if (typeof window.saveSettingsToFirebase === 'function' && window.currentUser && !window.isOfflineMode) {
            window.saveSettingsToFirebase();
        }

        // Actualizar el selector de moods (función global de app.js o ui-renderer.js)
        if (typeof window.renderMoodSelector === 'function') {
            window.renderMoodSelector();
        }
        window.toggleMoodConfig(); // Cerrar el panel (es global)
        alert('✅ Mood configuration saved');
    } catch (error) {
        console.error("Error saving mood config:", error);
        alert("Error saving mood config. Check console for details.");
    }
}

