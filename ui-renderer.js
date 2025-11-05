// ===== ui-renderer.js (DOM Painter) =====

// Imports
// CAMBIO: Rutas actualizadas para apuntar a 'core/'
import { getState } from './core/state.js';

// --- Form Renderers ---

/**
 * Renders the mood selection buttons in the Crumb form.
 * Lee de state.settings.moods y state.selectedMood.
 */
export function renderMoodSelector() {
    const { settings, selectedMood } = getState();
    const container = document.getElementById('mood-selector');
    if (!container) return; // Guard clause
    
    // CHANGED: Use icons instead of emojis
    // Ensure these names match your files (e.g., mood-happy.svg)
    const moodIcons = [
        'assets/icons/mood-happy.svg',
        'assets/icons/mood-sad.svg',
        'assets/icons/mood-angry.svg',
        'assets/icons/mood-neutral.svg',
        'assets/icons/mood-tired.svg',
        'assets/icons/mood-stressed.svg' // Assuming 6th icon
    ];

    container.innerHTML = settings.moods.map((mood, index) => {
        // Use neutral icon as fallback if index is out of bounds
        const iconSrc = moodIcons[index] || 'assets/icons/mood-neutral.svg'; 
        return `
            <div class="mood-option ${selectedMood === index ? 'selected' : ''}" data-index="${index}">
                <img src="${iconSrc}" alt="${mood.label}" class="icon-mac">
                <span class="mood-label">${mood.label}</span>
            </div>
        `;
    }).join('');
}

/**
 * Renders the image previews in the Crumb form.
 * Lee de state.currentImages.
 */
export function renderImagePreviews() {
    const { currentImages } = getState();
    const container = document.getElementById('image-previews');
    if (!container) return;
    
    // CHANGED: Use close.svg icon instead of '✕'
    container.innerHTML = currentImages.map((img, idx) => `
        <div class="image-preview">
            <img src="${img}" alt="Preview image ${idx+1}">
            <div class="image-remove" data-index="${idx}">
                <img src="assets/icons/close.svg" alt="Remove" style="width: 12px; height: 12px; filter: invert(1);">
            </div>
        </div>
    `).join('');
}

/**
 * Renders the audio preview player in the Crumb form.
 * Lee de state.currentAudio.
 */
export function renderAudioPreview() {
    const { currentAudio } = getState();
    const container = document.getElementById('audio-preview');
    if (!container) return;
    
    if (currentAudio) {
        // CHANGED: Use close.svg icon for remove button
        container.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px; margin-top: 8px;">
                <audio controls style="flex: 1;">
                    <source src="${currentAudio}">
                </audio>
                <button class="mac-button audio-remove" style="padding: 4px 8px;">
                    <img src="assets/icons/close.svg" alt="Remove" class="icon-mac">
                </button>
            </div>
        `;
    } else {
        container.innerHTML = '';
    }
}

/**
 * Renders the BSO search results in the Recap form.
 * @param {Array} results - Array of track objects from iTunes API.
 */
export function renderBSOResults(results) {
    const resultsDiv = document.getElementById('recap-bso-results');
    if (!resultsDiv) return;
    
    if (results.length > 0) {
        // CHANGED: Use caret-right icon instead of '▶️'
        const html = results.map(track => `
            <div class="bso-result" 
                 data-name="${track.trackName.replace(/'/g, "\\'")}" 
                 data-artist="${track.artistName.replace(/'/g, "\\'")}" 
                 data-url="${track.trackViewUrl}" 
                 data-artwork="${track.artworkUrl100}"
                 style="display: flex; align-items: center; gap: 12px; padding: 8px; border: 2px solid #999; margin-bottom: 8px; cursor: pointer; background: white;">
                
                <img src="${track.artworkUrl100}" style="width: 50px; height: 50px; border: 2px solid #000;">
                <div style="flex: 1;">
                    <div style="font-weight: bold; font-size: 13px;">${track.trackName}</div>
                    <div style="font-size: 11px; color: #666;">${track.artistName}</div>
                </div>
                <img src="assets/icons/caret-right.svg" alt="Play" class="icon-mac" style="filter: none;">
            </div>
        `).join('');
        resultsDiv.innerHTML = html;
    } else {
        resultsDiv.innerHTML = '<div style="padding: 12px; text-align: center; color: #666;">No results found</div>';
    }
}

/**
 * Renders the selected BSO track in the Recap form.
 * @param {object} trackData - Object containing track info.
 */
export function selectTrackUI(trackData) {
    const { name, artist, url, artwork } = trackData;
    document.getElementById('recap-selected-track').value = JSON.stringify(trackData);
    
    // CHANGED: Replaced '🔗' emoji with link.svg
    document.getElementById('recap-bso-results').innerHTML = `
        <div class="bso-result" style="display: flex; align-items: center; gap: 12px; padding: 12px; border: 3px solid #000; background: #f0f0f0;">
            <img src="${artwork}" style="width: 60px; height: 60px; border: 2px solid #000;">
            <div style="flex: 1;">
                <div style="font-weight: bold;">${name}</div>
                <div style="font-size: 12px; color: #666;">${artist}</div>
            </div>
            <a href="${url}" target="_blank" style="text-decoration: none; font-size: 20px;">
                <img src="assets/icons/link.svg" alt="Link" class="icon-mac" style="filter: none;">
            </a>
        </div>
    `;
}

// --- Map Renderers ---

/**
 * Displays a mini-map in the specified container.
 * @param {number} lat - Latitude.
 * @param {number} lon - Longitude.
 * @param {string} containerId - The ID of the map container element.
 */
export function showMiniMap(lat, lon, containerId) {
    const mapContainer = document.getElementById(containerId);
    if (!mapContainer) return;

    mapContainer.innerHTML = '';
    mapContainer.style.display = 'block';

    try {
        const map = L.map(containerId).setView([lat, lon], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap',
            maxZoom: 19
        }).addTo(map);
        L.marker([lat, lon]).addTo(map);

        setTimeout(() => map.invalidateSize(), 100);
    } catch(e) {
        console.error("Error initializing Leaflet map:", e);
        mapContainer.innerHTML = "Map failed to load. Are you online?";
    }
}
