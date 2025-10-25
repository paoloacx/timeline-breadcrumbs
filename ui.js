// Timeline rendering
function toggleReadMore(id) {
    const noteEl = document.getElementById(`note-${id}`);
    const btnEl = document.getElementById(`read-more-${id}`);
    
    if (noteEl.classList.contains('expanded')) {
        noteEl.classList.remove('expanded');
        btnEl.textContent = 'Read more';
    } else {
        noteEl.classList.add('expanded');
        btnEl.textContent = 'Show less';
    }
}

function formatDate(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en', { 
        weekday: 'long',
        day: 'numeric', 
        month: 'long', 
        year: 'numeric'
    });
}

function formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function calculateEndTime(timestamp, durationMinutes) {
    const date = new Date(timestamp);
    date.setMinutes(date.getMinutes() + durationMinutes);
    return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function getDayKey(timestamp) {
    const date = new Date(timestamp);
    return date.toISOString().split('T')[0];
}

function toggleDay(dayKey) {
    const content = document.getElementById(`day-content-${dayKey}`);
    const chevron = document.getElementById(`chevron-${dayKey}`);
    
    content.classList.toggle('expanded');
    chevron.classList.toggle('expanded');
}

function toggleRecap(recapId) {
    const content = document.getElementById(`recap-content-${recapId}`);
    const chevron = document.getElementById(`chevron-recap-${recapId}`);
    
    content.classList.toggle('hidden');
    chevron.classList.toggle('expanded');
}


// Show image in modal
function showImageInModal(entryId, imageIndex) {
    // Necesitamos acceder a 'entries' que es global en app.js
    if (typeof entries === 'undefined') return;

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


// Toggle note expansion
function toggleNote(entryId) {
    const noteDiv = document.getElementById('note-' + entryId);
    const btn = event.target;
    
    if (noteDiv) {
        if (noteDiv.classList.contains('expanded')) {
            noteDiv.classList.remove('expanded');
            btn.textContent = 'Read more';
        } else {
            noteDiv.classList.add('expanded');
            btn.textContent = 'Read less';
        }
    }
}

function renderTimeline(entries) {
    const container = document.getElementById('timeline-container');
    const emptyState = document.getElementById('empty-state');
    const footer = document.getElementById('footer');

    if (!entries || entries.length === 0) {
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

    const html = `
        <div class="timeline">
            <div class="timeline-line"></div>
            ${Object.keys(groupedByDay).map(dayKey => {
                const dayEntries = groupedByDay[dayKey];
                const firstEntry = dayEntries[0];
                
                // Separar recaps de otros eventos
                const recaps = dayEntries.filter(e => e.type === 'recap');
                const regularEntries = dayEntries.filter(e => e.type !== 'recap');
                
                return `
                    <div class="day-block">
                        <div class="day-header" onclick="toggleDay('${dayKey}')">
                            <span>${formatDate(firstEntry.timestamp)}</span>
                            <span class="chevron" id="chevron-${dayKey}">▼</span>
                        </div>
                        
                        ${recaps.map(recap => `
                            <div class="recap-block">
                                <div class="recap-header" onclick="toggleRecap('${recap.id}')">
                                    <span>Day Recap</span>
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
                                            <div style="margin-top: 8px; line-height: 1.6;">${recap.reflection}</div>
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
                                            <div style="display: flex; align-items: center; gap: 12px; margin-top: 8px; padding: 12px; border: 2px solid #000; background: #f9f9f9;">
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
                        
                        <div class="day-content" id="day-content-${dayKey}">
                            ${regularEntries.map(entry => {
                                const heightStyle = entry.isTimedActivity && entry.duration ? `min-height: ${Math.min(150 + entry.duration * 0.5, 300)}px;` : '';
                                const trackClass = entry.isQuickTrack ? 'track-event' : '';
                                const spentClass = entry.isSpent ? 'spent-event' : '';
                                
                                return `
                                <div class="breadcrumb-entry ${entry.isTimedActivity ? 'edit-mode' : ''} ${trackClass} ${spentClass}" style="${heightStyle}">
                                    <button class="mac-button edit-button" onclick="editEntry(${entry.id})">✏️ Edit</button>
                                    
                                    ${entry.isTimedActivity ? 
                                        `<div class="breadcrumb-time">⏰ ${formatTime(entry.timestamp)} - ${calculateEndTime(entry.timestamp, entry.duration)}</div>
                                        <div class="activity-label">${entry.activity}</div>
                                        <div style="font-size: 13px; color: #666; margin-top: 8px;">Duration: ${entry.duration} minutes</div>
                                        ${entry.optionalNote ? `
                                            <div class="optional-note" id="note-${entry.id}">${entry.optionalNote}</div>
                                            ${entry.optionalNote.length > 200 ? `<button class="read-more-btn" id="read-more-${entry.id}" onclick="toggleReadMore(${entry.id})">Read more</button>` : ''}
                                        ` : ''}` :
                                        `<div class="breadcrumb-time">
                                            ${entry.isQuickTrack ?
                                                `<span class="compact-time">⏰ ${formatTime(entry.timestamp)} ${entry.note}</span>` :
                                                `⏰ ${formatTime(entry.timestamp)}`
                                            }
                                            ${entry.isSpent ? `<span class="spent-badge">💰 €${entry.spentAmount.toFixed(2)}</span>` : ''}
                                        </div>`
                                    }
                                    
                                    ${entry.isTimedActivity ? '' : ''}
                                    ${entry.isQuickTrack && entry.optionalNote ? `
                                        <div class="optional-note" id="note-${entry.id}">${entry.optionalNote}</div>
                                        ${entry.optionalNote.length > 200 ? `<button class="read-more-btn" id="read-more-${entry.id}" onclick="toggleReadMore(${entry.id})">Read more</button>` : ''}
                                    ` : ''}
                                    
                                    ${!entry.isTimedActivity && !entry.isQuickTrack ? `
                                        <div style="display: flex; align-items: flex-start; gap: 12px; margin-bottom: 8px;">
                                            ${entry.mood ? `<span class="mood-display">${entry.mood.emoji}</span>` : ''}
                                            <div style="flex: 1;">
                                                <div class="breadcrumb-note" id="note-${entry.id}">${entry.note}</div>
                                                ${entry.note && entry.note.length > 200 ? `<button class="read-more-btn" id="read-more-${entry.id}" onclick="toggleReadMore(${entry.id})">Read more</button>` : ''}
                                            </div>
                                        </div>
                                    ` : ''}
                                    
                                    ${entry.weather || entry.location ? `
                                        <div style="font-size: 12px; color: ${entry.isQuickTrack ? '#ccc' : '#666'}; margin-bottom: 8px;">
                                            ${entry.weather ? `${entry.weather}` : ''}
                                            ${entry.weather && entry.location && entry.location.length < 20 ? ` • 📍 ${entry.location}` : ''}
                                            ${!entry.weather && entry.location ? `📍 ${entry.location}` : ''}
                                        </div>
                                    ` : ''}
                                    
                                    ${entry.audio ? `
                                        <div style="margin-top: 12px; margin-bottom: 12px;">
                                            <audio controls style="width: 100%; max-width: 300px;">
                                                <source src="${entry.audio}" type="audio/webm">
                                            </audio>
                                        </div>
                                    ` : ''}
                                    
                                    <div class="breadcrumb-preview">
                                        ${entry.images && entry.images.length > 0 ? entry.images.map(img => `
                                            <img src="${img}" class="preview-image-thumb" onclick="event.stopPropagation(); showImageInModal('${entry.id}', ${entry.images.indexOf(img)});">
                                        `).join('') : ''}
                                        ${entry.coords ? `<div class="preview-map-thumb" id="mini-map-${entry.id}"></div>` : ''}
                                        ${(entry.images && entry.images.length > 0) || entry.coords || entry.audio ? `
                                            <button class="mac-button preview-button" onclick="previewEntry(${entry.id})">🔍</button>
                                        ` : ''}
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
    
    // Necesitamos acceder a 'entries' que es global en app.js
    if (typeof entries === 'undefined') return;

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
                        mapEl.onclick = () => previewEntry(entry.id);
                    } catch (e) {
                        console.error('Error creating mini map:', e);
                    }
                }
            }, 100);
        }
    });
}
