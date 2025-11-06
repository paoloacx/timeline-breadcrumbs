// ===== modules/ui/preview.js (Preview Modal Logic) =====

// Imports
import { formatDate, formatTime } from '../../utils.js';
// P-FIX: Import state and centralized icons
import { getState } from '../../core/state.js';
import { MOOD_ICONS } from '../../ui-renderer.js';

// CAMBIO: Variable para guardar la instancia del mapa
let previewMapInstance = null;

/**
 * Renders the full-size map inside the preview modal.
 * @param {object} coords - { lat, lon }
 */
function renderPreviewMap(coords) {
    setTimeout(() => {
        const mapContainer = document.getElementById('preview-map-modal');
        if (mapContainer) {
            
            // --- CAMBIO: INICIO DEL ARREGLO ---
            // Destruye el mapa anterior (si existe) antes de crear uno nuevo
            if (previewMapInstance) {
                previewMapInstance.remove();
                previewMapInstance = null;
            }
            // --- CAMBIO: FIN DEL ARREGLO ---

            try {
                // Asume que L (Leaflet) está disponible globalmente
                // Guarda la nueva instancia del mapa
                previewMapInstance = L.map('preview-map-modal').setView([coords.lat, coords.lon], 13);
                
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '© OpenStreetMap'
                }).addTo(previewMapInstance);
                
                L.marker([coords.lat, coords.lon]).addTo(previewMapInstance);
                
                setTimeout(() => previewMapInstance.invalidateSize(), 100);
            } catch(e) {
                console.error("Error initializing preview map:", e);
                mapContainer.innerHTML = "Map failed to load.";
            }
        }
    }, 100); // Espera a que el modal sea visible
}

/**
 * Renders the content for the general preview modal.
 * @param {object} entry - The entry object to preview.
 */
export function renderPreview(entry) {
    const body = document.getElementById('preview-body');
    const { settings } = getState(); // P-FIX: Get settings

    // P-FIX: Find mood icon and label based on index
    let moodIconPath = '';
    let moodLabel = '';
    let moodIndex = null;

    if (entry.mood !== undefined && entry.mood !== null) {
        if (typeof entry.mood === 'object') {
            // Handle old data: find index by label
            moodIndex = settings.moods.findIndex(m => m.label === entry.mood.label);
        } else {
            // Handle new data: it's already the index
            moodIndex = entry.mood;
        }
    }

    if (moodIndex !== null && moodIndex !== -1 && moodIndex < MOOD_ICONS.length) {
        moodIconPath = MOOD_ICONS[moodIndex]; // Get path from array
        if (settings.moods[moodIndex]) {
            moodLabel = settings.moods[moodIndex].label; // Get label
        }
    }
    // --- End P-FIX ---
    
    let html = `
        <div style="margin-bottom: 16px;">
            <strong>Time:</strong> ${formatDate(entry.timestamp)} at ${formatTime(entry.timestamp)}
        </div>
        
        ${moodIconPath ? `
            <div style="margin-bottom: 16px; display: flex; align-items: center; gap: 8px;">
                <strong>Mood:</strong> 
                <img src="${moodIconPath}" alt="${moodLabel}" class="icon-mac" style="width: 24px; height: 24px;">
                <span>${moodLabel}</span>
            </div>
        ` : ''}
        ${!entry.isTimedActivity ? `
            <div style="margin-bottom: 16px;">
                <strong>Note:</strong>
                <div style="margin-top: 8px; line-height: 1.6; white-space: pre-wrap;">${entry.note || ''}</div>
            </div>
        ` : ''}
        
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
                        <img src="${img}" class="preview-image-full" data-index="${idx}">
                    `).join('')}
                </div>
            </div>
        ` : ''}
        
        ${entry.isTimedActivity ? `
            <div style="margin-bottom: 16px;">
                <strong>Activity:</strong> ${entry.activity} (${entry.duration} minutes)
            </div>
        ` : ''}
        
        ${(entry.isTimedActivity || entry.isQuickTrack) && entry.optionalNote ? `
            <div style="margin-bottom: 16px;">
                <strong>Note:</strong>
                <div style="margin-top: 8px; line-height: 1.6; white-space: pre-wrap; font-style: italic;">${entry.optionalNote}</div>
            </div>
        ` : ''}
        
        ${entry.isSpent ? `
            <div style="margin-bottom: 16px;">
                <strong>Amount Spent:</strong> €${entry.spentAmount.toFixed(2)}
            </div>
        ` : ''}
    `;
    
    body.innerHTML = html;
    
    // Si la entrada tiene coordenadas, renderiza el mapa
    if (entry.coords) {
        renderPreviewMap(entry.coords);
    }
    
    // Find, update, and show the static edit button
    const editBtn = document.getElementById('btn-preview-edit');
    if (editBtn) {
        editBtn.dataset.id = entry.id;
        editBtn.classList.remove('hidden');
    }
}

/**
 * Renders a specific image in the preview modal.
 * @param {object} entry - The entry object.
 * @param {number} imageIndex - The index of the image to show.
 */
export function renderImagePreviewModal(entry, imageIndex) {
    const body = document.getElementById('preview-body');
    if (!entry || !entry.images || !entry.images[imageIndex]) {
        body.innerHTML = 'Error: Image not found.';
        return;
    }
    
    body.innerHTML = `
        <div style="text-align: center; padding: 20px;">
            <img src="${entry.images[imageIndex]}" style="max-width: 100%; max-height: 80vh; border: 2px solid #000;">
        </div>
    `;
    
    // Find, update, and show the static edit button
    const editBtn = document.getElementById('btn-preview-edit');
    if (editBtn) {
        editBtn.dataset.id = entry.id;
        editBtn.classList.remove('hidden');
    }
}
