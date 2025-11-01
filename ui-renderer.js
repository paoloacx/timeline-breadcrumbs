// =================================================================
// UI RENDERER (ui-renderer.js)
// =================================================================
// Contiene funciones que generan HTML y renderizan elementos en el DOM.

// (Aquí podrían ir otras funciones de renderizado que ya tuvieras, como createBreadcrumbCard)

/**
 * Renders the mood selector options in the form.
 */
window.renderMoodSelector = function() {
    const container = document.getElementById('mood-selector');
    // window.moods y selectedMood de state-manager.js
    container.innerHTML = window.moods.map((mood, index) => `
        <div class="mood-option ${selectedMood === index ? 'selected' : ''}" onclick="selectMood(${index})">
            ${mood.emoji}
            <span class="mood-label">${mood.label}</span>
        </div>
    `).join('');
}

/**
 * Renders the track selector options in the track form.
 */
window.renderTrackSelector = function() {
    const container = document.getElementById('track-selector');
    if (!container) return;
    // window.trackItems de state-manager.js
    const allItems = [...window.trackItems.meals, ...window.trackItems.tasks];
    
    container.innerHTML = allItems.map((item, index) => `
        <div class="activity-option" data-item="${item.replace(/'/g, "\\'")}" onclick="selectTrackItem('${item.replace(/'/g, "\\'")}')">
            ${item}
        </div>
    `).join('');
}

/**
 * Displays a Leaflet mini-map in the specified container.
 * @param {number} lat - Latitude.
 * @param {number} lon - Longitude.
 * @param {string} containerId - The ID of the DOM element to host the map.
 */
function showMiniMap(lat, lon, containerId) {
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

        setTimeout(() => {
            map.invalidateSize();
        }, 100);
    } catch(e) {
        console.error("Error initializing Leaflet map:", e);
        mapContainer.innerHTML = "Map failed to load. Are you online?";
    }
}

/**
 * Renders the full entry preview in a modal.
 * @param {number} id - The ID of the entry to preview.
 */
window.previewEntry = function(id) {
    const entry = window.entries.find(e => e.id === id); // window.entries de state-manager.js
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
                        <img src="${img}" class="preview-image-full" onclick="event.stopPropagation(); showImageInModal('${entry.id}', ${idx});">
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
    modal.classList.add('show');
    
    if (entry.coords) {
        setTimeout(() => {
            const mapContainer = document.getElementById('preview-map-modal');
            if (mapContainer) {
                try {
                    const map = L.map('preview-map-modal').setView([entry.coords.lat, entry.coords.lon], 13);
                    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                        attribution: '© OpenStreetMap'
                    }).addTo(map);
                    L.marker([entry.coords.lat, entry.coords.lon]).addTo(map);
                    
                    setTimeout(() => map.invalidateSize(), 100);
                } catch(e) {
                    console.error("Error initializing preview map:", e);
                    mapContainer.innerHTML = "Map failed to load.";
                }
            }
        }, 100);
    }
}

/**
 * Shows a specific image in a modal.
 * @param {string|number} entryId - The ID of the entry.
 * @param {number} imageIndex - The index of the image in the entry's image array.
 */
window.showImageInModal = function(entryId, imageIndex) {
    const entry = window.entries.find(e => e.id == entryId); // window.entries de state-manager.js
    if (!entry || !entry.images || !entry.images[imageIndex]) {
        console.error('Image not found:', entryId, imageIndex);
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

/**
 * Renders the entire timeline from the global 'window.entries' state.
 */
function renderTimeline() {
    const container = document.getElementById('timeline-container');
    const emptyState = document.getElementById('empty-state');
    const footer = document.getElementById('footer');
    // window.entries de state-manager.js
    if (window.entries.length === 0) {
        container.innerHTML = '';
        emptyState.classList.remove('hidden');
        footer.style.display = 'none';
        return;
    }

    emptyState.classList.add('hidden');
    footer.style.display = 'flex';

    const groupedByDay = {};
    window.entries.forEach(entry => {
        const dayKey = getDayKey(entry.timestamp); // De utils.js
        if (!groupedByDay[dayKey]) {
            groupedByDay[dayKey] = [];
        }
        groupedByDay[dayKey].push(entry);
    });

    const sortedDayKeys = Object.keys(groupedByDay).sort((a, b) => b.localeCompare(a));
    const todayKey = getDayKey(new Date().toISOString()); // De utils.js

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
                    <div class="day-block">
                        <div class="day-header" onclick="toggleDay('${dayKey}')">
                            <span>${formatDate(firstEntry.timestamp)}</span>
                            <span class="chevron ${expandedClass}" id="chevron-${dayKey}">▼</span>
                        </div>
                        
                        ${recaps.map(recap => `
                            <div class="recap-block">
                                <div class="recap-header" onclick="toggleRecap('${recap.id}')">
                                    <span>🌟 Day Recap</span>
                                    <span class="chevron-recap" id="chevron-recap-${recap.id}">▼</span>
                                </div>
                                <div class="recap-content hidden" id="recap-content-${recap.id}">
                                    <button class="mac-button edit-button" onclick="editEntry(${recap.id})" style="position: absolute; top: 12px; right: 12px;">✏️ Edit</button>
                                    
                                    <div style="margin-bottom: 16px;">
                                        <strong>Rating:</strong> ${recap.rating}/10 ${'⭐'.repeat(Math.round(recap.rating / 2))}
                                    </div>
                                    
                                    ${recap.reflection ? `
                                        <div style="margin-bottom: 16px;">
                                            <strong>Reflection:</strong>
Â                                          <div style="margin-top: 8px; line-height: 1.6; white-space: pre-wrap;">${recap.reflection}</div>
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
                                    
                                  t ${recap.track ? `
                                        <div style="margin-bottom: 16px;">
                                            <strong>Day's Soundtrack:</strong>
                                            <div class="bso-result" style="display: flex; align-items: center; gap: 12px; margin-top: 8px; padding: 12px; border: 2px solid #000; background: #f9f9f9;">
                                                <img src="${recap.track.artwork}" style="width: 50px; height: 50px; border: 2px solid #000;">
                                                <div style="flex: 1;">
                                                    <div style="font-weight: bold; font-size: 13px;">${recap.track.name}</div>
                                                    <div style="font-size: 11px; color: #666;">${recap.track.artist}</div>
                                                </div>
                                          t   <a href="${recap.track.url}" target="_blank" style="text-decoration: none; font-size: 18px;">🔗</a>
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
                                <div class="breadcrumb-entry ${entry.isTimedActivity ? 'time-event' : ''} ${trackClass} ${spentClass} ${crumbClass}" style="${heightStyle}">
                                    <button class="mac-button edit-button" onclick="editEntry(${entry.id})">✏️ Edit</button>
                                    
                                    ${entry.isTimedActivity ?
                                        `<div>
                                            <div class="breadcrumb-time">⏰ ${formatTime(entry.timestamp)} - ${calculateEndTime(entry.timestamp, entry.duration)}</div>
                                            <div class="activity-label">${entry.activity}</div>
                                            <div style="font-size: 13px; color: #666; margin-top: 8px;">Duration: ${entry.duration} minutes</div>
                                        </div>
                                        ${entry.optionalNote ? `
                                            <div class="optional-note" id="note-${entry.id}">${entry.optionalNote}</div>
                                            ${needsReadMoreOptional ? `<button class="read-more-btn" id="read-more-${entry.id}" onclick="toggleReadMore(${entry.id})">Read more</button>` : ''}
                                        ` : ''}` :
                                        `<div class="breadcrumb-time">
                                            ${entry.isQuickTrack ?
                                                `<span class="compact-time">⏰ ${formatTime(entry.timestamp)} ${entry.note}</span>` :
                                                `⏰ ${formatTime(entry.timestamp)}`
                                            }
                                            ${entry.isSpent ? `<span class="spent-badge">💰 €${entry.spentAmount.toFixed(2)}</span>` : ''}
                                        </div>`
                                    }
Â                                  
                                    ${entry.isQuickTrack && entry.optionalNote ? `
                                        <div class="optional-note" id="note-${entry.id}">${entry.optionalNote}</div>
                                        ${needsReadMoreOptional ? `<button class="read-more-btn" id="read-more-${entry.id}" onclick="toggleReadMore(${entry.id})">Read more</button>` : ''}
                                    ` : ''}
                                    
                                    ${!entry.isTimedActivity && !entry.isQuickTrack && !entry.isSpent && entry.type !== 'recap' ? `
                                        <div style="display: flex; align-items: flex-start; gap: 12px; margin-bottom: 8px;">
                                            ${entry.mood ? `<span class="mood-display">${entry.mood.emoji}</span>` : ''}
                                      t   <div style="flex: 1;">
                                                <div class="breadcrumb-note" id="note-${entry.id}">${entry.note}</div>
                                                ${needsReadMore ? `<button class="read-more-btn" id="read-more-${entry.id}" onclick="toggleReadMore(${entry.id})">Read more</button>` : ''}
                                            </div>
                                        </div>
A                                 ` : ''}
                                    
                                    ${(entry.weather || entry.location) ? `
                                        <div class="breadcrumb-meta">
                                            ${entry.weather ? `<span>${entry.weather}</span>` : ''}
Â                                         ${entry.weather && entry.location ? ` • ` : ''}
                                            ${entry.location ? `<span>📍 ${entry.location}</span>` : ''}
A                                     </div>
                                    ` : ''}
                                    
                                    ${entry.audio ? `
                                        <div style="margin-top: 12px; margin-bottom: 12px;">
                                            <audio controls style="width: 100%; max-width: 300px;">
                                          t     <source src="${entry.audio}">
                                            </audio>
Settings                             </div>
                                    ` : ''}
                                    
                                    <div class="breadcrumb-preview">
content                             ${entry.images && entry.images.length > 0 ? entry.images.map((img, idx) => `
                                            <img src="${img}" class="preview-image-thumb" alt="Thumbnail ${idx+1}" onclick="event.stopPropagation(); showImageInModal('${entry.id}', ${idx});">
A                                     `).join('') : ''}
                                        ${entry.coords ? `<div class="preview-map-thumb" id="mini-map-${entry.id}"></div>` : ''}
                                        <button class="mac-button preview-button" onclick="previewEntry(${entry.id})">🔍 Preview</button>
                                    </div>
                                </div>
s                         `}).join('')}
                        </div>
                    </div>
                `;
Note           }).join('')}
        </div>
    `;

    container.innerHTML = html;
    
    // Renderizar mini-mapas
    window.entries.forEach(entry => {
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
is                             doubleClickZoom: false,
                            boxZoom: false,
                            keyboard: false
                        }).setView([entry.coords.lat, entry.coords.lon], 13);
                        
                        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                          t maxZoom: 19
                        }).addTo(miniMap);
                        
                        L.marker([entry.coords.lat, entry.coords.lon]).addTo(miniMap);
                        
                        mapEl.style.cursor = 'pointer';
all                       mapEl.onclick = () => window.previewEntry(entry.id);
                    } catch (e) {
                        console.error('Error creating mini map:', e);
                        mapEl.innerHTML = "Map failed";
                    }
                }
            }, 100);
D       }
    });
}
