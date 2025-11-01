// ===== settings-manager.js (Settings Logic) =====

// Imports
import { getState, setSettings } from './state.js';
import { saveSettingsToFirebase } from './firebase-config.js';
import { closeModal } from './ui-handlers.js';
import { renderMoodSelector } from './ui-renderer.js';

// --- Local Storage ---

/**
 * Loads settings from localStorage into the state.
 */
export function loadSettings() {
    const saved = localStorage.getItem('timeline-settings');
    if (saved) {
        try {
            const loadedSettings = JSON.parse(saved);
            // Combina con el estado por defecto
            setSettings(loadedSettings); 
        } catch (e) {
            console.error('Error parsing settings from localStorage', e);
        }
    }
    // Renderiza los selectores iniciales con las settings cargadas (o por defecto)
    updateTimerOptions();
    updateTrackOptions();
}

/**
 * Saves the current state's settings to localStorage.
 */
function saveSettingsToStorage() {
    const { settings } = getState();
    localStorage.setItem('timeline-settings', JSON.stringify(settings));
}

// --- Main Functions ---

/**
 * Opens the settings modal and renders the config.
 */
export function openSettings() {
    renderSettingsConfig();
    openModal('settings-modal');
}

/**
 * Saves all settings from the config modal to state, localStorage, and Firebase.
 */
export function saveSettings() {
    const newSettings = {
        timeDurations: [],
        timeActivities: [],
        trackItems: { meals: [], tasks: [] },
        moods: []
    };

    // Save Time Durations
    document.querySelectorAll('#time-durations-config .config-item input').forEach(input => {
        const val = parseInt(input.value, 10);
        if (val > 0) newSettings.timeDurations.push(val);
    });

    // Save Time Activities
    document.querySelectorAll('#time-activities-config .config-item input').forEach(input => {
        const val = input.value.trim();
        if (val) newSettings.timeActivities.push(val);
    });

    // Save Track Items (Meals & Tasks)
    document.querySelectorAll('#track-items-config .config-item.meal input').forEach(input => {
        const val = input.value.trim();
        if (val) newSettings.trackItems.meals.push(val);
    });
    document.querySelectorAll('#track-items-config .config-item.task input').forEach(input => {
        const val = input.value.trim();
        if (val) newSettings.trackItems.tasks.push(val);
    });
    
    // Save Moods
    document.querySelectorAll('#mood-config-list .config-item').forEach(item => {
        const emoji = item.querySelector('input[name="mood-emoji"]').value.trim();
        const label = item.querySelector('input[name="mood-label"]').value.trim();
        if (emoji && label) {
            newSettings.moods.push({ emoji, label });
        }
    });

    // Update the global state
    setSettings(newSettings);
    
    // Save to persistence
    saveSettingsToStorage();
    saveSettingsToFirebase();
    
    // Update UI components that depend on settings
    updateTimerOptions();
    updateTrackOptions();
    renderMoodSelector(); // Actualiza el selector del formulario de crumb
    
    closeModal('settings-modal');
    alert('Settings Saved!');
}

// --- Config Rendering ---

/**
 * Renders the full settings configuration panel inside the modal.
 */
function renderSettingsConfig() {
    const { settings } = getState();
    
    // Render Time Durations
    const durationsContainer = document.getElementById('time-durations-config');
    durationsContainer.innerHTML = settings.timeDurations.map((duration, index) => `
        <div classclass="config-item">
            <input type="number" class="mac-input" value="${duration}" min="1">
            <button class="mac-button delete-button" onclick="this.closest('.config-item').remove()">✕</button>
        </div>
    `).join('') + `<button class="mac-button" id="btn-add-duration">➕ Add Duration</button>`;
    
    // (El listener para 'btn-add-duration' se añade dinámicamente)
    durationsContainer.querySelector('#btn-add-duration').addEventListener('click', () => {
        const newItem = `<div class="config-item">
            <input type="number" class="mac-input" value="15" min="1">
            <button classclass="mac-button delete-button" onclick="this.closest('.config-item').remove()">✕</button>
        </div>`;
        durationsContainer.insertAdjacentHTML('beforeend', newItem);
    });

    // Render Time Activities
    const activitiesContainer = document.getElementById('time-activities-config');
    activitiesContainer.innerHTML = settings.timeActivities.map((activity, index) => `
        <div class="config-item">
            <input type="text" class="mac-input" value="${activity}">
            <button class="mac-button delete-button" onclick="this.closest('.config-item').remove()">✕</button>
        </div>
    `).join('') + `<button class="mac-button" id="btn-add-activity">➕ Add Activity</button>`;
    
    activitiesContainer.querySelector('#btn-add-activity').addEventListener('click', () => {
        const newItem = `<div class="config-item">
            <input type="text" class="mac-input" value="">
            <button class="mac-button delete-button" onclick="this.closest('.config-item').remove()">✕</button>
        </div>`;
        activitiesContainer.insertAdjacentHTML('beforeend', newItem);
    });

    // Render Track Items
    const trackContainer = document.getElementById('track-items-config');
    let trackHTML = '<h4>Meals</h4>';
    trackHTML += settings.trackItems.meals.map((item, index) => `
        <div class="config-item meal">
            <input type="text" class="mac-input" value="${item}">
            <button class="mac-button delete-button" onclick="this.closest('.config-item').remove()">✕</button>
        </div>
    `).join('');
    trackHTML += `<button class="mac-button" id="btn-add-meal">➕ Add Meal</button>`;
    
    trackHTML += '<h4 style="margin-top: 16px;">Tasks</h4>';
    trackHTML += settings.trackItems.tasks.map((item, index) => `
        <div class="config-item task">
            <input type="text" class="mac-input" value="${item}">
            <button class="mac-button delete-button" onclick="this.closest('.config-item').remove()">✕</button>
        </div>
    `).join('');
    trackHTML += `<button class="mac-button" id="btn-add-task">➕ Add Task</button>`;
    trackContainer.innerHTML = trackHTML;

    trackContainer.querySelector('#btn-add-meal').addEventListener('click', () => {
        const newItem = `<div class="config-item meal">...</div>`; // (Similar a los otros)
        trackContainer.querySelector('#btn-add-meal').insertAdjacentHTML('beforebegin', newItem);
    });
    trackContainer.querySelector('#btn-add-task').addEventListener('click', () => {
        const newItem = `<div class="config-item task">...</div>`; // (Similar a los otros)
        trackContainer.querySelector('#btn-add-task').insertAdjacentHTML('beforebegin', newItem);
    });

    // Render Mood Config
    renderMoodConfigInternal(document.getElementById('mood-config-list'));
}

// --- Mood Config (In-Form) ---

/**
 * Toggles the small mood config panel in the Crumb form.
 */
export function toggleMoodConfig() {
    const container = document.getElementById('mood-config');
    container.classList.toggle('hidden');
    if (!container.classList.contains('hidden')) {
        renderMoodConfigInternal(container);
    }
}

/**
 * Renders the mood config list into a specific container.
 * @param {HTMLElement} container - The element to render into.
 */
function renderMoodConfigInternal(container) {
    const { settings } = getState();
    container.innerHTML = settings.moods.map((mood, index) => `
        <div class="config-item">
            <input type="text" name="mood-emoji" class="mac-input" value="${mood.emoji}" style="flex: 0 0 60px; text-align: center; font-size: 20px;">
            <input type="text" name="mood-label" class="mac-input" value="${mood.label}">
            <button class="mac-button delete-button" onclick="this.closest('.config-item').remove()">✕</button>
        </div>
    `).join('') + `<button class="mac-button" id="btn-add-mood">➕ Add Mood</button>`;
    
    // (El listener se añade dinámicamente)
    container.querySelector('#btn-add-mood').addEventListener('click', (e) => {
        const newItem = `<div class="config-item">
            <input type="text" name="mood-emoji" class="mac-input" value="🙂" style="flex: 0 0 60px; text-align: center; font-size: 20px;">
            <input type="text" name="mood-label" class="mac-input" value="New Mood">
            <button class="mac-button delete-button" onclick="this.closest('.config-item').remove()">✕</button>
        </div>`;
        e.target.insertAdjacentHTML('beforebegin', newItem);
    });
}

// --- Form Population ---

/**
 * Renders the Duration and Activity selectors in the Timer form.
 */
export function updateTimerOptions() {
    const { settings, selectedDuration, selectedActivity } = getState();
    
    const durationContainer = document.getElementById('duration-selector');
    durationContainer.innerHTML = settings.timeDurations.map(minutes => `
        <div class="duration-option ${selectedDuration === minutes ? 'selected' : ''}" data-duration="${minutes}">
            ${minutes} min
        </div>
    `).join('');
    
    const activityContainer = document.getElementById('activity-selector');
    activityContainer.innerHTML = settings.timeActivities.map(activity => `
        <div class="activity-option ${selectedActivity === activity ? 'selected' : ''}" data-activity="${activity}">
            ${activity}
        </div>
    `).join('');
}

/**
 * Renders the Track Item selectors in the Track form.
 */
export function updateTrackOptions() {
    const { settings, selectedTrackItem } = getState();
    const container = document.getElementById('track-selector');
    
    let html = '';
    if (settings.trackItems.meals.length > 0) {
        html += settings.trackItems.meals.map(item => `
            <div class="activity-option ${selectedTrackItem === item ? 'selected' : ''}" data-item="${item}">
                ${item}
            </div>
        `).join('');
    }
    if (settings.trackItems.tasks.length > 0) {
        html += settings.trackItems.tasks.map(item => `
            <div class="activity-option ${selectedTrackItem === item ? 'selected' : ''}" data-item="${item}">
                ${item}
            </div>
        `).join('');
    }
    container.innerHTML = html;
}

// --- Form Validation ---
export function checkTimerReady() {
    const { selectedDuration, selectedActivity } = getState();
    const btn = document.getElementById('btn-save-time');
    if (btn) {
        btn.disabled = !(selectedDuration && selectedActivity);
    }
}
export function checkTrackReady() {
    const { selectedTrackItem } = getState();
    const btn = document.getElementById('btn-save-track');
    if (btn) {
        btn.disabled = !selectedTrackItem;
    }
}
