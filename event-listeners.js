// /event-listeners.js
// Attaches all event listeners to the DOM.
// This file is the "glue" that connects the HTML to the handler functions.

// Auth
import { signInWithGoogle, signOutUser } from './auth.js';

// CRUD Handlers (Save/Delete actions)
import { 
    saveEntry, deleteCurrentEntry, createTimeEvent, 
    saveTrackEvent, saveSpent, saveRecap 
} from './crud-handlers.js';

// UI Handlers (Toggles, selects, previews, edits)
import {
    toggleForm, toggleTimer, toggleTrack, toggleSpent, showRecapForm,
    cancelEdit, selectMood, toggleMoodConfig, selectDuration, selectActivity,
    selectTrackItem, closeRecapForm, selectTrack,
    previewEntry, closePreview, toggleFabMenu,
    toggleCrumb, toggleTime, toggleTrackFab, toggleSpentFab, showRecapFormWithFab,
    toggleReadMore, toggleDay, toggleRecap, handleBsoSearch, editEntry
} from './ui-handlers.js';

// Media Handlers (GPS, camera, audio)
import { getGPS, handleImages, startRecording, stopRecording, removeImage, removeAudio } from './media-handlers.js';

// Data Tools (Stats, Export)
import { 
    openStats, closeStats, exportCSV, exportICS, 
    closeExportModal, updateExportOptions, performExport 
} from './data-tools.js';

// Settings
import {
    openSettings, closeSettings, saveMoodConfig, saveSettings,
    addDuration, removeDuration, addActivity, removeActivity,
    addMeal, removeMeal, addTask, removeTask
} from './settings-manager.js';

/**
 * Initializes all event listeners for the application.
 */
export function initEventListeners() {
    
    // --- Static Header Buttons ---
    attachListener('login-btn', 'click', signInWithGoogle);
    attachListener('logout-btn', 'click', signOutUser);
    attachListener('settings-btn', 'click', openSettings);
    attachListener('stats-btn', 'click', openStats);
    attachListener('export-csv-btn', 'click', exportCSV);
    attachListener('export-ics-btn', 'click', exportICS);
    attachListener('sync-btn', 'click', () => location.reload()); // Simple refresh

    // --- FAB Menu ---
    attachListener('fab-main', 'click', toggleFabMenu);
    attachListener('fab-crumb', 'click', toggleCrumb);
    attachListener('fab-time', 'click', toggleTime);
    attachListener('fab-track', 'click', toggleTrackFab);
    attachListener('fab-spent', 'click', toggleSpentFab);
    attachListener('fab-recap', 'click', showRecapFormWithFab);

    // --- Main "Crumb" Form (form-window) ---
    attachListener('save-btn', 'click', saveEntry);
    attachListener('delete-btn', 'click', deleteCurrentEntry);
    attachListener('cancel-btn', 'click', cancelEdit);
    attachListener('gps-btn', 'click', getGPS);
    attachListener('image-input', 'change', handleImages);
    attachListener('record-btn', 'click', startRecording);
    attachListener('stop-record-btn', 'click', stopRecording);
    attachListener('mood-config-btn', 'click', toggleMoodConfig);

    // --- Timer Form (timer-window) ---
    attachListener('create-time-btn', 'click', createTimeEvent);
    attachListener('delete-time-btn', 'click', deleteCurrentEntry);
    attachListener('cancel-time-btn', 'click', toggleTimer);

    // --- Track Form (track-window) ---
    attachListener('save-track-btn', 'click', saveTrackEvent);
    attachListener('delete-track-btn', 'click', deleteCurrentEntry);
    attachListener('cancel-track-btn', 'click', toggleTrack);

    // --- Spent Form (spent-window) ---
    attachListener('save-spent-btn', 'click', saveSpent);
    attachListener('delete-spent-btn', 'click', deleteCurrentEntry);
    attachListener('cancel-spent-btn', 'click', toggleSpent);

    // --- Recap Form (recap-form) ---
    attachListener('save-recap-btn', 'click', saveRecap);
    attachListener('delete-recap-btn', 'click', deleteCurrentEntry); // Note: ID added in index.html
    attachListener('cancel-recap-btn', 'click', closeRecapForm);
    attachListener('recap-bso-search-btn', 'click', handleBsoSearch);
    
    // Recap rating slider
    const slider = document.getElementById('recap-rating');
    const valueDisplay = document.getElementById('recap-rating-value');
    if (slider && valueDisplay) {
        slider.oninput = () => {
            valueDisplay.textContent = slider.value;
        };
    }

    // --- Modals (Close Buttons & Background Click) ---
    attachListener('preview-modal', 'click', (e) => closePreview(e));
    attachListener('preview-close-btn', 'click', () => closePreview());
    
    attachListener('settings-modal', 'click', (e) => closeSettings(e));
    attachListener('settings-close-btn', 'click', () => closeSettings());
    
    attachListener('stats-modal', 'click', (e) => closeStats(e));
    attachListener('stats-close-btn', 'click', () => closeStats());

    // --- Settings Modal (Content Buttons) ---
    attachListener('save-mood-btn', 'click', saveMoodConfig);
    attachListener('settings-save-btn', 'click', saveSettings);
    
    // --- Event Delegation for Dynamic Content ---
    // Listen on the document body for clicks on dynamic elements
    document.body.addEventListener('click', (event) => {
        const target = event.target;
        const delegate = (selector, handler) => {
            if (target.closest(selector)) {
                handler(target.closest(selector));
            }
        };

        // --- Timeline Card Clicks ---
        delegate('.edit-button', (el) => editEntry(el.dataset.id));
        delegate('.preview-button', (el) => previewEntry(el.dataset.id));
        delegate('.read-more-btn', (el) => toggleReadMore(el.dataset.id));
        delegate('.day-header', (el) => toggleDay(el.dataset.dayKey));
        delegate('.recap-header', (el) => toggleRecap(el.dataset.recapId));
        delegate('.preview-image-thumb', (el) => previewEntry(el.dataset.entryId, el.dataset.imageIndex)); // Re-use preview

        // --- Form Dynamic Clicks ---
        delegate('.mood-option', (el) => selectMood(parseInt(el.dataset.index)));
        delegate('.duration-option', (el) => selectDuration(parseInt(el.dataset.duration)));
        delegate('#activity-selector .activity-option', (el) => selectActivity(el.dataset.activity));
        delegate('#track-selector .activity-option', (el) => selectTrackItem(el.dataset.item));
        delegate('.image-remove', (el) => removeImage(parseInt(el.dataset.index)));
        delegate('.audio-remove-btn', (el) => removeAudio());
        delegate('.bso-result', (el) => {
            const data = el.dataset;
            selectTrack(data.name, data.artist, data.url, data.artwork);
        });

        // --- Settings Modal (Dynamic Lists) ---
        delegate('.add-duration-btn', addDuration);
        delegate('.remove-duration-btn', (el) => removeDuration(parseInt(el.dataset.index)));
        delegate('.add-activity-btn', addActivity);
        delegate('.remove-activity-btn', (el) => removeActivity(parseInt(el.dataset.index)));
        delegate('.add-meal-btn', addMeal);
        delegate('.remove-meal-btn', (el) => removeMeal(parseInt(el.dataset.index)));
        delegate('.add-task-btn', addTask);
        delegate('.remove-task-btn', (el) => removeTask(parseInt(el.dataset.index)));
        
        // --- Export Modal (Dynamic) ---
        delegate('input[name="export-range"]', updateExportOptions);
        delegate('.export-perform-btn', performExport);
        delegate('.export-close-btn', () => closeExportModal());
        delegate('#export-modal', (e) => closeExportModal(e)); // BG click
    });
}

/**
 * Helper function to safely attach an event listener.
 * @param {string} id - The ID of the DOM element.
 * @param {string} event - The event type (e.g., 'click').
 * @param {Function} handler - The function to call.
 */
function attachListener(id, event, handler) {
    const element = document.getElementById(id);
    if (element) {
        element.addEventListener(event, handler);
    } else {
        // console.warn(`Element with ID '${id}' not found.`);
    }
}
