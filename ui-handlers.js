// --- Manejadores de Interfaz de Usuario (UI) ---

// --- Funciones Principales de Navegación (Formularios) ---

/**
 * Muestra una ventana/formulario principal y oculta los demás.
 * @param {string} windowId - El ID del elemento de la ventana a mostrar (ej. 'form-window').
 */
function showMainWindow(windowId) {
    // Lista de todos los IDs de formularios principales
    const allWindows = [
        'form-window', 
        'timer-window', 
        'track-window', 
        'spent-window', 
        'recap-form'
    ];
    
    // Ocultar todas las ventanas
    allWindows.forEach(id => {
        const win = document.getElementById(id);
        if (win) {
            win.classList.add('hidden');
        }
    });
    
    // Mostrar la ventana solicitada
    const windowToShow = document.getElementById(windowId);
    if (windowToShow) {
        windowToShow.classList.remove('hidden');
        // Hacer scroll para que el formulario sea visible
        windowToShow.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// Funciones "toggle" que llaman al manejador principal
function toggleForm() {
    showMainWindow('form-window');
    clearForm();
    renderMoodSelector();
    setCurrentDateTime('datetime-input');
}

function toggleTimer() {
    showMainWindow('timer-window');
    resetTimerSelections();
    setCurrentDateTime('datetime-input-time');
}

function toggleTrack() {
    showMainWindow('track-window');
    renderTrackSelector();
    setCurrentDateTime('datetime-input-track');
    selectedTrackItem = null;
    document.getElementById('save-track-btn').disabled = true;
    document.getElementById('delete-track-btn').classList.add('hidden');
    document.getElementById('track-optional-note').value = '';
}

function toggleSpent() {
    showMainWindow('spent-window');
    document.getElementById('spent-description').value = '';
    document.getElementById('spent-amount').value = '';
    setCurrentDateTime('datetime-input-spent');
    document.getElementById('delete-spent-btn').classList.add('hidden');
}

function showRecapForm() {
    showMainWindow('recap-form');
    // Establecer fecha actual
    setCurrentDateTime('datetime-input-recap');
    
    // Resetear formulario (excepto el BSO)
    document.getElementById('recap-reflection').value = '';
    document.getElementById('recap-rating').value = '5';
    document.getElementById('recap-rating-value').textContent = '5';
    document.getElementById('recap-highlight-1').value = '';
    document.getElementById('recap-highlight-2').value = '';
    document.getElementById('recap-highlight-3').value = '';
    document.getElementById('generate-highlights-btn').disabled = false;
    document.getElementById('generate-highlights-btn').textContent = '✨ Generar';
}

function closeRecapForm() {
    const recapForm = document.getElementById('recap-form');
    if (recapForm) {
        recapForm.classList.add('hidden');
    }
    // Limpiar formulario al cerrar
    document.getElementById('recap-bso').value = '';
    document.getElementById('recap-bso-results').innerHTML = '';
    document.getElementById('recap-selected-track').value = '';
}


// --- Ayudantes de Formularios ---

// Limpia el formulario principal de "Crumb"
function clearForm() {
    document.getElementById('note-input').value = '';
    document.getElementById('location-input').value = '';
    document.getElementById('weather-input').value = '';
    currentImages = [];
    currentAudio = null;
    currentCoords = null;
    editingEntryId = null;
    selectedMood = null;
    document.getElementById('image-previews').innerHTML = '';
    document.getElementById('audio-preview').innerHTML = '';
    document.getElementById('delete-btn').classList.add('hidden');
    document.getElementById('save-btn').textContent = '💾 Save';
    document.getElementById('mood-config').classList.add('hidden');
    const mapContainer = document.getElementById('form-map');
    if (mapContainer) {
        mapContainer.style.display = 'none';
        mapContainer.innerHTML = '';
    }
}

// Cancela la edición de un "Crumb"
function cancelEdit() {
    clearForm();
    toggleForm();
}

// Establece la fecha y hora actual en un input datetime-local
function setCurrentDateTime(inputId) {
    const now = new Date();
    // Ajustar a la zona horaria local
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    const isoString = now.toISOString();
    
    // Formato YYYY-MM-DDTHH:mm
    const dateTimeString = isoString.substring(0, 16);
    const inputEl = document.getElementById(inputId);
    if (inputEl) {
        inputEl.value = dateTimeString;
    }
}

// Obtiene el timestamp (ISO string) desde un input datetime-local
function getTimestampFromInput(inputId) {
    const value = document.getElementById(inputId).value;
    if (!value) return new Date().toISOString();
    // Convertir la fecha local del input a un objeto Date y luego a ISO string
    return new Date(value).toISOString();
}

// --- Manejadores de Modales (Preview, Stats, Settings) ---

function previewEntry(id) {
    const entry = entries.find(e => e.id === id);
    if (!entry) return;

    const modal = document.getElementById('preview-modal');
    const body = document.getElementById('preview-body');
    
    let html = `
        <div style="margin-bottom: 16px;">
            <strong>Time:</strong> ${formatDate(entry.timestamp)} at ${formatTime(entry.timestamp)}
        </div>
        
        ${entry.mood ? `
            <div style="margin-bottom: 16px;">
                <strong>Mood:</strong> <span style="font-size: 24px;">${entry.mood.emoji}</span> ${entry.mood.label}
            </div>
        ` : ''}
        
        <div style="margin-bottom: 16px;">
            <strong>Note:</strong>
            <div style="margin-top: 8px; line-height: 1.6;">${(entry.note || '').replace(/\n/g, '<br>')}</div>
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
                    ${entry.images.map((img, index) => `
                        <img src="${img}" class="preview-image-full" onclick="event.stopPropagation(); showImageInModal('${entry.id}', ${index});">
                    `).join('')}
                </div>
            </div>
        ` : ''}
        
        ${entry.isTimedActivity ? `
            <div style="margin-bottom: 16px;">
                <strong>Activity:</strong> ${entry.activity} (${entry.duration} minutes)
                ${entry.optionalNote ? `<br><strong>Note:</strong> ${(entry.optionalNote || '').replace(/\n/g, '<br>')}` : ''}
            </div>
        ` : ''}

        ${entry.isQuickTrack ? `
            <div style="margin-bottom: 16px;">
                ${entry.optionalNote ? `<strong>Note:</strong> ${(entry.optionalNote || '').replace(/\n/g, '<br>')}` : ''}
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
    
    // Renderizar mapa en el modal
    if (entry.coords) {
        setTimeout(() => {
            const mapContainer = document.getElementById('preview-map-modal');
            if (mapContainer && !mapContainer._leaflet_id) { // Evitar reinicialización
                const map = L.map('preview-map-modal').setView([entry.coords.lat, entry.coords.lon], 13);
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '© OpenStreetMap'
                }).addTo(map);
                L.marker([entry.coords.lat, entry.coords.lon]).addTo(map);
                
                setTimeout(() => map.invalidateSize(), 100);
            }
        }, 100);
    }
}

function closePreview(event) {
    // Cierra si se hace clic fuera del contenido (en el fondo oscuro)
    if (event && event.target.id !== 'preview-modal') return;
    forceClosePreview();
}

function forceClosePreview() {
    const modal = document.getElementById('preview-modal');
    modal.classList.remove('show');
    // Limpiar contenido para liberar memoria (especialmente el mapa)
    document.getElementById('preview-body').innerHTML = '';
}

// Muestra una imagen específica en el modal de preview
function showImageInModal(entryId, imageIndex) {
    const entry = entries.find(e => e.id == entryId);
    if (!entry || !entry.images || !entry.images[imageIndex]) {
        console.error('Image not found');
        return;
    }
    
    const modal = document.getElementById('preview-modal');
    const body = document.getElementById('preview-body');
    
    body.innerHTML = `
        <div style="text-align: center; padding: 20px;">
            <img src="${entry.images[imageIndex]}" style="max-width: 100%; max-height: 80vh; border: 2px solid #000;">
        </div>
    `;
    
    modal.classList.add('show');
}

function openStats() {
    calculateStats();
    const modal = document.getElementById('stats-modal');
    if (modal) {
        modal.classList.add('show');
    }
}

function closeStats(event) {
    if (event && event.target.id !== 'stats-modal') return;
    forceCloseStats();
}

function forceCloseStats() {
    const modal = document.getElementById('stats-modal');
    if (modal) {
        modal.classList.remove('show');
    }
}

function openSettings() {
    renderSettingsConfig(); // Renderiza el contenido de los settings
    const modal = document.getElementById('settings-modal');
    if (modal) {
        modal.classList.add('show');
    }
}

function closeSettings(event) {
    if (event && event.target.id !== 'settings-modal') return;
    forceCloseSettings();
}

function forceCloseSettings() {
    const modal = document.getElementById('settings-modal');
    if (modal) {
        modal.classList.remove('show');
    }
}

// --- Manejadores del Menú Flotante (FAB) ---

let fabMenuOpen = false;

function toggleFabMenu() {
    const fabActions = document.querySelectorAll('.fab-action');
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
            }, (fabActions.length - index - 1) * 30); // Cierra en orden inverso
        });
    }
}

// Cierra el menú FAB si está abierto
function closeFabMenu() {
    if (fabMenuOpen) {
        toggleFabMenu();
    }
}

// Asignaciones globales para los `onclick` del index.html (legado)
// Estos actúan como "enlaces" que también cierran el menú.
window.toggleCrumb = function() {
    closeFabMenu();
    toggleForm(); // Llama a la función real
};

window.toggleTime = function() {
    closeFabMenu();
    toggleTimer(); // Llama a la función real
};

window.toggleTrack = function() {
    closeFabMenu();
    toggleTrack(); // Llama a la función real
};

window.toggleSpent = function() {
    closeFabMenu();
    toggleSpent(); // Llama a la función real
};

window.handleShowRecapForm = function() {
    closeFabMenu();
    showRecapForm(); // Llama a la función real
};

// Asignar los listeners del FAB en cuanto cargue el DOM
document.addEventListener('DOMContentLoaded', () => {
    const fabMain = document.getElementById('fab-main');
    if (fabMain) {
        fabMain.onclick = toggleFabMenu;
    }
    
    const fabActions = document.querySelectorAll('.fab-action');
    if (fabActions.length === 5) {
        fabActions[0].onclick = window.toggleCrumb;
        fabActions[1].onclick = window.toggleTime;
        fabActions[2].onclick = window.toggleTrack;
        fabActions[3].onclick = window.toggleSpent;
        fabActions[4].onclick = window.handleShowRecapForm;
    }
});
