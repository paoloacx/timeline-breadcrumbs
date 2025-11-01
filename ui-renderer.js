// /ui-renderer.js
// Handles all DOM rendering and manipulation.

import { getState } from './state-manager.js';
import { formatDate, formatTime, calculateEndTime, getDayKey } from './utils.js';

// --- Auth UI ---

/**
 * Updates the header UI based on auth state.
 * @param {object|null} user - The Firebase user object or null.
 */
export function renderAuthUI(user) {
    const loginBtn = document.getElementById('login-btn');
    const authContainer = document.getElementById('auth-container');
    const userName = document.getElementById('user-name');
    const userPhoto = document.getElementById('user-photo');
    const syncStatus = document.getElementById('sync-status');

    if (user) {
        loginBtn.classList.add('hidden');
        authContainer.classList.remove('hidden');
        userName.textContent = user.displayName || 'User';
        userPhoto.src = user.photoURL || 'icons/icon-192x192.png';
        syncStatus.textContent = '(Online)';
        syncStatus.style.color = '#008000';
    } else {
        loginBtn.classList.remove('hidden');
        authContainer.classList.add('hidden');
        syncStatus.textContent = '(Offline)';
        syncStatus.style.color = '#888';
    }
}

// --- Loading Spinner ---

export function showLoading(message = 'Loading...') {
    document.getElementById('loading-text').textContent = message;
    document.getElementById('loading-overlay').classList.remove('hidden');
}

export function hideLoading() {
    document.getElementById('loading-overlay').classList.add('hidden');
}


// --- Form Rendering & Population ---

/**
 * Clears all inputs in a given form window.
 * @param {string} formId - The ID of the form window.
 */
export function clearForm(formId) {
    const form = document.getElementById(formId);
    if (!form) return;

    form.querySelectorAll('input[type="text"], input[type="number"], textarea').forEach(input => input.value = '');
    form.querySelectorAll('input[type="hidden"]').forEach(input => input.value = '');
    
    // Specific resets
    if (formId === 'form-window') {
        document.getElementById('image-previews').innerHTML = '';
        document.getElementById('audio-preview').innerHTML = '';
        document.getElementById('delete-btn').classList.add('hidden');
        document.getElementById('save-btn').textContent = '💾 Save';
        document.getElementById('mood-config').classList.add('hidden');
        const map = document.getElementById('form-map');
        if (map) {
            map.style.display = 'none';
            map.innerHTML = '';
        }
    } else if (formId === 'timer-window') {
        document.getElementById('delete-time-btn').classList.add('hidden');
        document.getElementById('create-time-btn').textContent = 'Create Event';
    } else if (formId === 'track-window') {
        document.getElementById('delete-track-btn').classList.add('hidden');
        document.getElementById('save-track-btn').textContent = 'Save Track';
    } else if (formId === 'spent-window') {
        document.getElementById('delete-spent-btn').classList.add('hidden');
    } else if (formId === 'recap-form') {
        document.getElementById('recap-rating').value = '5';
        document.getElementById('recap-rating-value').textContent = '5';
        document.getElementById('recap-bso-results').innerHTML = '';
    }
}

/**
 * Renders the mood selector in the main form.
 */
export function renderMoodSelector() {
    const { moods, selectedMood } = getState();
    const container = document.getElementById('mood-selector');
    if (!container) return;

    container.innerHTML = moods.map((mood, index) => `
        <div class="mood-option ${selectedMood === index ? 'selected' : ''}" data-index="${index}">
            ${mood.emoji}
            <span class="mood-label">${mood.label}</span>
        </div>
    `).join('');
}

/**
 * Renders the timer duration and activity selectors.
 */
export function renderTimerOptions() {
    const { timeDurations, timeActivities, selectedDuration, selectedActivity } = getState();
    
    const durationContainer = document.getElementById('duration-selector');
    if (durationContainer) {
        durationContainer.innerHTML = timeDurations.map(min => `
            <div class="duration-option ${selectedDuration === min ? 'selected' : ''}" data-duration="${min}">
                ${min} min
            </div>
        `).join('');
    }
    
    const activityContainer = document.getElementById('activity-selector');
    if (activityContainer) {
        activityContainer.innerHTML = timeActivities.map(act => `
            <div class="activity-option ${selectedActivity === act ? 'selected' : ''}" data-activity="${act}">
                ${act}
            </div>
        `).join('');
    }
    
    // Enable/disable save button
    const createBtn = document.getElementById('create-time-btn');
    if (createBtn) {
        createBtn.disabled = !(selectedDuration && selectedActivity);
    }
}

/**
 * Renders the track item selector.
 */
export function renderTrackSelector() {
    const { trackItems, selectedTrackItem } = getState();
    const container = document.getElementById('track-selector');
    if (!container) return;
    
    const allItems = [...trackItems.meals, ...trackItems.tasks];
    
    container.innerHTML = allItems.map(item => `
        <div class="activity-option ${selectedTrackItem === item ? 'selected' : ''}" data-item="${item.replace(/'/g, "\\'")}">
            ${item}
        </div>
    `).join('');
}

/**
 * Renders image previews in the main form.
 */
export function renderImagePreviews() {
    const { currentImages } = getState();
    const container = document.getElementById('image-previews');
    if (!container) return;
    
    container.innerHTML = currentImages.map((img, idx) => `
        <div class="image-preview">
            <img src="${img}" alt="Preview image ${idx+1}">
            <div class="image-remove" data-index="${idx}">✕</div>
        </div>
    `).join('');
}

/**
 * Renders the audio preview and remove button.
 */
export function renderAudioPreview() {
    const { currentAudio } = getState();
    const container = document.getElementById('audio-preview');
    if (!container) return;

    if (currentAudio) {
        container.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px; margin-top: 8px;">
                <audio controls style="flex: 1;">
                    <source src="${currentAudio}">
                </audio>
                <button class="mac-button audio-remove-btn" style="padding: 4px 8px;">✕</button>
            </div>
        `;
    } else {
        container.innerHTML = '';
    }
}

/**
 * Renders a mini-map in the specified container.
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @param {string} containerId - ID of the map container
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

// --- Form Population (for Editing) ---

function setDateTime(inputId, timestamp) {
    const input = document.getElementById(inputId);
    if (!input) return;
    const date = new Date(timestamp);
    // Format to yyyy-MM-ddTHH:mm
    const localDateTime = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    input.value = localDateTime;
}

export function populateCrumbForm(entry) {
    // Set state first
    const { moods } = getState();
    const moodIndex = entry.mood ? moods.findIndex(m => m.emoji === entry.mood.emoji) : null;
    setState({
        currentImages: [...(entry.images || [])],
        currentAudio: entry.audio || null,
        currentCoords: entry.coords ? { ...entry.coords } : null,
        selectedMood: moodIndex !== -1 ? moodIndex : null,
    });

    // Populate DOM
    document.getElementById('note-input').value = entry.note;
    document.getElementById('location-input').value = entry.location || '';
    document.getElementById('weather-input').value = entry.weather || '';
    setDateTime('datetime-input', entry.timestamp);
    
    renderImagePreviews();
    renderAudioPreview();
    renderMoodSelector();
    
    if (entry.coords) {
        showMiniMap(entry.coords.lat, entry.coords.lon, 'form-map');
    }
    
    document.getElementById('delete-btn').classList.remove('hidden');
    document.getElementById('save-btn').textContent = '💾 Update';
}

export function populateTimerForm(entry) {
    setState({
        selectedDuration: entry.duration,
        selectedActivity: entry.activity
    });
    
    setDateTime('datetime-input-time', entry.timestamp);
    document.getElementById('time-optional-note').value = entry.optionalNote || '';
    
    renderTimerOptions();
    
    document.getElementById('delete-time-btn').classList.remove('hidden');
    document.getElementById('create-time-btn').textContent = '💾 Update Event';
}

export function populateTrackForm(entry) {
    setState({
        selectedTrackItem: entry.note
    });
    
    setDateTime('datetime-input-track', entry.timestamp);
    document.getElementById('track-optional-note').value = entry.optionalNote || '';
    
    renderTrackSelector();
    
    document.getElementById('save-track-btn').disabled = false;
    document.getElementById('delete-track-btn').classList.remove('hidden');
    document.getElementById('save-track-btn').textContent = '💾 Update Track';
}

export function populateSpentForm(entry) {
    setDateTime('datetime-input-spent', entry.timestamp);
    document.getElementById('spent-description').value = entry.note;
    document.getElementById('spent-amount').value = entry.spentAmount;
    
    document.getElementById('delete-spent-btn').classList.remove('hidden');
}

export function populateRecapForm(entry) {
    setDateTime('datetime-input-recap', entry.timestamp);
    document.getElementById('recap-reflection').value = entry.reflection || '';
    document.getElementById('recap-rating').value = entry.rating || 5;
    document.getElementById('recap-rating-value').textContent = entry.rating || 5;
    
    document.getElementById('recap-highlight-1').value = (entry.highlights && entry.highlights[0]) || '';
    document.getElementById('recap-highlight-2').value = (entry.highlights && entry.highlights[1]) || '';
    document.getElementById('recap-highlight-3').value = (entry.highlights && entry.highlights[2]) || '';
    
    document.getElementById('recap-bso').value = '';
    document.getElementById('recap-bso-results').innerHTML = '';
    document.getElementById('recap-selected-track').value = '';
    
    if (entry.track) {
        renderSelectedBsoTrack(entry.track);
        document.getElementById('recap-selected-track').value = JSON.stringify(entry.track);
    }
    
    document.getElementById('delete-recap-btn').classList.remove('hidden');
}


// --- BSO (Soundtrack) Rendering ---

export function renderBsoResults(results) {
    const resultsDiv = document.getElementById('recap-bso-results');
    if (!resultsDiv) return;

    if (results.length > 0) {
        resultsDiv.innerHTML = results.map(track => `
            <div class="bso-result" 
                data-name="${track.trackName.replace(/'/g, "\\'")}"
                data-artist="${track.artistName.replace(/'/g, "\\'")}"
                data-url="${track.trackViewUrl}"
                data-artwork="${track.artworkUrl100}">
                
                <img src="${track.artworkUrl100}">
                <div class="bso-info">
                    <div class="bso-name">${track.trackName}</div>
                    <div class="bso-artist">${track.artistName}</div>
                </div>
                <div class="bso-select">▶️</div>
            </div>
        `).join('');
    } else {
        resultsDiv.innerHTML = '<div style="padding: 12px; text-align: center; color: #666;">No results found</div>';
    }
}

export function renderSelectedBsoTrack(track) {
    const resultsDiv = document.getElementById('recap-bso-results');
    if (!resultsDiv) return;
    
    resultsDiv.innerHTML = `
        <div class="bso-result selected">
            <img src="${track.artwork}">
            <div class="bso-info">
                <div class="bso-name">${track.name}</div>
                <div class="bso-artist">${track.artist}</div>
            </div>
            <a href="${track.url}" target="_blank" style="text-decoration: none; font-size: 20px;" onclick="event.stopPropagation();">🔗</a>
        </div>
    `;
}

// --- Main Timeline Rendering ---

/**
 * Renders the entire timeline based on current state.
 */
export function renderTimeline() {
    const { entries } = getState();
    const container = document.getElementById('timeline-container');
    const emptyState = document.getElementById('empty-state');
    const footer = document.getElementById('footer');
    const footerCount = document.getElementById('footer-count');

    if (entries.length === 0) {
        container.innerHTML = '';
        emptyState.classList.remove('hidden');
        footer.style.display = 'none';
        return;
    }

    emptyState.classList.add('hidden');
    footer.style.display = 'flex';
    footerCount.textContent = entries.length;

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
                    <div class="day-block">
                        <div class="day-header" data-day-key="${dayKey}">
                            <span>${formatDate(firstEntry.timestamp)}</span>
                            <span class="chevron ${expandedClass}" id="chevron-${dayKey}">▼</span>
                        </div>
                        
                        ${recaps.map(recap => renderRecapCard(recap)).join('')}
                        
                        <div class="day-content ${expandedClass}" id="day-content-${dayKey}">
                            ${regularEntries.map(entry => renderEntryCard(entry)).join('')}
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;

    container.innerHTML = html;
    
    // Render mini-maps after HTML is in DOM
    entries.forEach(entry => {
        if (entry.coords) {
            setTimeout(() => {
                const mapEl = document.getElementById(`mini-map-${entry.id}`);
                if (mapEl && !mapEl.classList.contains('leaflet-container')) {
                    renderMiniMapCard(mapEl, entry);
                }
            }, 100);
        }
    });
}

/**
 * Renders a single Recap card.
 * @param {object} recap - The recap entry object.
 * @returns {string} HTML string for the recap card.
 */
function renderRecapCard(recap) {
    return `
    <div class="recap-block">
        <div class="recap-header" data-recap-id="${recap.id}">
            <span>🌟 Day Recap</span>
            <span class="chevron-recap" id="chevron-recap-${recap.id}">▼</span>
        </div>
        <div class="recap-content hidden" id="recap-content-${recap.id}">
            <button class="mac-button edit-button" data-id="${recap.id}">✏️ Edit</button>
            <div class="recap-item">
                <strong>Rating:</strong> ${recap.rating}/10 ${'⭐'.repeat(Math.round(recap.rating / 2))}
            </div>
            ${recap.reflection ? `<div class="recap-item"><strong>Reflection:</strong><div class="recap-note">${recap.reflection}</div></div>` : ''}
            ${recap.highlights && recap.highlights.length > 0 ? `
                <div class="recap-item">
                    <strong>Highlights:</strong>
                    <ul>${recap.highlights.map(h => `<li>${h}</li>`).join('')}</ul>
                </div>
            ` : ''}
            ${recap.track ? `
                <div class="recap-item">
                    <strong>Day's Soundtrack:</strong>
                    <div class="bso-result selected" style="margin-top: 8px;">
                        <img src="${recap.track.artwork}">
                        <div class="bso-info">
                            <div class="bso-name">${recap.track.name}</div>
                            <div class="bso-artist">${recap.track.artist}</div>
                        </div>
                        <a href="${recap.track.url}" target="_blank" style="font-size: 20px;" onclick="event.stopPropagation();">🔗</a>
                    </div>
                </div>
            ` : ''}
        </div>
    </div>
    `;
}

/**
 * Renders a single timeline entry card (non-recap).
 * @param {object} entry - The entry object.
 * @returns {string} HTML string for the entry card.
 */
function renderEntryCard(entry) {
    const heightStyle = entry.isTimedActivity && entry.duration ? `min-height: ${Math.max(120, Math.min(150 + entry.duration * 0.5, 300))}px;` : '';
    
    let cardTypeClass = 'crumb-event';
    if (entry.isTimedActivity) cardTypeClass = 'time-event';
    else if (entry.isQuickTrack) cardTypeClass = 'track-event';
    else if (entry.isSpent) cardTypeClass = 'spent-event';

    const noteContent = entry.note || '';
    const optionalNoteContent = entry.optionalNote || '';
    const needsReadMore = noteContent.length > 200 || noteContent.split('\n').length > 4;
    const needsReadMoreOptional = optionalNoteContent.length > 200 || optionalNoteContent.split('\n').length > 4;

    return `
    <div class="breadcrumb-entry ${cardTypeClass}" style="${heightStyle}">
        <button class="mac-button edit-button" data-id="${entry.id}">✏️ Edit</button>
        
        ${entry.isTimedActivity ?
            `<div>
                <div class="breadcrumb-time">⏰ ${formatTime(entry.timestamp)} - ${calculateEndTime(entry.timestamp, entry.duration)}</div>
                <div class="activity-label">${entry.activity}</div>
                <div style="font-size: 13px; color: #666; margin-top: 8px;">Duration: ${entry.duration} minutes</div>
                ${entry.optionalNote ? `
                    <div class="optional-note" id="note-${entry.id}">${entry.optionalNote}</div>
                    ${needsReadMoreOptional ? `<button class="read-more-btn" data-id="${entry.id}">Read more</button>` : ''}
                ` : ''}
            </div>` :
            `<div class="breadcrumb-time">
                ${entry.isQuickTrack ?
                    `<span class="compact-time">⏰ ${formatTime(entry.timestamp)} ${entry.note}</span>` :
                    `⏰ ${formatTime(entry.timestamp)}`
                }
                ${entry.isSpent ? `<span class="spent-badge">💰 €${entry.spentAmount.toFixed(2)}</span>` : ''}
            </div>`
        }
        
        ${entry.isQuickTrack && entry.optionalNote ? `
            <div class="optional-note" id="note-${entry.id}">${entry.optionalNote}</div>
            ${needsReadMoreOptional ? `<button class="read-more-btn" data-id="${entry.id}">Read more</button>` : ''}
        ` : ''}
        
        ${!entry.isTimedActivity && !entry.isQuickTrack && !entry.isSpent ? `
            <div style="display: flex; align-items: flex-start; gap: 12px; margin-bottom: 8px;">
                ${entry.mood ? `<span class="mood-display">${entry.mood.emoji}</span>` : ''}
                <div style="flex: 1;">
                    <div class="breadcrumb-note" id="note-${entry.id}">${entry.note}</div>
                    ${needsReadMore ? `<button class="read-more-btn" data-id="${entry.id}">Read more</button>` : ''}
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
                <audio controls style="width: 100%; max-width: 300px;"><source src="${entry.audio}"></audio>
            </div>
        ` : ''}
        
        <div class="breadcrumb-preview">
            ${entry.images && entry.images.length > 0 ? entry.images.map((img, idx) => `
                <img src="${img}" class="preview-image-thumb" alt="Thumbnail ${idx+1}" data-entry-id="${entry.id}" data-image-index="${idx}">
            `).join('') : ''}
            ${entry.coords ? `<div class="preview-map-thumb" id="mini-map-${entry.id}" data-id="${entry.id}"></div>` : ''}
            <button class="mac-button preview-button" data-id="${entry.id}">🔍 Preview</button>
        </div>
    </div>
    `;
}

/**
 * Renders a non-interactive mini-map for a timeline card.
 * @param {HTMLElement} mapEl - The div element to render the map in.
 * @param {object} entry - The entry object containing coords.
 */
function renderMiniMapCard(mapEl, entry) {
    try {
        const miniMap = L.map(mapEl, {
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
        // Click is handled by delegation in event-listeners.js
    } catch (e) {
        console.error('Error creating mini map:', e);
        mapEl.innerHTML = "Map failed";
    }
}

// (renderMoodConfig is in settings-manager.js as it's tightly coupled)
