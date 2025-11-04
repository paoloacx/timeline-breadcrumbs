// ===== modules/ui/modal-manager.js (Modal Logic) =====

// Imports
import { clearFormState, clearTimerState, clearTrackState, clearSpentState, clearRecapState } from '../../core/state.js';
import { updateTimerOptions, updateTrackOptions, checkTimerReady, checkTrackReady } from '../../modules/settings/settings-manager.js';
import { renderMoodSelector } from '../../ui-renderer.js';
import { setCurrentDateTime } from '../../utils.js';
import { handleEditEntry } from '../../crud-handlers.js'; // Import handler

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
        
        // NEW: When closing preview, find and hide the static edit button
        if (modalId === 'preview-modal') {
            const editBtn = document.getElementById('btn-preview-edit');
            if (editBtn) {
                editBtn.classList.add('hidden');
                editBtn.dataset.id = ''; // Clear the ID
            }
        }
    }
}

// --- Auth/Main App UI ---

/**
 * Shows the main app UI and hides the auth panel.
 * @param {object|null} user - The Google user profile object, or null for offline.
 */
export function showMainApp(user) {
    document.getElementById('auth-container').style.display = 'none';
    document.getElementById('main-app').style.display = 'block';
    
    // CHANGED: Get new GDrive elements
    const avatar = document.getElementById('gdrive-user-avatar');
    const emailDisplay = document.getElementById('gdrive-user-email');
    const icon = document.getElementById('gdrive-user-icon');
    
    // NEW: Get the sign-in button and sync controls from the tools modal
    const signInButton = document.getElementById('btn-tools-signin');
    const syncControls = document.getElementById('gdrive-sync-controls');

    if (user) {
        // --- ONLINE STATE ---
        const email = user.email;
        
        // Clear default emoji and add profile image
        icon.innerHTML = ''; 
        const img = document.createElement('img');
        img.src = user.imageUrl;
        img.style.width = '24px';
        img.style.height = '24px';
        img.style.borderRadius = '50%';
        icon.appendChild(img);
        
        emailDisplay.textContent = email;
        avatar.style.display = 'flex'; // Use flex to show it
        
        // Hide the offline sign-in button
        if (signInButton) signInButton.classList.add('hidden');
        // --- NEW: Show the GDrive sync controls ---
        if (syncControls) syncControls.classList.remove('hidden');
        
    } else {
        // --- OFFLINE STATE ---
        avatar.style.display = 'none'; // Hide GDrive avatar
        
        // Show the offline sign-in button
        if (signInButton) signInButton.classList.remove('hidden');
        // --- NEW: Hide the GDrive sync controls ---
        if (syncControls) syncControls.classList.add('hidden');
    }
}

/**
 * Toggles the visibility of the user logout menu.
 * @param {Event} e - The click event.
 * @param {string} menuId - The ID of the menu to toggle.
 */
export function toggleUserMenu(e, menuId = 'gdrive-logout-menu') {
    e.stopPropagation();
    // CHANGED: Use the provided menuId instead of the hardcoded 'logout-menu'
    const menu = document.getElementById(menuId);
    if (menu) {
        menu.classList.toggle('show');
    }
}

// --- Form Toggle Functions (now open modals) ---

export function openCrumbForm(entry = null) {
    if (entry) {
        // La lógica de rellenar el formulario está en crud-handlers
    } else {
        // Lógica de limpieza (solo para entradas nuevas)
        clearFormState();
        document.getElementById('note-input').value = '';
        document.getElementById('location-input').value = '';
        document.getElementById('weather-input').value = '';
        document.getElementById('image-previews').innerHTML = '';
        document.getElementById('audio-preview').innerHTML = '';
        
        const deleteBtn = document.getElementById('btn-delete-crumb');
        if (deleteBtn) deleteBtn.classList.add('hidden');
        
        const saveBtn = document.getElementById('btn-save-crumb');
        if (saveBtn) saveBtn.textContent = '💾 Save';
        
        const moodConfig = document.getElementById('mood-config');
        if (moodConfig) moodConfig.classList.add('hidden');

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
    if (!entry) {
        clearTimerState();
        // REMOVED: document.getElementById('time-optional-note').value = '';
        document.getElementById('btn-save-time').textContent = 'Create Event';
        document.getElementById('btn-delete-time').classList.add('hidden');
        updateTimerOptions(); // Re-renderiza para limpiar selección
        checkTimerReady();
        setCurrentDateTime('datetime-input-time');
    }
    openModal('timer-modal');
}

export function openTrackForm(entry = null) {
    if (!entry) {
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
    if (!entry) {
        clearSpentState();
        document.getElementById('spent-description').value = '';
        document.getElementById('spent-amount').value = '';
        document.getElementById('btn-delete-spent').classList.add('hidden');
        setCurrentDateTime('datetime-input-spent');
    }
    openModal('spent-modal');
}

export function openRecapForm(entry = null) {
    if (!entry) {
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

/**
 * Initializes generic modal close listeners (backdrop and buttons).
 */
export function initModalManager() {
    
    // --- Listener for Close/Cancel buttons ---
    document.querySelectorAll('.btn-modal-close, .btn-modal-cancel').forEach(btn => {
        btn.addEventListener('click', () => {
            const modal = btn.closest('.preview-modal');
            if (modal) {
                closeModal(modal.id);
            }
        });
    });
    
    // --- Listener for Backdrop click ---
    document.querySelectorAll('.preview-modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            // Cierra solo si se hace clic en el fondo (el propio modal)
            if (e.target.classList.contains('preview-modal')) {
                closeModal(modal.id);
            }
        });
    });

    // --- Static listener for the Preview Edit Button ---
    const previewEditBtn = document.getElementById('btn-preview-edit');
    if (previewEditBtn) {
        previewEditBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent backdrop click
            const id = previewEditBtn.dataset.id;
            
            if (id) {
                closeModal('preview-modal');   // Close current modal
                handleEditEntry(id);         // Open edit form
            }
        });
    }
}
