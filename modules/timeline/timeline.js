// ===== modules/timeline/timeline.js (Timeline Module) =====

// Imports
import { getState } from '../../state.js';
import { formatDate, formatTime, calculateEndTime, getDayKey } from '../../utils.js';
import { handleEditEntry, handlePreviewEntry } from '../../crud-handlers.js';

/**
 * Initializes all event listeners for the timeline container.
 */
export function initTimeline() {
    document.getElementById('timeline-container').addEventListener('click', (e) => {
        
        // Handle Toggle Day
        const dayHeader = e.target.closest('.day-header');
        if (dayHeader) {
            const dayBlock = dayHeader.closest('.day-block');
            if (dayBlock) {
                const dayKey = dayBlock.dataset.day;
                const content = document.getElementById(`day-content-${dayKey}`);
                const chevron = document.getElementById(`chevron-${dayKey}`);
                if (content) content.classList.toggle('expanded');
                if (chevron) chevron.classList.toggle('expanded');
            }
            return; // Acción completada
        }

        // Handle Toggle Recap
        const recapHeader = e.target.closest('.recap-header');
        if (recapHeader) {
            const recapBlock = recapHeader.closest('.recap-block');
            if (recapBlock) {
                const content = recapBlock.querySelector('.recap-content');
                const chevron = recapBlock.querySelector('.chevron-recap');
                if (content) content.classList.toggle('hidden');
                if (chevron) chevron.classList.toggle('expanded');
            }
            return; // Acción completada
        }

        // Comprueba si el clic fue en un crumb O en un recap-block
        const entryEl = e.target.closest('.breadcrumb-entry, .recap-block');
        
        if (!entryEl) return; // Si no fue en un crumb, no hacer nada más

        const id = entryEl.dataset.id;
        
        // Handle Edit
        if (e.target.closest('.btn-edit')) {
            e.stopPropagation();
            handleEditEntry(id);
            return;
        }
        
        // Handle Preview
        if (e.target.closest('.btn-preview')) {
            e.stopPropagation();
            handlePreviewEntry(id);
            return;
        }

        // Handle Image Click
        if (e.target.closest('.preview-image-thumb')) {
            e.stopPropagation();
            const imageIndex = e.target.dataset.index;
            handlePreviewEntry(id, imageIndex); // Preview specific image
            return;
        }

        // Handle Map Click
        if (e.target.closest('.preview-map-thumb')) {
            e.stopPropagation();
            handlePreviewEntry(id);
            return;
        }
        
        // Handle Read More
        if (e.target.closest('.read-more-btn')) {
            e.stopPropagation();
            const noteEl = entryEl.querySelector('.breadcrumb-note, .optional-note');
            if (noteEl) {
                noteEl.classList.toggle('expanded');
                e.target.textContent = noteEl.classList.contains('expanded') ? 'Show less' : 'Read more';
            }
            return;
        }
    });
}


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
                        // El click es manejado por delegación
                    } catch (e) {
                        console.error('Error creating mini map:', e);
                        mapEl.innerHTML = "Map failed";
                    }
                }
            }, 100);
        }
    });
}
