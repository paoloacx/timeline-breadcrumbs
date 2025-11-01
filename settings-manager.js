// /settings-manager.js
// Manages loading, saving, and editing user settings.
// Now uses the state-manager.

import { getState, setState } from './state-manager.js';
import { saveSettingsToFirebase } from './api-services.js';
import { renderMoodSelector, renderTimerOptions, renderTrackSelector } from './ui-renderer.js';

/**
 * Loads settings from localStorage into the state.
 */
export function loadSettings() {
    let { defaultMoods } = getState();
    let loadedSettings = {};
    
    const saved = localStorage.getItem('timeline-settings');
    if (saved) {
        try {
            loadedSettings = JSON.parse(saved);
        } catch (e) {
            console.error("Error parsing settings, resetting to default.", e);
            loadedSettings = {};
        }
    }

    // Merge loaded settings with defaults
    const moods = loadedSettings.moods && loadedSettings.moods.length > 0 ? loadedSettings.moods : [...defaultMoods];
    
    setState({
        moods: moods,
        timeDurations: loadedSettings.timeDurations || [15, 30, 60, 120, 180],
        timeActivities: loadedSettings.timeActivities || ['Reading', 'Sports', 'Work', 'Cleaning', 'Errands'],
        trackItems: loadedSettings.trackItems || {
            meals: ['🍳 Breakfast', '🥗 Lunch', '🍽️ Dinner', '☕ Snack'],
            tasks: ['💊 Medicine', '💧 Water', '🚶 Walk', '📞 Call']
        }
    });
    
    console.log("Settings loaded into state.");
    
    // After loading, update UI elements that depend on them
    updateAllOptionRenderers();
}

/**
 * Saves settings to localStorage and (if online) to Firebase.
 * @param {object} settings - The settings object to save.
 */
export function saveSettingsToStorage(settings) {
    localStorage.setItem('timeline-settings', JSON.stringify(settings));
    
    // Re-load settings into state
    loadSettings();
    
    const { currentUser, isOfflineMode } = getState();
    if (currentUser && !isOfflineMode) {
        saveSettingsToFirebase(settings);
    }
}

/**
 * Updates all form option renderers.
 */
function updateAllOptionRenderers() {
    renderMoodSelector();
    renderTimerOptions();
    renderTrackSelector();
}

// --- Modal UI ---

export function openSettings() {
    renderSettingsConfig();
    document.getElementById('settings-modal').classList.add('show');
}

export function closeSettings(event) {
    // Check for background click
    if (event && event.target.id !== 'settings-modal') return;
    document.getElementById('settings-modal').classList.remove('show');
}

/**
 * Renders the full settings configuration in the modal.
 */
function renderSettingsConfig() {
    const { timeDurations, timeActivities, trackItems } = getState();

    // Render Durations
    const durationsList = document.getElementById('settings-durations-list');
    durationsList.innerHTML = timeDurations.map((d, i) => `
        <span class="setting-tag">
            ${d} min
            <button class="remove-duration-btn" data-index="${i}">✕</button>
        </span>
    `).join('');

    // Render Activities
    const activitiesList = document.getElementById('settings-activities-list');
    activitiesList.innerHTML = timeActivities.map((a, i) => `
        <span class="setting-tag">
            ${a}
            <button class="remove-activity-btn" data-index="${i}">✕</button>
        </span>
    `).join('');

    // Render Meals
    const mealsList = document.getElementById('settings-meals-list');
    mealsList.innerHTML = trackItems.meals.map((m, i) => `
        <span class="setting-tag">
            ${m}
            <button class="remove-meal-btn" data-index="${i}">✕</button>
        </span>
    `).join('');

    // Render Tasks
    const tasksList = document.getElementById('settings-tasks-list');
    tasksList.innerHTML = trackItems.tasks.map((t, i) => `
        <span class="setting-tag">
            ${t}
            <button class="remove-task-btn" data-index="${i}">✕</button>
        </span>
    `).join('');
}

/**
 * Renders the mood config editor (in the main form).
 */
export function renderMoodConfig() {
    const { moods } = getState();
    const list = document.getElementById('mood-config-list');
    list.innerHTML = moods.map((mood, index) => `
        <div class="mood-config-item">
            <input type="text" value="${mood.emoji}" class="mood-config-emoji" data-index="${index}">
            <input type="text" value="${mood.label}" class="mood-config-label" data-index="${index}">
        </div>
    `).join('');
}

/**
 * Saves the edited moods from the main form.
 */
export function saveMoodConfig() {
    const emojiInputs = document.querySelectorAll('.mood-config-emoji');
    const labelInputs = document.querySelectorAll('.mood-config-label');
    
    let newMoods = [];
    emojiInputs.forEach((input, index) => {
        const emoji = input.value;
        const label = labelInputs[index].value;
        if (emoji && label) {
            newMoods.push({ emoji, label });
        }
    });

    setState({ moods: newMoods });
    saveSettings(); // Save all settings
    document.getElementById('mood-config').classList.add('hidden');
    renderMoodSelector();
}

// --- Settings CRUD (Add/Remove) ---

// Durations
export function addDuration() {
    const input = document.getElementById('new-duration-input');
    const value = parseInt(input.value);
    if (value && value > 0) {
        let { timeDurations } = getState();
        timeDurations.push(value);
        timeDurations.sort((a, b) => a - b); // Keep sorted
        setState({ timeDurations: [...timeDurations] });
        renderSettingsConfig();
        input.value = '';
    }
}
export function removeDuration(index) {
    let { timeDurations } = getState();
    timeDurations.splice(index, 1);
    setState({ timeDurations: [...timeDurations] });
    renderSettingsConfig();
}

// Activities
export function addActivity() {
    const input = document.getElementById('new-activity-input');
    const value = input.value.trim();
    if (value) {
        let { timeActivities } = getState();
        timeActivities.push(value);
        setState({ timeActivities: [...timeActivities] });
        renderSettingsConfig();
        input.value = '';
    }
}
export function removeActivity(index) {
    let { timeActivities } = getState();
    timeActivities.splice(index, 1);
    setState({ timeActivities: [...timeActivities] });
    renderSettingsConfig();
}

// Meals
export function addMeal() {
    const input = document.getElementById('new-meal-input');
    const value = input.value.trim();
    if (value) {
        let { trackItems } = getState();
        trackItems.meals.push(value);
        setState({ trackItems: { ...trackItems } });
        renderSettingsConfig();
        input.value = '';
    }
}
export function removeMeal(index) {
    let { trackItems } = getState();
    trackItems.meals.splice(index, 1);
    setState({ trackItems: { ...trackItems } });
    renderSettingsConfig();
}

// Tasks
export function addTask() {
    const input = document.getElementById('new-task-input');
    const value = input.value.trim();
    if (value) {
        let { trackItems } = getState();
        trackItems.tasks.push(value);
        setState({ trackItems: { ...trackItems } });
        renderSettingsConfig();
        input.value = '';
    }
}
export function removeTask(index) {
    let { trackItems } = getState();
    trackItems.tasks.splice(index, 1);
    setState({ trackItems: { ...trackItems } });
    renderSettingsConfig();
}

/**
 * Saves all settings from the modal.
 */
export function saveSettings() {
    const { moods, timeDurations, timeActivities, trackItems } = getState();
    
    saveSettingsToStorage({
        moods,
        timeDurations,
        timeActivities,
        trackItems
    });
    
    alert('✅ Settings Saved!');
    closeSettings();
}
