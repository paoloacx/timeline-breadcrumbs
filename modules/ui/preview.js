// ===== modules/ui/preview.js (Preview Modal Logic) =====

// Imports
import { formatDate, formatTime } from '../../utils.js';

/**
 * Renders the full-size map inside the preview modal.
 * @param {object} coords - { lat, lon }
 */
function renderPreviewMap(coords) {
    setTimeout(() => {
        const mapContainer = document.getElementById('preview-map-modal');
        if (mapContainer) {
            try {
                const map = L.map('preview-map-modal').setView([coords.lat, coords.lon], 13);
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '© OpenStreetMap'
                }).addTo(map);
                L.marker([coords.lat, coords.lon]).addTo(map);
                
                setTimeout(() => map.invalidateSize(), 100);
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
            <div style="margin-top: 8px; line-height: 1.6; white-space: pre-wrap;">${entry.note || ''}</div>
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
                        <img src="${img}" class="preview-image-full">
                    `).join('')}
                </div>
            </div>
        ` : ''}
        
        ${entry.isTimedActivity ? `
            <div style="margin-bottom: 16px;">
                <strong>Activity:</strong> ${entry.activity} (${entry.duration} minutes)
                ${entry.optionalNote ? `<div style="margin-top: 8px; line-height: 1.6; white-space: pre-wrap; font-style: italic;">${entry.optionalNote}</div>` : ''}
            </div>
        ` : ''}
        
        ${entry.isQuickTrack && entry.optionalNote ? `
            <div style="margin-bottom: 16px;">
                <strong>Optional Note:</strong>
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
}
