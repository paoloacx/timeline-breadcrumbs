// ===== UI RENDERING FUNCTIONS =====

/**
 * Renders the image previews in the form.
 */
window.renderImagePreviews = function() {
    const container = document.getElementById('image-previews');
    // 'currentImages' is a global variable from app.js
    container.innerHTML = currentImages.map((img, idx) => `
        <div class="image-preview">
            <img src="${img}" alt="Preview image ${idx+1}">
            <div class="image-remove" onclick="removeImage(${idx})">✕</div>
        </div>
    `).join('');
}

/**
 * Renders the audio preview player in the form.
 */
window.renderAudioPreview = function() {
    const container = document.getElementById('audio-preview');
    // 'currentAudio' is a global variable from app.js
    if (currentAudio) {
        container.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px; margin-top: 8px;">
                <audio controls style="flex: 1;">
                    <source src="${currentAudio}">
                </audio>
                <button class="mac-button" onclick="removeAudio()" style="padding: 4px 8px;">✕</button>
            </div>
        `;
    } else {
        container.innerHTML = '';
    }
}

/**
 * Renders the mood selection buttons in the form.
 */
window.renderMoodSelector = function() {
    const container = document.getElementById('mood-selector');
    // 'window.moods' and 'selectedMood' are globals from app.js
    container.innerHTML = window.moods.map((mood, index) => `
        <div class="mood-option ${selectedMood === index ? 'selected' : ''}" onclick="selectMood(${index})">
            ${mood.emoji}
            <span class="mood-label">${mood.label}</span>
        </div>
    `).join('');
}

/**
 * Renders the track selector buttons for the "Track" form.
 */
window.renderTrackSelector = function() {
    const container = document.getElementById('track-selector');
    if (!container) return; // Guard clause
    // 'window.trackItems' is a global from app.js
    const allItems = [...window.trackItems.meals, ...window.trackItems.tasks];
    
    container.innerHTML = allItems.map((item, index) => `
        <div class="activity-option" data-item="${item.replace(/'/g, "\\'")}" onclick="selectTrackItem('${item.replace(/'/g, "\\'")}')">
            ${item}
        </div>
    `).join('');
}

/**
 * Displays a mini-map in the specified container.
 * @param {number} lat - Latitude.
 * @param {number} lon - Longitude.
 * @param {string} containerId - The ID of the map container element.
 */
window.showMiniMap = function(lat, lon, containerId) {
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
 * Renders the entire timeline based on the global 'window.entries' array.
 */
window.renderTimeline = function() {
    const container = document.getElementById('timeline-container');
    const emptyState = document.getElementById('empty-state');
    const footer = document.getElementById('footer');

    // 'window.entries' is a global from app.js
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
        const dayKey = window.getDayKey(entry.timestamp); // Uses util function
        if (!groupedByDay[dayKey]) {
            groupedByDay[dayKey] = [];
        }
        groupedByDay[dayKey].push(entry);
    });

    // Sort days from newest to oldest
    const sortedDayKeys = Object.keys(groupedByDay).sort((a, b) => b.localeCompare(a));
    
    // Get today's key to expand it by default
    const todayKey = window.getDayKey(new Date().toISOString());

    const html = `
        <div class="timeline">
            <div class="timeline-line"></div>
            ${sortedDayKeys.map(dayKey => {
                const dayEntries = groupedByDay[dayKey];
                const firstEntry = dayEntries[0];
                
                // Separate recaps from other events
                const recaps = dayEntries.filter(e => e.type === 'recap');
                const regularEntries = dayEntries.filter(e => e.type !== 'recap');
                
                // Expand if it's today
                const isToday = (dayKey === todayKey);
                const expandedClass = isToday ? 'expanded' : '';
                
                return `
                    <div class="day-block">
                        <div class="day-header" onclick="toggleDay('${dayKey}')">
                            <span>${window.formatDate(firstEntry.timestamp)}</span>
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
                                <div class="breadcrumb-entry ${entry.isTimedActivity ? 'time-event' : ''} ${trackClass} ${spentClass} ${crumbClass}" style="${heightStyle}">
                                    <button class="mac-button edit-button" onclick="editEntry(${entry.id})">✏️ Edit</button>
                                    
                                    ${entry.isTimedActivity ? 
                                        `<div>
                                            <div class="breadcrumb-time">⏰ ${window.formatTime(entry.timestamp)} - ${window.calculateEndTime(entry.timestamp, entry.duration)}</div>
                                            <div class="activity-label">${entry.activity}</div>
                                            <div style="font-size: 13px; color: #666; margin-top: 8px;">Duration: ${entry.duration} minutes</div>
                                        </div>
                                        ${entry.optionalNote ? `
                                            <div class="optional-note" id="note-${entry.id}">${entry.optionalNote}</div>
                                            ${needsReadMoreOptional ? `<button class="read-more-btn" id="read-more-${entry.id}" onclick="toggleReadMore(${entry.id})">Read more</button>` : ''}
                                        ` : ''}` :
                                        `<div class="breadcrumb-time">
                                            ${entry.isQuickTrack ?
                                                `<span class="compact-time">⏰ ${window.formatTime(entry.timestamp)} ${entry.note}</span>` :
                                                `⏰ ${window.formatTime(entry.timestamp)}`
                                            }
                                            ${entry.isSpent ? `<span class="spent-badge">💰 €${entry.spentAmount.toFixed(2)}</span>` : ''}
                                        </div>`
                                    }
                                    
                                    ${entry.isQuickTrack && entry.optionalNote ? `
                                        <div class="optional-note" id="note-${entry.id}">${entry.optionalNote}</div>
                                        ${needsReadMoreOptional ? `<button class="read-more-btn" id="read-more-${entry.id}" onclick="toggleReadMore(${entry.id})">Read more</button>` : ''}
                                    ` : ''}
                                    
                                    ${!entry.isTimedActivity && !entry.isQuickTrack && !entry.isSpent && entry.type !== 'recap' ? `
                                        <div style="display: flex; align-items: flex-start; gap: 12px; margin-bottom: 8px;">
                                            ${entry.mood ? `<span class="mood-display">${entry.mood.emoji}</span>` : ''}
                                            <div style="flex: 1;">
                                                <div class="breadcrumb-note" id="note-${entry.id}">${entry.note}</div>
                                                ${needsReadMore ? `<button class="read-more-btn" id="read-more-${entry.id}" onclick="toggleReadMore(${entry.id})">Read more</button>` : ''}
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
                                            <img src="${img}" class="preview-image-thumb" alt="Thumbnail ${idx+1}" onclick="event.stopPropagation(); showImageInModal('${entry.id}', ${idx});">
                                        `).join('') : ''}
                                        ${entry.coords ? `<div class="preview-map-thumb" id="mini-map-${entry.id}"></div>` : ''}
                                        <button class="mac-button preview-button" onclick="previewEntry(${entry.id})">🔍 Preview</button>
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
                            doubleClickZoom: false,
                            boxZoom: false,
                            keyboard: false
                        }).setView([entry.coords.lat, entry.coords.lon], 13);
                        
                        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                            maxZoom: 19
                        }).addTo(miniMap);
                        
                        L.marker([entry.coords.lat, entry.coords.lon]).addTo(miniMap);
                        
                        mapEl.style.cursor = 'pointer';
                        mapEl.onclick = () => window.previewEntry(entry.id); // Call global
                    } catch (e) {
                        console.error('Error creating mini map:', e);
                        mapEl.innerHTML = "Map failed";
                    }
                }
            }, 100);
        }
    });
}
