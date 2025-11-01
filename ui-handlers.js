// ===== ui-handlers.js (Event Listeners & UI Logic) =====

// Imports
import { getState, setEditingId, setSelectedMood, setSelectedDuration, setSelectedActivity, setSelectedTrackItem, clearFormState, clearTimerState, clearTrackState, clearSpentState, clearRecapState } from './state.js';
import { handleSaveCrumb, handleSaveTime, handleSaveTrack, handleSaveSpent, handleSaveRecap, handleDeleteEntry, handleEditEntry, handlePreviewEntry } from './crud-handlers.js';
import { handleGps, handleSearchBSO } from './api-services.js';
import { handleImageInput, startRecording, stopRecording, removeImage, removeAudio } from './media-handlers.js';
import { openStats, exportCSV, exportICS, openExportModal, performExport } from './data-tools.js';
import { openSettings, toggleMoodConfig, saveSettings, updateTimerOptions, updateTrackOptions, checkTimerReady, checkTrackReady } from './settings-manager.js';
import { renderMoodSelector, renderImagePreviews, renderAudioPreview, selectTrackUI } from './ui-renderer.js';
import { setCurrentDateTime } from './utils.js';
import { signInWithGoogle, signInWithEmail, signOutUser } from './firebase-config.js';

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

// --- Auth/Main App UI ---

/**
 * Shows the main app UI and hides the auth panel.
 * @param {object|null} user - The Firebase user object, or null for offline.
 */
export function showMainApp(user) {
    document.getElementById('auth-container').style.display = 'none';
    document.getElementById('main-app').style.display = 'block';
    
    if (user) {
        const email = user.email;
        document.getElementById('user-icon').textContent = '👤';
        document.getElementById('user-email-full').textContent = email;
        document.getElementById('btn-user-avatar').style.display = 'block';
    } else {
        document.getElementById('btn-user-avatar').style.display = 'none';
    }
}

/**
 * Toggles the visibility of the user logout menu.
 * @param {Event} e - The click event.
 */
export function toggleUserMenu(e) {
    e.stopPropagation();
    const menu = document.getElementById('logout-menu');
    menu.classList.toggle('show');
}

// --- Form Toggle Functions (now open modals) ---

export function openCrumbForm(entry = null) {
    if (entry) {
        handleEditEntry(entry); // Rellena el formulario
    } else {
        clearFormState();
        document.getElementById('note-input').value = '';
        document.getElementById('location-input').value = '';
        document.getElementById('weather-input').value = '';
        document.getElementById('image-previews').innerHTML = '';
        document.getElementById('audio-preview').innerHTML = '';
        document.getElementById('delete-btn-crumb').classList.add('hidden');
        document.getElementById('save-btn-crumb').textContent = '💾 Save';
        document.getElementById('mood-config').classList.add('hidden');
        const mapContainer = document.getElementById('form-map');
        if (mapContainer) {
            mapContainer.style.display = 'none';
            mapContainer.innerHTML = '';
        }
        renderMoodSelector();
        setCurrentDateTime('datetime-input');
    }
    openModal('crumb-modal');
}

export function openTimerForm(entry = null) {
    if (entry) {
        handleEditEntry(entry); // Rellena el formulario
    } else {
        clearTimerState();
        document.getElementById('time-optional-note').value = '';
        document.getElementById('btn-save-time').textContent = 'Create Event';
        document.getElementById('btn-delete-time').classList.add('hidden');
        updateTimerOptions(); // Re-renderiza para limpiar selección
        checkTimerReady();
        setCurrentDateTime('datetime-input-time');
    }
    openModal('timer-modal');
}

export function openTrackForm(entry = null) {
    if (entry) {
        handleEditEntry(entry); // Rellena el formulario
    } else {
        clearTrackState();
        document.getElementById('track-optional-note').value = '';
        document.getElementById('btn-save-track').textContent = 'Save Track';
        document.getElementById('btn-delete-track').classList.add('hidden');
        updateTrackOptions(); // Re-renderiza para limpiar selección
        checkTrackReady();
        setCurrentDateTime('datetime-input-track');
    }
    openModal('track-modal');
}

export function openSpentForm(entry = null) {
    if (entry) {
        handleEditEntry(entry); // Rellena el formulario
    } else {
        clearSpentState();
        document.getElementById('spent-description').value = '';
        document.getElementById('spent-amount').value = '';
        document.getElementById('btn-delete-spent').classList.add('hidden');
        setCurrentDateTime('datetime-input-spent');
    }
    openModal('spent-modal');
}

export function openRecapForm(entry = null) {
    if (entry) {
        handleEditEntry(entry); // Rellena el formulario
    } else {
        clearRecapState();
        document.getElementById('recap-reflection').value = '';
        document.getElementById('recap-rating').value = '5';
        document.getElementById('recap-rating-value').textContent = '5';
        document.getElementById('recap-highlight-1').value = '';
        document.getElementById('recap-highlight-2').value = '';
        document.getElementById('recap-highlight-3').value = '';
        document.getElementById('recap-bso').value = '';
        document.getElementById('recap-bso-results').innerHTML = '';
        document.getElementById('recap-selected-track').value = '';
        document.getElementById('btn-delete-recap').classList.add('hidden');
        setCurrentDateTime('datetime-input-recap');
    }
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
export function initUI(onOfflineCallback) {
    
    // --- Auth Buttons ---
    document.getElementById('btn-signin-google').addEventListener('click', signInWithGoogle);
    document.getElementById('btn-signin-email').addEventListener('click', signInWithEmail);
    document.getElementById('btn-continue-offline').addEventListener('click', onOfflineCallback);

    // --- Header / User Menu ---
    document.getElementById('btn-sync').addEventListener('click', () => location.reload());
    document.getElementById('btn-user-avatar').addEventListener('click', (e) => toggleUserMenu(e));
    document.getElementById('btn-signout').addEventListener('click', signOutUser);
    // Close user menu on outside click
    document.addEventListener('click', (e) => {
        const menu = document.getElementById('logout-menu');
        if (menu && !e.target.closest('#btn-user-avatar')) {
            menu.classList.remove('show');
        }
    });

    // --- Top Action Buttons ---
    document.getElementById('btn-toggle-crumb').addEventListener('click', () => openCrumbForm());
    document.getElementById('btn-toggle-timer').addEventListener('click', () => openTimerForm());
    document.getElementById('btn-toggle-track').addEventListener('click', () => openTrackForm());
    document.getElementById('btn-toggle-spent').addEventListener('click', () => openSpentForm());

    // --- Footer Buttons ---
    document.getElementById('btn-open-stats').addEventListener('click', openStats);
    document.getElementById('btn-export-csv').addEventListener('click', () => openExportModal('csv'));
    document.getElementById('btn-export-ics').addEventListener('click', () => openExportModal('ics'));
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
            if (e.target.classList.contains('preview-modal')) {
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
    
    // --- Export Modal ---
    document.getElementById('btn-perform-export').addEventListener('click', performExport);

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
            updateTimerOptions(); // Re-render
            checkTimerReady();
        }
    });

    // Activity Selector
    document.getElementById('activity-selector').addEventListener('click', (e) => {
        const target = e.target.closest('.activity-option');
        if (target && target.dataset.activity) {
            setSelectedActivity(target.dataset.activity);
            updateTimerOptions(); // Re-render
            checkTimerReady();
        }
    });
    
    // Track Selector
    document.getElementById('track-selector').addEventListener('click', (e) => {
        const target = e.target.closest('.activity-option');
        if (target && target.dataset.item) {
            setSelectedTrackItem(target.dataset.item);
            updateTrackOptions(); // Re-render
            checkTrackReady();
        }
    });

    // Image Previews (Remove)
    document.getElementById('image-previews').addEventListener('click', (e) => {
        const target = e.target.closest('.image-remove');
        if (target && target.dataset.index) {
            removeImage(parseInt(target.dataset.index, 10));
        }
    });

    // Audio Preview (Remove)
    document.getElementById('audio-preview').addEventListener('click', (e) => {
        const target = e.target.closest('.audio-remove');
        if (target) {
            removeAudio();
        }
    });

    // BSO Results (Select)
    document.getElementById('recap-bso-results').addEventListener('click', (e) => {
        const target = e.target.closest('.bso-result');
        if (target) {
            selectTrackUI(target.dataset);
        }
    });
    
    // --- TIMELINE EVENT DELEGATION ---
    document.getElementById('timeline-container').addEventListener('click', (e) => {
        const entryEl = e.target.closest('.breadcrumb-entry, .recap-block');
        if (!entryEl) return; // Clicked on empty space

        const id = entryEl.dataset.id;
        
        // Handle Edit
        if (e.target.closest('.btn-edit')) {
            e.stopPropagation();
            handleEditEntry(id);
            return;
        }
        
        // Handle Preview
        if (e.target.closest('.btn-preview')) {
            e.stopPropagation();
            handlePreviewEntry(id);
            return;
        }

        // Handle Image Click
        if (e.target.closest('.preview-image-thumb')) {
            e.stopPropagation();
            const imageIndex = e.target.dataset.index;
            handlePreviewEntry(id, imageIndex); // Preview specific image
            return;
        }

        // Handle Map Click
        if (e.target.closest('.preview-map-thumb')) {
            e.stopPropagation();
            handlePreviewEntry(id);
            return;
        }
        
        // Handle Read More
        if (e.target.closest('.read-more-btn')) {
            e.stopPropagation();
            const noteEl = entryEl.querySelector('.breadcrumb-note, .optional-note');
            if (noteEl) {
                noteEl.classList.toggle('expanded');
                e.target.textContent = noteEl.classList.contains('expanded') ? 'Show less' : 'Read more';
            }
            return;
        }

        // Handle Toggle Day
        if (e.target.closest('.day-header')) {
            const dayKey = e.target.closest('.day-block').dataset.day;
            const content = document.getElementById(`day-content-${dayKey}`);
            const chevron = document.getElementById(`chevron-${dayKey}`);
            if (content) content.classList.toggle('expanded');
            if (chevron) chevron.classList.toggle('expanded');
            return;
        }

        // Handle Toggle Recap
        if (e.target.closest('.recap-header')) {
            const content = entryEl.querySelector('.recap-content');
            const chevron = entryEl.querySelector('.chevron-recap');
            if (content) content.classList.toggle('hidden');
            if (chevron) chevron.classList.toggle('expanded');
            return;
        }
    });
}
