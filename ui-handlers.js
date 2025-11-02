// ===== ui-handlers.js (Event Listeners & UI Logic) =====

// Imports
import { getState, setEditingId, setSelectedMood, setSelectedDuration, setSelectedActivity, setSelectedTrackItem } from './state.js';
import { handleSaveCrumb, handleSaveTime, handleSaveTrack, handleSaveSpent, handleSaveRecap, handleDeleteEntry, handleEditEntry, handlePreviewEntry } from './crud-handlers.js';
import { handleGps, handleSearchBSO } from './api-services.js';
import { handleImageInput, startRecording, stopRecording, removeImage, removeAudio } from './media-handlers.js';
// CAMBIO: La ruta de importación ahora apunta a 'modules/data/data-tools.js'
import { openStats, exportCSV, exportICS, openExportModal, performExport } from './modules/data/data-tools.js';
import { openSettings, toggleMoodConfig, saveSettings, updateTimerOptions, updateTrackOptions, checkTimerReady, checkTrackReady } from './settings-manager.js';
import { renderMoodSelector, renderImagePreviews, renderAudioPreview, selectTrackUI } from './ui-renderer.js';
import { signInWithGoogle, signInWithEmail, signOutUser } from './firebase-config.js';
import { initFabMenu } from './modules/ui/fab-menu.js';
import { initModalManager, openCrumbForm, openTimerForm, openTrackForm, openSpentForm, openRecapForm, toggleUserMenu, closeModal } from './modules/ui/modal-manager.js';


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
            // Llama a la función de UI-Renderer
            selectTrackUI(target.dataset);
        }
    });
    
    // --- TIMELINE EVENT DELEGATION ---
    document.getElementById('timeline-container').addEventListener('click', (e) => {
        
        // Handle Toggle Day
        const dayHeader = e.target.closest('.day-header');
        if (dayHeader) {
            const dayBlock = dayHeader.closest('.day-block');
            if (dayBlock) {
                const dayKey = dayBlock.dataset.day;
                const content = document.getElementById(`day-content-${dayKey}`);
                const chevron = document.getElementById(`chevron-${dayKey}`);
                if (content) content.classList.toggle('expanded');
                if (chevron) chevron.classList.toggle('expanded');
            }
            return; // Acción completada
        }

        // Handle Toggle Recap
        const recapHeader = e.target.closest('.recap-header');
        if (recapHeader) {
            const recapBlock = recapHeader.closest('.recap-block');
            if (recapBlock) {
                const content = recapBlock.querySelector('.recap-content');
                const chevron = recapBlock.querySelector('.chevron-recap');
                if (content) content.classList.toggle('hidden');
                if (chevron) chevron.classList.toggle('expanded');
            }
            return; // Acción completada
        }

        // Ahora, comprueba si el clic fue en un crumb
        const entryEl = e.target.closest('.breadcrumb-entry, .recap-block');
        
        if (!entryEl) return; // Si no fue en un crumb, no hacer nada más

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
    });
}
