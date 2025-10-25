// --- Funciones de Renderizado del Timeline ---

function renderTimeline() {
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

    // Ordenar los días por fecha (más reciente primero)
    const sortedDayKeys = Object.keys(groupedByDay).sort((a, b) => new Date(b) - new Date(a));

    const html = `
        <div class="timeline">
            <div class="timeline-line"></div>
            ${sortedDayKeys.map(dayKey => {
                const dayEntries = groupedByDay[dayKey];
                const firstEntry = dayEntries[0];
                
                // Separar recaps de otros eventos
                const recaps = dayEntries.filter(e => e.type === 'recap');
                // Ordenar entradas regulares por hora (más reciente primero)
                const regularEntries = dayEntries
                    .filter(e => e.type !== 'recap')
                    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
                
                return `
                    <div class="day-block">
                        <div class="day-header" onclick="toggleDay('${dayKey}')">
                            <span>${formatDate(firstEntry.timestamp)}</span>
                            <span class="chevron expanded" id="chevron-${dayKey}">▼</span>
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
                                            <div style="margin-top: 8px; line-height: 1.6;">${recap.reflection.replace(/\n/g, '<br>')}</div>
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
                        
                        <div class="day-content expanded" id="day-content-${dayKey}">
                            ${regularEntries.map(entry => {
                                const heightStyle = entry.isTimedActivity && entry.duration ? `min-height: ${Math.min(150 + entry.duration * 0.5, 300)}px;` : '';
                                const trackClass = entry.isQuickTrack ? 'track-event' : '';
                                const spentClass = entry.isSpent ? 'spent-event' : '';
                                const noteHtml = (entry.note || '').replace(/\n/g, '<br>');
                                const optionalNoteHtml = (entry.optionalNote || '').replace(/\n/g, '<br>');
                                
                                return `
                                <div class="breadcrumb-entry ${entry.isTimedActivity ? 'time-event' : ''} ${trackClass} ${spentClass}" style="${heightStyle}">
                                    <button class="mac-button edit-button" onclick="editEntry(${entry.id})">✏️ Edit</button>
                                    
                                    ${entry.isTimedActivity ? 
                                        `<!-- Time Event -->
                                        <div class="breadcrumb-time">⏰ ${formatTime(entry.timestamp)} - ${calculateEndTime(entry.timestamp, entry.duration)}</div>
                                        <div class="activity-label">${entry.activity}</div>
                                        <div style="font-size: 13px; color: #666; margin-top: 8px;">Duration: ${entry.duration} minutes</div>
                                        ${entry.optionalNote ? `
                                            <div class="optional-note" id="note-${entry.id}">${optionalNoteHtml}</div>
                                            ${entry.optionalNote.length > 200 ? `<button class="read-more-btn" id="read-more-${entry.id}" onclick="toggleReadMore(${entry.id})">Read more</button>` : ''}
                                        ` : ''}` 
                                    : 
                                        entry.isQuickTrack ?
                                        `<!-- Quick Track -->
                                        <div class="breadcrumb-time">
                                            <span class="compact-time">⏰ ${formatTime(entry.timestamp)} ${entry.note}</span>
                                        </div>
                                        ${entry.optionalNote ? `
                                            <div class="optional-note" id="note-${entry.id}">${optionalNoteHtml}</div>
                                            ${entry.optionalNote.length > 200 ? `<button class="read-more-btn" id="read-more-${entry.id}" onclick="toggleReadMore(${entry.id})">Read more</button>` : ''}
                                        ` : ''}`
                                    :
                                        entry.isSpent ?
                                        `<!-- Spent Event -->
                                        <div class="breadcrumb-time">
                                            ⏰ ${formatTime(entry.timestamp)}
                                            <span class="spent-badge">💰 €${entry.spentAmount.toFixed(2)}</span>
                                        </div>
                                        <div class="breadcrumb-note" id="note-${entry.id}">${noteHtml}</div>
                                        ${entry.note && entry.note.length > 200 ? `<button class="read-more-btn" id="read-more-${entry.id}" onclick="toggleReadMore(${entry.id})">Read more</button>` : ''}`
                                    :
                                        `<!-- Crumb Event -->
                                        <div class="breadcrumb-time">⏰ ${formatTime(entry.timestamp)}</div>
                                        <div style="display: flex; align-items: flex-start; gap: 12px; margin-bottom: 8px;">
                                            ${entry.mood ? `<span class="mood-display">${entry.mood.emoji}</span>` : ''}
                                            <div style="flex: 1;">
                                                <div class="breadcrumb-note" id="note-${entry.id}">${noteHtml}</div>
                                                ${entry.note && entry.note.length > 200 ? `<button class="read-more-btn" id="read-more-${entry.id}" onclick="toggleReadMore(${entry.id})">Read more</button>` : ''}
                                            </div>
                                        </div>`
                                    }
                                    
                                    ${!entry.isTimedActivity && !entry.isQuickTrack ? `
                                        ${entry.weather || entry.location ? `
                                            <div style="font-size: 12px; color: #666; margin-bottom: 8px;">
                                                ${entry.weather ? `${entry.weather}` : ''}
                                                ${entry.weather && entry.location ? ` • 📍 ${entry.location}` : ''}
                                                ${!entry.weather && entry.location ? `📍 ${entry.location}` : ''}
                                            </div>
                                        ` : ''}
                                    ` : ''}
                                    
                                    ${entry.audio ? `
                                        <div style="margin-top: 12px; margin-bottom: 12px;">
                                            <audio controls style="width: 100%; max-width: 300px;">
                                                <source src="${entry.audio}">
                                            </audio>
                                        </div>
                                    ` : ''}
                                    
                                    <div class="breadcrumb-preview">
                                        ${entry.images && entry.images.length > 0 ? entry.images.map((img, index) => `
                                            <img src="${img}" class="preview-image-thumb" onclick="event.stopPropagation(); showImageInModal('${entry.id}', ${index});">
                                        `).join('') : ''}
                                        ${entry.coords ? `<div class="preview-map-thumb" id="mini-map-${entry.id}"></div>` : ''}
                                        
                                        <!-- Botón de preview solo si hay algo que previsualizar (mapa, audio, o imágenes) -->
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
    
    // Inicializar mini-mapas después de renderizar el HTML
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

// --- Funciones Ayudantes de Renderizado ---

// Alternar "Leer más"
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

// Formatear Fecha
function formatDate(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleDateString(undefined, { // Usar locale del navegador
        weekday: 'long',
        day: 'numeric', 
        month: 'long', 
        year: 'numeric'
    });
}

// Formatear Hora
function formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString(undefined, { // Usar locale del navegador
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: false 
    });
}

// Calcular Hora de Fin
function calculateEndTime(timestamp, durationMinutes) {
    const date = new Date(timestamp);
    date.setMinutes(date.getMinutes() + durationMinutes);
    return date.toLocaleTimeString(undefined, { // Usar locale del navegador
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: false 
    });
}

// Obtener Clave del Día (YYYY-MM-DD)
function getDayKey(timestamp) {
    const date = new Date(timestamp);
    return date.toISOString().split('T')[0];
}

// Alternar visibilidad del día
function toggleDay(dayKey) {
    const content = document.getElementById(`day-content-${dayKey}`);
    const chevron = document.getElementById(`chevron-${dayKey}`);
    
    content.classList.toggle('expanded');
    chevron.classList.toggle('expanded');
}

// Alternar visibilidad del recap
function toggleRecap(recapId) {
    const content = document.getElementById(`recap-content-${recapId}`);
    const chevron = document.getElementById(`chevron-recap-${recapId}`);
    
    content.classList.toggle('hidden');
    chevron.classList.toggle('expanded');
}
