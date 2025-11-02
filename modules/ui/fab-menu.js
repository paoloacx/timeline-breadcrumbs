// ===== modules/ui/fab-menu.js (FAB Menu Module) =====

// --- Private Module State ---
let fabMenuOpen = false;

// --- Private Functions ---

/**
 * Toggles the visibility and animation of the FAB menu.
 */
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

/**
 * Closes the FAB menu if it's open.
 */
function closeFabMenu() {
    if (fabMenuOpen) {
        toggleFabMenu();
    }
}

// --- Public Initialization Function ---

/**
 * Initializes all event listeners for the FAB menu.
 * @param {object} formActions - An object containing functions to open forms.
 * @param {function} formActions.openCrumbForm
 * @param {function} formActions.openTimerForm
 * @param {function} formActions.openTrackForm
 * @param {function} formActions.openSpentForm
 * @param {function} formActions.openRecapForm
 */
export function initFabMenu(formActions) {
    document.getElementById('fab-main').addEventListener('click', toggleFabMenu);
    
    document.getElementById('fab-action-crumb').addEventListener('click', () => { 
        closeFabMenu(); 
        formActions.openCrumbForm(); 
    });
    
    document.getElementById('fab-action-time').addEventListener('click', () => { 
        closeFabMenu(); 
        formActions.openTimerForm(); 
    });
    
    document.getElementById('fab-action-track').addEventListener('click', () => { 
        closeFabMenu(); 
        formActions.openTrackForm(); 
    });
    
    document.getElementById('fab-action-spent').addEventListener('click', () => { 
        closeFabMenu(); 
        formActions.openSpentForm(); 
    });
    
    document.getElementById('fab-action-recap').addEventListener('click', () => { 
        closeFabMenu(); 
        formActions.openRecapForm(); 
    });
}
