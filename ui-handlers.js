// /ui-handlers.js
// Handles UI interactions like toggling windows, selecting items,
// and preparing forms for editing or previewing.

import { getState, setState, resetCrumbFormState, resetTimerFormState, resetTrackFormState, resetSpentFormState, resetRecapFormState } from './state-manager.js';
import { 
    renderMoodSelector, renderTrackSelector, renderTimerOptions, 
    populateCrumbForm, populateTimerForm, populateTrackForm, 
    populateSpentForm, populateRecapForm, clearForm, 
    renderBsoResults, renderSelectedBsoTrack 
    // CAMBIO: Se ha eliminado 'renderMoodConfig' de esta línea
} from './ui-renderer.js';
import { searchiTunesTracks } from './api-services.js';
// CAMBIO: Se ha añadido la importación correcta desde 'settings-manager.js'
import { renderMoodConfig } from './settings-manager.js';

let fabMenuOpen = false;
const allForms = ['form-window', 'timer-window', 'track-window', 'spent-window', 'recap-form'];

/**
 * Hides all main form windows.
 */
function hideAllForms() {
    allForms.forEach(id => {
        document.getElementById(id)?.classList.add('hidden');
    });
}

/**
 * Opens a specific form window and hides others.
 * @param {string} formId - The ID of the form window to show.
 * @param {Function} onOpen - Optional callback to run after showing.
 */
function openForm(formId, onOpen = () => {}) {
    hideAllForms();
    const form = document.getElementById(formId);
    if (form) {
        form.classList.remove('hidden');
        onOpen();
        form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    closeFabMenu();
}

// --- Form Toggles ---

export function toggleForm() {
    openForm('form-window', () => {
        if (!getState().editingEntryId) {
            clearForm('form-window');
            resetCrumbFormState();
        }
        renderMoodSelector();
        document.getElementById('datetime-input').value = new Date().toISOString().slice(0, 16);
    });
}

export function toggleTimer() {
    openForm('timer-window', () => {
        if (!getState().editingEntryId) {
            clearForm('timer-window');
            resetTimerFormState();
        }
        renderTimerOptions();
        document.getElementById('datetime-input-time').value = new Date().toISOString().slice(0, 16);
    });
}

export function toggleTrack() {
    openForm('track-window', () => {
        if (!getState().editingEntryId) {
            clearForm('track-window');
            resetTrackFormState();
        }
        renderTrackSelector();
        document.getElementById('datetime-input-track').value = new Date().toISOString().slice(0, 16);
    });
}

export function toggleSpent() {
    openForm('spent-window', () => {
        if (!getState().editingEntryId) {
            clearForm('spent-window');
            resetSpentFormState();
        }
        document.getElementById('datetime-input-spent').value = new Date().toISOString().slice(0, 16);
    });
}

export function showRecapForm() {
    openForm('recap-form', () => {
        if (!getState().editingEntryId) {
            clearForm('recap-form');
            resetRecapFormState();
        }
        document.getElementById('datetime-input-recap').value = new Date().toISOString().slice(0, 16);
    });
}

export function closeRecapForm() {
    document.getElementById('recap-form').classList.add('hidden');
    resetRecapFormState();
}

/**
 * Handles the "Cancel" button on the main crumb form.
 */
export function cancelEdit() {
    resetCrumbFormState();
    // toggleForm(); // Will re-open a clean form
    // Let's just close it.
    hideAllForms();
}

// --- Form Selections ---

export function selectMood(index) {
    setState({ selectedMood: index });
    renderMoodSelector(); // Re-render to show selection
}

export function toggleMoodConfig() {
    const config = document.getElementById('mood-config');
    if (config) {
        config.classList.toggle('hidden');
        if (!config.classList.contains('hidden')) {
            renderMoodConfig();
        }
    }
}

export function selectDuration(minutes) {
    setState({ selectedDuration: minutes });
    renderTimerOptions(); // Re-renders both selectors
}

export function selectActivity(activity) {
    setState({ selectedActivity: activity });
    renderTimerOptions(); // Re-renders both selectors
}

export function selectTrackItem(item) {
    setState({ selectedTrackItem: item });
    renderTrackSelector(); // Re-render to show selection
    document.getElementById('save-track-btn').disabled = false;
}

// --- Recap BSO (Soundtrack) Handlers ---

export async function handleBsoSearch() {
    const query = document.getElementById('recap-bso').value.trim();
    if (!query) {
        alert('Please enter a song or artist name');
        return;
    }
    
    const resultsDiv = document.getElementById('recap-bso-results');
    resultsDiv.innerHTML = '<div style="padding: 12px; text-align: center;">Searching...</div>';
    
    const results = await searchiTunesTracks(query);
    renderBsoResults(results);
}

export function selectTrack(trackName, artistName, url, artwork) {
    const trackData = {
        name: trackName,
        artist: artistName,
        url: url,
        artwork: artwork
    };
    
    document.getElementById('recap-selected-track').value = JSON.stringify(trackData);
    renderSelectedBsoTrack(trackData);
}


// --- Entry Editing ---

/**
 * Prepares a form to edit an existing entry.
 * @param {string} id - The ID of the entry to edit.
 */
export function editEntry(id) {
    const { entries } = getState();
    const entry = entries.find(e => e.id == id); // Use == for compatibility
    if (!entry) return;

    // Set the global editing ID
    setState({ editingEntryId: entry.id });

    // Find which form to open and populate
    if (entry.type === 'time' || entry.isTimedActivity) {
        openForm('timer-window', () => populateTimerForm(entry));
    } else if (entry.type === 'track' || entry.isQuickTrack) {
        openForm('track-window', () => populateTrackForm(entry));
    } else if (entry.type === 'spent' || entry.isSpent) {
        openForm('spent-window', () => populateSpentForm(entry));
    } else if (entry.type === 'recap') {
        openForm('recap-form', () => populateRecapForm(entry));
    } else {
        // Default to 'crumb'
        openForm('form-window', () => populateCrumbForm(entry));
    }
}


// --- Entry Preview ---

/**
 * Shows the preview modal for a specific entry.
 * @param {string} id - The ID of the entry to preview.
 * @param {number} [imageIndex] - Optional index of an image to show directly.
 */
export function previewEntry(id, imageIndex = null) {
    const { entries } = getState();
    const entry = entries.find(e => e.id == id);
    if (!entry) return;

    const modal = document.getElementById('preview-modal');
    const body = document.getElementById('preview-body');
    
    // This is a special case: user clicked a thumbnail in the timeline
    // to see a specific image.
    if (imageIndex !== null && entry.images && entry.images[imageIndex]) {
        body.innerHTML = `
            <div style="text-align: center; padding: 20px;">
                <img src="${entry.images[imageIndex]}" style="max-width: 100%; max-height: 80vh; border: 2px solid #000;">
            </div>
        `;
        modal.classList.add('show');
        return;
    }

    // Standard full preview (Move full HTML from app.js here)
    // NOTE: This is the full HTML from your original app.js, now living here.
    let html = `
        <div style="margin-bottom: 16px;">
            <strong>Time:</strong> ${new Date(entry.timestamp).toLocaleString('en-GB')}
        </div>
        
        ${entry.mood ? `
            <div style="margin-bottom: 16px;">
                <strong>Mood:</strong> <span style="font-size: 24px;">${entry.mood.emoji}</span> ${entry.mood.label}
            </div>
        ` : ''}
        
        <div style="margin-bottom: 16px;">
            <strong>Note:</strong>
            <div style="margin-top: 8px; line-height: 1.6; white-space: pre-wrap; max-height: 200px; overflow-y: auto; background: #fff; padding: 5px; border: 1px solid #999;">${entry.note || ''}</div>
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
                        <img src="${img}" class="preview-image-full" data-entry-id="${entry.id}" data-image-index="${idx}">
                    `).join('')}
                </div>
            </div>
        ` : ''}
        
        ${entry.isTimedActivity ? `
            <div style="margin-bottom: 16px;">
                <strong>Activity:</strong> ${entry.activity} (${entry.duration} minutes)
                ${entry.optionalNote ? `<div style="margin-top: 8px; line-height: 1.6; white-space: pre-wrap; font-style: italic; background: #fff; padding: 5px; border: 1px solid #999;">${entry.optionalNote}</div>` : ''}
            </div>
        ` : ''}
        
        ${entry.isQuickTrack && entry.optionalNote ? `
            <div style="margin-bottom: 16px;">
                <strong>Optional Note:</strong>
                <div style="margin-top: 8px; line-height: 1.6; white-space: pre-wrap; font-style: italic; background: #fff; padding: 5px; border: 1px solid #999;">${entry.optionalNote}</div>
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
    
    // Render Leaflet map if coords exist
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


/**
 * Closes the preview modal.
 * @param {Event} [event] - Optional click event (for background click).
 */
export function closePreview(event) {
    // Check for background click (id === 'preview-modal')
    // or close button (closest('.mac-title-bar button'))
    if (event && !event.target.id === 'preview-modal' && !event.target.closest('#preview-close-btn')) return;

    const modal = document.getElementById('preview-modal');
    modal.classList.remove('show');
    document.getElementById('preview-body').innerHTML = ''; // Clear content
}


// --- FAB Menu ---

export function toggleFabMenu() {
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
            }, (fabActions.length - index - 1) * 30);
        });
    }
}

export function closeFabMenu() {
    if (fabMenuOpen) {
        toggleFabMenu();
    }
}

// FAB Action wrappers
export function toggleCrumb() {
    closeFabMenu();
    toggleForm();
}
export function toggleTime() {
    closeFabMenu();
    toggleTimer();
}
export function toggleTrackFab() { // Renamed to avoid conflict
    closeFabMenu();
    toggleTrack();
}
export function toggleSpentFab() { // Renamed to avoid conflict
    closeFabMenu();
    toggleSpent();
}
export function showRecapFormWithFab() { // Renamed to avoid conflict
    closeFabMenu();
    showRecapForm();
}

// --- Timeline Toggles ---

export function toggleReadMore(id) {
    const noteEl = document.getElementById(`note-${id}`);
    const btnEl = document.getElementById(`read-more-${id}`);
    if (noteEl) {
        noteEl.classList.toggle('expanded');
        btnEl.textContent = noteEl.classList.contains('expanded') ? 'Show less' : 'Read more';
    }
}

export function toggleDay(dayKey) {
    const content = document.getElementById(`day-content-${dayKey}`);
    const chevron = document.getElementById(`chevron-${dayKey}`);
    content?.classList.toggle('expanded');
    chevron?.classList.toggle('expanded');
}

export function toggleRecap(recapId) {
    const content = document.getElementById(`recap-content-${recapId}`);
    const chevron = document.getElementById(`chevron-recap-${recapId}`);
    content?.classList.toggle('hidden');
    chevron?.classList.toggle('expanded');
}
