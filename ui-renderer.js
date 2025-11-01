// ===== ui-renderer.js (DOM Painter) =====

// Imports
import { getState } from './state.js';
import { formatDate, formatTime, calculateEndTime, getDayKey } from './utils.js';
import { openModal } from './ui-handlers.js'; // Solo para mapas de preview

// --- Form Renderers ---

/**
 * Renders the mood selection buttons in the Crumb form.
 * Lee de state.settings.moods y state.selectedMood.
 */
export function renderMoodSelector() {
    const { settings, selectedMood } = getState();
    const container = document.getElementById('mood-selector');
    
    container.innerHTML = settings.moods.map((mood, index) => `
        <div class="mood-option ${selectedMood === index ? 'selected' : ''}" data-index="${index}">
            ${mood.emoji}
            <span class="mood-label">${mood.label}</span>
        </div>
    `).join('');
}

/**
 * Renders the image previews in the Crumb form.
 * Lee de state.currentImages.
 */
export function renderImagePreviews() {
    const { currentImages } = getState();
    const container = document.getElementById('image-previews');
    container.innerHTML = currentImages.map((img, idx) => `
        <div class="image-preview">
            <img src="${img}" alt="Preview image ${idx+1}">
            <div class="image-remove" data-index="${idx}">✕</div>
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
    if (currentAudio) {
        container.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px; margin-top: 8px;">
                <audio controls style="flex: 1;">
                    <source src="${currentAudio}">
                </audio>
                <button class="mac-button audio-remove" style="padding: 4px 8px;">✕</button>
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
    if (results.length > 0) {
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
                <div style="font-size: 18px;">▶️</div>
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
    document.getElementById('recap-bso-results').innerHTML = `
        <div class="bso-result" style="display: flex; align-items: center; gap: 12px; padding: 12px; border: 3px solid #000; background: #f0f0f0;">
            <img src="${artwork}" style="width: 60px; height: 60px; border: 2px solid #000;">
            <div style="flex: 1;">
                <div style="font-weight: bold;">${name}</div>
                <div style="font-size: 12px; color: #666;">${artist}</div>
            </div>
            <a href="${url}" target="_blank" style="text-decoration: none; font-size: 20px;">🔗</a>
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

// --- Preview Modal Renderers ---

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
                        <img src="${img}" class="preview-image-full" data-entry-id="${entry.id}" data-image-index="${idx}">
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


// --- Main Timeline Renderer ---

/**
 * Renders the entire timeline based on the global state.
 */
export function renderTimeline() {
    const { entries } = getState();
    const container = document.getElementById('timeline-container');
    const emptyState = document.getElementById('empty-state');
    const footer = document.getElementById('footer');

    if (entries.length === 0) {
        container.innerHTML = '';
        emptyState.classList.remove('hidden');
        footer.style.display = 'none';
        return;
    }

    emptyState.classList.add('hidden');
    footer.style.display = 'flex';

    const groupedByDay = {};
    entries.forEach(entry => {
        const dayKey = getDayKey(entry.timestamp);
        if (!groupedByDay[dayKey]) {
            groupedByDay[dayKey] = [];
        }
        groupedByDay[dayKey].push(entry);
    });

    const sortedDayKeys = Object.keys(groupedByDay).sort((a, b) => b.localeCompare(a));
    const todayKey = getDayKey(new Date().toISOString());

    const html = `
        <div class="timeline">
            <div class="timeline-line"></div>
            ${sortedDayKeys.map(dayKey => {
                const dayEntries = groupedByDay[dayKey];
                const firstEntry = dayEntries[0];
                
                const recaps = dayEntries.filter(e => e.type === 'recap');
                const regularEntries = dayEntries.filter(e => e.type !== 'recap');
                
                const isToday = (dayKey === todayKey);
                const expandedClass = isToday ? 'expanded' : '';
                
                return `
                    <div class="day-block" data-day="${dayKey}">
                        <div class="day-header">
                            <span>${formatDate(firstEntry.timestamp)}</span>
                            <span class="chevron ${expandedClass}" id="chevron-${dayKey}">▼</span>
                        </div>
                        
                        ${recaps.map(recap => `
                            <div class="recap-block" data-id="${recap.id}">
                                <div class="recap-header">
                                    <span>🌟 Day Recap</span>
                                    <span class="chevron-recap" id="chevron-recap-${recap.id}">▼</span>
                                </div>
                                <div class="recap-content hidden" id="recap-content-${recap.id}">
                                    <button class="mac-button edit-button btn-edit">✏️ Edit</button>
                                    
                                    <div style="margin-bottom: 16px;">
                                        <strong>Rating:</strong> ${recap.rating}/10 ${'⭐'.repeat(Math.round(recap.rating / 2))}
                                    </div>
                                    
                                    ${recap.reflection ? `
                                        <div style="margin-bottom: 16px;">
                                            <strong>Reflection:</strong>
                                            <div style="margin-top: 8px; line-height: 1.6; white-space: pre-wrap;">${recap.reflection}</div>
                                        </div>
                                    ` : ''}
                                    
                                    ${recap.highlights && recap.highlights.length > 0 ? `
                                        <div style="margin-bottom: 16px;">
                                            <strong>Highlights:</strong>
                                            <ul style="margin-top: 8px; padding-left: 20px;">
                                                ${recap.highlights.map(h => `<li style="margin-bottom: 4px;">${h}</li>`).join('')}
                                            </ul>
                                        </div>
                                    ` : ''}
                                    
                                    ${recap.track ? `
                                        <div style="margin-bottom: 16px;">
                                            <strong>Day's Soundtrack:</strong>
                                            <div class="bso-result" style="display: flex; align-items: center; gap: 12px; margin-top: 8px; padding: 12px; border: 2px solid #000; background: #f9f9f9;">
                                                <img src="${recap.track.artwork}" style="width: 50px; height: 50px; border: 2px solid #000;">
                                                <div style="flex: 1;">
                                                    <div style="font-weight: bold; font-size: 13px;">${recap.track.name}</div>
                                                    <div style="font-size: 11px; color: #666;">${recap.track.artist}</div>
                                                </div>
                                                <a href="${recap.track.url}" target="_blank" style="text-decoration: none; font-size: 18px;">🔗</a>
                                            </div>
                                        </div>
                                    ` : ''}
                                </div>
                            </div>
                        `).join('')}
                        
                        <div class="day-content ${expandedClass}" id="day-content-${dayKey}">
                            ${regularEntries.map(entry => {
                                const heightStyle = entry.isTimedActivity && entry.duration ? `min-height: ${Math.max(120, Math.min(150 + entry.duration * 0.5, 300))}px;` : '';
                                const trackClass = entry.isQuickTrack ? 'track-event' : '';
                                const spentClass = entry.isSpent ? 'spent-event' : '';
                                const crumbClass = (!entry.isTimedActivity && !entry.isQuickTrack && !entry.isSpent && entry.type !== 'recap') ? 'crumb-event' : '';
                                
                                const noteContent = entry.note || '';
                                const optionalNoteContent = entry.optionalNote || '';
                                const needsReadMore = noteContent.length > 200 || noteContent.split('\n').length > 4;
                                const needsReadMoreOptional = optionalNoteContent.length > 200 || optionalNoteContent.split('\n').length > 4;

                                return `
                                <div class="breadcrumb-entry ${entry.isTimedActivity ? 'time-event' : ''} ${trackClass} ${spentClass} ${crumbClass}" style="${heightStyle}" data-id="${entry.id}">
                                    <button class="mac-button edit-button btn-edit">✏️ Edit</button>
                                    
                                    ${entry.isTimedActivity ? 
                                        `<div>
                                            <div class="breadcrumb-time">⏰ ${formatTime(entry.timestamp)} - ${calculateEndTime(entry.timestamp, entry.duration)}</div>
                                            <div class="activity-label">${entry.activity}</div>
                                            <div style="font-size: 13px; color: #666; margin-top: 8px;">Duration: ${entry.duration} minutes</div>
                                        </div>
                                        ${entry.optionalNote ? `
                                            <div class="optional-note">${entry.optionalNote}</div>
                                            ${needsReadMoreOptional ? `<button class="read-more-btn">Read more</button>` : ''}
                                        ` : ''}` :
                                        `<div class="breadcrumb-time">
                                            ${entry.isQuickTrack ?
                                                `<span class="compact-time">⏰ ${formatTime(entry.timestamp)} ${entry.note}</span>` :
                                                `⏰ ${formatTime(entry.timestamp)}`
                                            }
                                            ${entry.isSpent ? `<span class="spent-badge">💰 €${entry.spentAmount.toFixed(2)}</span>` : ''}
                                        </div>`
                                    }
                                    
                                    ${entry.isQuickTrack && entry.optionalNote ? `
                                        <div class="optional-note">${entry.optionalNote}</div>
                                        ${needsReadMoreOptional ? `<button class="read-more-btn">Read more</button>` : ''}
                                    ` : ''}
                                    
                                    ${!entry.isTimedActivity && !entry.isQuickTrack && !entry.isSpent && entry.type !== 'recap' ? `
                                        <div style="display: flex; align-items: flex-start; gap: 12px; margin-bottom: 8px;">
                                            ${entry.mood ? `<span class="mood-display">${entry.mood.emoji}</span>` : ''}
                                            <div style="flex: 1;">
                                                <div class="breadcrumb-note">${entry.note}</div>
                                                ${needsReadMore ? `<button class="read-more-btn">Read more</button>` : ''}
                                            </div>
                                        </div>
                                    ` : ''}
                                    
                                    ${(entry.weather || entry.location) ? `
                                        <div class="breadcrumb-meta">
                                            ${entry.weather ? `<span>${entry.weather}</span>` : ''}
                                            ${entry.weather && entry.location ? ` • ` : ''}
                                            ${entry.location ? `<span>📍 ${entry.location}</span>` : ''}
                                        </div>
                                    ` : ''}
                                    
                                    ${entry.audio ? `
                                        <div style="margin-top: 12px; margin-bottom: 12px;">
                                            <audio controls style="width: 100%; max-width: 300px;">
                                                <source src="${entry.audio}">
                                            </audio>
                                        </div>
                                    ` : ''}
                                    
                                    <div class="breadcrumb-preview">
                                        ${entry.images && entry.images.length > 0 ? entry.images.map((img, idx) => `
                                            <img src="${img}" class="preview-image-thumb" alt="Thumbnail ${idx+1}" data-index="${idx}">
                                        `).join('') : ''}
                                        ${entry.coords ? `<div class="preview-map-thumb" id="mini-map-${entry.id}"></div>` : ''}
                                        <button class="mac-button preview-button btn-preview">🔍 Preview</button>
                                    </div>
                                </div>
                                `}).join('')}
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;

    container.innerHTML = html;
    
    // Render mini-maps after HTML is in the DOM
    entries.forEach(entry => {
        if (entry.coords) {
            setTimeout(() => {
                const mapEl = document.getElementById(`mini-map-${entry.id}`);
                if (mapEl && !mapEl.classList.contains('leaflet-container')) {
                    try {
                        const miniMap = L.map(`mini-map-${entry.id}`, {
                            zoomControl: false,
                            attributionControl: false,
                            dragging: false,
                            scrollWheelZoom: false,
                            doubleClickZoom: false,
                            boxZoom: false,
                            keyboard: false
                        }).setView([entry.coords.lat, entry.coords.lon], 13);
                        
                        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                            maxZoom: 19
                        }).addTo(miniMap);
                        
                        L.marker([entry.coords.lat, entry.coords.lon]).addTo(miniMap);
                        
                        mapEl.style.cursor = 'pointer';
                        // El click es manejado por delegación en ui-handlers.js
                    } catch (e) {
                        console.error('Error creating mini map:', e);
                        mapEl.innerHTML = "Map failed";
                    }
                }
            }, 100);
        }
    });
}
