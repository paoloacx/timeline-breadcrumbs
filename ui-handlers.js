// ===== ui-handlers.js (Event Listeners & UI Logic) =====

// Imports
// CAMBIO: La ruta ahora apunta a 'core/state.js'
import { getState, setEditingId, setSelectedMood, setSelectedDuration, setSelectedActivity, setSelectedTrackItem } from './core/state.js';
import { handleSaveCrumb, handleSaveTime, handleSaveTrack, handleSaveSpent, handleSaveRecap, handleDeleteEntry } from './crud-handlers.js';
// CAMBIO: La ruta ahora apunta a 'modules/services/api-services.js'
import { handleGps, handleSearchBSO } from './modules/services/api-services.js';
import { handleImageInput, startRecording, stopRecording, removeImage, removeAudio } from './media-handlers.js';
// CHANGED: Added exportFullBackup
import { openStats, exportCSV, exportICS, openExportModal, performExport, exportFullBackup } from './modules/data/data-tools.js';
// REMOVED: toggleMoodConfig
import { openSettings, saveSettings, updateTimerOptions, updateTrackOptions, checkTimerReady, checkTrackReady, handleImportBackup } from './modules/settings/settings-manager.js';
import { renderMoodSelector, renderImagePreviews, renderAudioPreview, selectTrackUI } from './ui-renderer.js';

// NEW: Import GDrive handlers
// --- CHANGED: Import all GDrive functions ---
import { handleSignIn, handleSignOut, manualBackupToDrive, manualRestoreFromDrive } from './modules/services/gdrive-service.js';

import { initFabMenu } from './modules/ui/fab-menu.js';
// CHANGED: Imported openModal
import { initModalManager, openCrumbForm, openTimerForm, openTrackForm, openSpentForm, openRecapForm, toggleUserMenu, closeModal, openModal } from './modules/ui/modal-manager.js';
import { initTimeline } from './modules/timeline/timeline.js';


// --- Main UI Initialization ---

/**
 * Opens the new Tools & Account modal.
 */
function openToolsModal() {
    openModal('tools-modal');
}

/**
 * Attaches all persistent event listeners to the DOM.
 */
export function initUI(onOfflineCallback) {
    
    // --- Auth Buttons (optional - may not exist during redirect flow) ---
    
    const btnSigninGdrive = document.getElementById('btn-signin-gdrive');
    if (btnSigninGdrive) {
        btnSigninGdrive.addEventListener('click', handleSignIn);
    }

    const btnContinueOffline = document.getElementById('btn-continue-offline');
    if (btnContinueOffline) {
        btnContinueOffline.addEventListener('click', onOfflineCallback);
    }

    // --- Header / User Menu ---
    
    // NEW: Open Tools Modal
    document.getElementById('btn-open-tools').addEventListener('click', openToolsModal);
    
    // MOVED: These listeners are now for the *modal's* avatar/signout
    // CHANGED: ID to match GDrive avatar
    document.getElementById('gdrive-user-avatar').addEventListener('click', (e) => toggleUserMenu(e, 'gdrive-logout-menu'));
    
    // NEW: GDrive Sign-out button
    document.getElementById('btn-gdrive-signout').addEventListener('click', () => {
        if (confirm('Sign out from Google Drive?')) {
            handleSignOut();
            // The listener in app.js (onGdriveSignOut) will handle the UI change
        }
    });

    
    // Close user menu on outside click
    document.addEventListener('click', (e) => {
        // CHANGED: ID to match GDrive menu
        const menu = document.getElementById('gdrive-logout-menu'); 
        // MODIFIED: Also check if click is inside the modal title bar
        if (menu && !e.target.closest('#gdrive-user-avatar') && !e.target.closest('.modal-title-bar-actions')) {
            menu.classList.remove('show');
        }
    });

    // --- Top Action Buttons (REMOVED) ---
    // --- Footer Buttons (REMOVED) ---

    // --- Inicializa el módulo FAB ---
    initFabMenu({
        openCrumbForm,
        openTimerForm,
        openTrackForm,
        openSpentForm,
        openRecapForm
    });

    // --- Inicializa el módulo de Modales ---
    initModalManager();
    
    // (La llamada a initTimeline() está en app.js)

    // --- NEW: Tools Modal Listeners ---
    document.getElementById('btn-close-tools').addEventListener('click', () => closeModal('tools-modal'));
    document.getElementById('btn-tools-stats').addEventListener('click', () => {
        openStats();
        closeModal('tools-modal'); // Close tools modal when opening another
    });
    document.getElementById('btn-tools-csv').addEventListener('click', () => {
        openExportModal('csv');
        closeModal('tools-modal');
    });
    document.getElementById('btn-tools-ics').addEventListener('click', () => {
        openExportModal('ics');
        closeModal('tools-modal');
    });
    document.getElementById('btn-tools-settings').addEventListener('click', () => {
        openSettings();
        closeModal('tools-modal');
    });
    // NEW: Listener for the backup button
    document.getElementById('btn-tools-backup').addEventListener('click', () => {
        exportFullBackup();
        closeModal('tools-modal');
    });
    // NEW: Listener for the import button
    document.getElementById('btn-tools-import').addEventListener('click', () => {
        handleImportBackup();
        closeModal('tools-modal');
    });
    // NEW: Listener for the offline sign-in button
    document.getElementById('btn-tools-signin').addEventListener('click', () => {
        closeModal('tools-modal');
        handleSignIn(); // Call the same sign-in function
    });
    // --- NEW: GDrive Manual Sync Listeners ---
    document.getElementById('btn-tools-gdrive-backup').addEventListener('click', () => {
        manualBackupToDrive();
        closeModal('tools-modal');
    });
    document.getElementById('btn-tools-gdrive-restore').addEventListener('click', () => {
        manualRestoreFromDrive();
        closeModal('tools-modal');
    });


    // --- Crumb Form ---
    // REMOVED: document.getElementById('btn-toggle-mood-config').addEventListener('click', toggleMoodConfig);
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
    
    // --- Collapsible sections in Crumb Form ---
    document.getElementById('crumb-modal').addEventListener('click', (e) => {
        const header = e.target.closest('.form-section-header');
        if (!header) return;

        const targetId = header.dataset.target;
        const content = document.getElementById(targetId);
        const chevron = header.querySelector('.chevron');

        if (content && chevron) {
            content.classList.toggle('expanded'); // MODIFIED: Toggle .expanded
            chevron.classList.toggle('expanded');
        }
    });
    
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
            // Llama a la función de UI-Renderer
            selectTrackUI(target.dataset);
        }
    });
    
    // --- CAMBIO: EL BLOQUE 'TIMELINE EVENT DELEGATION' SE HA ELIMINADO ---
}
