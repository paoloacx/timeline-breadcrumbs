// ===== ui-handlers.js (Event Listeners & UI Logic) =====

// Imports
import { getState, setEditingId, setSelectedMood, setSelectedDuration, setSelectedActivity, setSelectedTrackItem, clearFormState, clearTimerState, clearTrackState, clearSpentState, clearRecapState, setOfflineMode } from './state.js';
import { handleSaveCrumb, handleSaveTime, handleSaveTrack, handleSaveSpent, handleSaveRecap, handleDeleteEntry } from './crud-handlers.js';
import { handleGps, handleSearchBSO } from './api-services.js';
import { handleImageInput, startRecording, stopRecording } from './media-handlers.js';
import { openStats, exportCSV, exportICS } from './data-tools.js';
import { openSettings, toggleMoodConfig, saveSettings } from './settings-manager.js';
import { renderMoodSelector, renderImagePreviews, renderAudioPreview, removeImagePreview, removeAudioPreview } from './ui-renderer.js';
import { setCurrentDateTime } from './utils.js';

// --- Modal Management ---

/**
 * Opens a modal dialog.
 * @param {string} modalId The ID of the modal to show.
 */
export function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('show');
    }
}

/**
 * Closes a modal dialog.
 * @param {string} modalId The ID of the modal to hide.
 */
export function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('show');
    }
}

// --- Form Toggle Functions (now open modals) ---

function openCrumbForm(entry = null) {
    if (entry) {
        setEditingId(entry.id);
        // (La lógica de rellenar el formulario se moverá a crud-handlers.js 'handleEditEntry')
    } else {
        clearFormState();
        // (La lógica de limpiar el formulario se moverá a crud-handlers.js 'handleNewEntry')
    }
    // (temporalmente, la lógica de limpiar/rellenar sigue en crud-handlers)
    setCurrentDateTime('datetime-input');
    renderMoodSelector();
    openModal('crumb-modal');
}

function openTimerForm(entry = null) {
    if (!entry) {
        clearTimerState();
    }
    setCurrentDateTime('datetime-input-time');
    openModal('timer-modal');
}

function openTrackForm(entry = null) {
    if (!entry) {
        clearTrackState();
    }
    setCurrentDateTime('datetime-input-track');
    openModal('track-modal');
}

function openSpentForm(entry = null) {
    if (!entry) {
        clearSpentState();
    }
    setCurrentDateTime('datetime-input-spent');
    openModal('spent-modal');
}

function openRecapForm(entry = null) {
    if (!entry) {
        clearRecapState();
    }
    setCurrentDateTime('datetime-input-recap');
    openModal('recap-modal');
}

// --- FAB Menu Logic ---
let fabMenuOpen = false;
function toggleFabMenu() {
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
function closeFabMenu() {
    if (fabMenuOpen) {
        toggleFabMenu();
    }
}

// --- Main UI Initialization ---

/**
 * Attaches all persistent event listeners to the DOM.
 */
export function initUI() {
    
    // --- Auth Buttons ---
    document.getElementById('btn-signin-google').addEventListener('click', window.signInWithGoogle); // Still global for now
    document.getElementById('btn-signin-email').addEventListener('click', window.signInWithEmail); // Still global for now
    document.getElementById('btn-continue-offline').addEventListener('click', () => {
        setOfflineMode(true);
        window.continueOffline(); // Still global for now
    });

    // --- Header / User Menu ---
    document.getElementById('btn-sync').addEventListener('click', () => location.reload()); // Simple reload
    document.getElementById('btn-user-avatar').addEventListener('click', (e) => window.toggleUserMenu(e)); // Still global
    document.getElementById('btn-signout').addEventListener('click', () => window.signOutUser()); // Still global

    // --- Top Action Buttons ---
    document.getElementById('btn-toggle-crumb').addEventListener('click', () => openCrumbForm());
    document.getElementById('btn-toggle-timer').addEventListener('click', () => openTimerForm());
    document.getElementById('btn-toggle-track').addEventListener('click', () => openTrackForm());
    document.getElementById('btn-toggle-spent').addEventListener('click', () => openSpentForm());

    // --- Footer Buttons ---
    document.getElementById('btn-open-stats').addEventListener('click', openStats);
    document.getElementById('btn-export-csv').addEventListener('click', exportCSV);
    document.getElementById('btn-export-ics').addEventListener('click', exportICS);
    document.getElementById('btn-open-settings').addEventListener('click', openSettings);

    // --- FAB Menu ---
    document.getElementById('fab-main').addEventListener('click', toggleFabMenu);
    document.getElementById('fab-action-crumb').addEventListener('click', () => { closeFabMenu(); openCrumbForm(); });
    document.getElementById('fab-action-time').addEventListener('click', () => { closeFabMenu(); openTimerForm(); });
    document.getElementById('fab-action-track').addEventListener('click', () => { closeFabMenu(); openTrackForm(); });
    document.getElementById('fab-action-spent').addEventListener('click', () => { closeFabMenu(); openSpentForm(); });
    document.getElementById('fab-action-recap').addEventListener('click', () => { closeFabMenu(); openRecapForm(); });

    // --- Modal Close Buttons (Generic) ---
    document.querySelectorAll('.btn-modal-close, .btn-modal-cancel').forEach(btn => {
        btn.addEventListener('click', () => {
            const modal = btn.closest('.preview-modal');
            if (modal) {
                closeModal(modal.id);
            }
        });
    });
    // Backdrop click to close
    document.querySelectorAll('.preview-modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target.id === modal.id) {
                closeModal(modal.id);
            }
        });
    });

    // --- Crumb Form ---
    document.getElementById('btn-toggle-mood-config').addEventListener('click', toggleMoodConfig);
    document.getElementById('btn-get-gps').addEventListener('click', handleGps);
    document.getElementById('input-images').addEventListener('change', handleImageInput);
    document.getElementById('btn-record-start').addEventListener('click', startRecording);
    document.getElementById('btn-record-stop').addEventListener('click', stopRecording);
    document.getElementById('btn-save-crumb').addEventListener('click', handleSaveCrumb);
    document.getElementById('btn-delete-crumb').addEventListener('click', handleDeleteEntry);

    // --- Timer Form ---
    document.getElementById('btn-save-time').addEventListener('click', handleSaveTime);
    document.getElementById('btn-delete-time').addEventListener('click', handleDeleteEntry);

    // --- Track Form ---
    document.getElementById('btn-save-track').addEventListener('click', handleSaveTrack);
    document.getElementById('btn-delete-track').addEventListener('click', handleDeleteEntry);

    // --- Spent Form ---
    document.getElementById('btn-save-spent').addEventListener('click', handleSaveSpent);
    document.getElementById('btn-delete-spent').addEventListener('click', handleDeleteEntry);
    
    // --- Recap Form ---
    document.getElementById('btn-search-bso').addEventListener('click', handleSearchBSO);
    document.getElementById('btn-save-recap').addEventListener('click', handleSaveRecap);
    document.getElementById('btn-delete-recap').addEventListener('click', handleDeleteEntry);
    document.getElementById('recap-rating').addEventListener('input', (e) => {
        document.getElementById('recap-rating-value').textContent = e.target.value;
    });

    // --- Settings Modal ---
    document.getElementById('btn-save-settings').addEventListener('click', saveSettings);
    
    // --- EVENT DELEGATION for dynamic content ---
    
    // Mood Selector
    document.getElementById('mood-selector').addEventListener('click', (e) => {
        const target = e.target.closest('.mood-option');
        if (target && target.dataset.index) {
            setSelectedMood(parseInt(target.dataset.index, 10));
            renderMoodSelector(); // Re-render to show selection
        }
    });

    // Duration Selector
    document.getElementById('duration-selector').addEventListener('click', (e) => {
        const target = e.target.closest('.duration-option');
        if (target && target.dataset.duration) {
            setSelectedDuration(parseInt(target.dataset.duration, 10));
            // (La lógica de re-renderizar está en settings-manager)
        }
    });

    // Activity Selector
    document.getElementById('activity-selector').addEventListener('click', (e) => {
        const target = e.target.closest('.activity-option');
        if (target && target.dataset.activity) {
            setSelectedActivity(target.dataset.activity);
            // (La lógica de re-renderizar está en settings-manager)
        }
    });
    
    // Track Selector
    document.getElementById('track-selector').addEventListener('click', (e) => {
        const target = e.target.closest('.activity-option');
        if (target && target.dataset.item) {
            setSelectedTrackItem(target.dataset.item);
            // (La lógica de re-renderizar está en settings-manager)
        }
    });

    // Image Previews (Remove)
    document.getElementById('image-previews').addEventListener('click', (e) => {
        const target = e.target.closest('.image-remove');
        if (target && target.dataset.index) {
            removeImagePreview(parseInt(target.dataset.index, 10));
        }
    });

    // Audio Preview (Remove)
    document.getElementById('audio-preview').addEventListener('click', (e) => {
        const target = e.target.closest('.audio-remove');
        if (target) {
            removeAudioPreview();
        }
    });

    // BSO Results (Select)
    document.getElementById('recap-bso-results').addEventListener('click', (e) => {
        const target = e.target.closest('.bso-result');
        if (target) {
            // (La lógica de seleccionar la pista se moverá a api-services)
            window.selectTrack(target.dataset.name, target.dataset.artist, target.dataset.url, target.dataset.artwork);
        }
    });
    
    // Timeline Container (Edit, Preview, Toggle Read More, etc.)
    document.getElementById('timeline-container').addEventListener('click', (e) => {
        const target = e.target;
        
        // (Toda la lógica de edit/preview/etc se moverá aquí)
        
        // if (target.closest('.btn-edit')) { ... }
        // if (target.closest('.btn-preview')) { ... }
        // if (target.closest('.read-more-btn')) { ... }
        // if (target.closest('.day-header')) { ... }
    });
}
