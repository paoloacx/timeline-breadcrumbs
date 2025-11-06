// ===== modules/settings/settings-manager.js (Settings Logic) =====

// Imports
// CAMBIO: Rutas ahora suben dos niveles (../../) y apuntan a 'core/'
import { getState, setSettings, setEntries } from '../../core/state.js';
import { saveData } from '../../core/storage.js';
import { openModal, closeModal } from '../ui/modal-manager.js';
// P-FIX: Importar el MAPA de iconos además del renderizador
import { renderMoodSelector, MOOD_ICON_MAP } from '../../ui-renderer.js';
import { importFullBackup } from '../data/data-tools.js';
import { renderTimeline } from '../timeline/timeline.js';

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
export function saveSettingsToStorage() {
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
    
    // P-FIX: Save Moods (visual AND label)
    // Esto funciona porque encontrará el input[type="text"] o el input[type="hidden"]
    document.querySelectorAll('#mood-config-list .config-item').forEach(item => {
        const visual = item.querySelector('input[name="mood-visual"]').value.trim();
        const label = item.querySelector('input[name="mood-label"]').value.trim();
        if (visual && label) {
            newSettings.moods.push({ visual, label });
        }
    });

    // Update the global state
    setSettings(newSettings);
    
    // Save to persistence
    saveSettingsToStorage();
    // REMOVED: Firebase call
    // saveSettingsToFirebase();
    
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
        <div class="config-item">
            <input type="number" class="mac-input" value="${duration}" min="1">
            <button class="mac-button delete-button" onclick="this.closest('.config-item').remove()">✕</button>
        </div>
    `).join('') + `<button class="mac-button" id="btn-add-duration">➕ Add Duration</button>`;
    
    durationsContainer.querySelector('#btn-add-duration').addEventListener('click', () => {
        const newItem = `<div class="config-item">
            <input type="number" class="mac-input" value="15" min="1">
            <button class="mac-button delete-button" onclick="this.closest('.config-item').remove()">✕</button>
        </div>`;
        durationsContainer.querySelector('#btn-add-duration').insertAdjacentHTML('beforebegin', newItem);
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
        activitiesContainer.querySelector('#btn-add-activity').insertAdjacentHTML('beforebegin', newItem);
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

    trackContainer.querySelector('#btn-add-meal').addEventListener('click', (e) => {
        const newItem = `<div class="config-item meal">
            <input type="text" class="mac-input" value="">
            <button class="mac-button delete-button" onclick="this.closest('.config-item').remove()">✕</button>
        </div>`;
        e.target.insertAdjacentHTML('beforebegin', newItem);
    });
    trackContainer.querySelector('#btn-add-task').addEventListener('click', (e) => {
        const newItem = `<div class="config-item task">
            <input type="text" class="mac-input" value="">
            <button class="mac-button delete-button" onclick="this.closest('.config-item').remove()">✕</button>
        </div>`;
        e.target.insertAdjacentHTML('beforebegin', newItem);
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
    
    container.innerHTML = settings.moods.map((mood, index) => {
        // P-FIX: Comprobar si 'mood.visual' es una clave de icono o un emoji
        const iconSrc = MOOD_ICON_MAP[mood.visual];
        let visualHTML = '';

        if (iconSrc) {
            // Es un icono predefinido. Mostrar el icono y un input oculto.
            visualHTML = `
                <div class="config-mood-visual-icon">
                    <img src="${iconSrc}" alt="${mood.label}" class="icon-mac" style="width: 24px; height: 24px;">
                </div>
                <input type="hidden" name="mood-visual" value="${mood.visual}">
            `;
        } else {
            // Es un emoji. Mostrar un input de texto.
            visualHTML = `
                <input type="text" name="mood-visual" class="mac-input" value="${mood.visual}">
            `;
        }
        
        return `
            <div class="config-item mood-item">
                ${visualHTML}
                <input type="text" name="mood-label" class="mac-input" value="${mood.label}">
                <button class="mac-button delete-button" onclick="this.closest('.config-item').remove()">✕</button>
            </div>
        `;
    }).join('') + `<button class="mac-button" id="btn-add-mood">➕ Add Mood</button>`;
    
    // El 'Add Mood' sigue creando un emoji por defecto
    container.querySelector('#btn-add-mood').addEventListener('click', (e) => {
        const newItem = `<div class="config-item mood-item">
            <input type="text" name="mood-visual" class="mac-input" value="🙂">
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
    if (!durationContainer) return; // Guard clause
    durationContainer.innerHTML = settings.timeDurations.map(minutes => `
        <div class="duration-option ${selectedDuration === minutes ? 'selected' : ''}" data-duration="${minutes}">
            ${minutes} min
        </div>
    `).join('');
    
    const activityContainer = document.getElementById('activity-selector');
    if (!activityContainer) return; // Guard clause
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
    if (!container) return; // Guard clause
    
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

// --- Import Backup Function ---
/**
 * Handles importing a JSON backup file.
 */
export async function handleImportBackup() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        try {
            const backupData = await importFullBackup(file);
            const currentState = getState();
            const existingEntries = currentState.entries;
            const existingIds = new Set(existingEntries.map(e => e.id));
            
            // Filter out duplicates based on ID
            const newEntries = backupData.entries.filter(entry => !existingIds.has(entry.id));
            const duplicateCount = backupData.entries.length - newEntries.length;
            
            let confirmMsg = `Import backup from ${new Date(backupData.createdAt).toLocaleString()}?\n\n`;
            confirmMsg += `- ${newEntries.length} new entries will be added\n`;
            if (duplicateCount > 0) {
                confirmMsg += `- ${duplicateCount} duplicate entries will be skipped\n`;
            }
            confirmMsg += `- Settings will be merged\n\n`;
            confirmMsg += `Continue with import?`;
            
            if (!confirm(confirmMsg)) {
                return;
            }
            
            // Merge entries (add new ones)
            const mergedEntries = [...existingEntries, ...newEntries];
            setEntries(mergedEntries);
            
            // Merge settings (imported settings take priority)
            const mergedSettings = {
                ...currentState.settings,
                ...backupData.settings
            };
            setSettings(mergedSettings);
            
            saveData();
            saveSettingsToStorage();
            
            renderTimeline();
            updateTimerOptions();
            updateTrackOptions();
            renderMoodSelector();
            
            alert(`✅ Import successful!\n${newEntries.length} entries added${duplicateCount > 0 ? `, ${duplicateCount} duplicates skipped` : ''}.`);
            
        } catch (error) {
            console.error('Import error:', error);
            alert(`❌ Import failed: ${error.message}`);
        }
    };
    
    input.click();
}
