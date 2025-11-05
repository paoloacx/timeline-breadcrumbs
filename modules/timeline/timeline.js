// ===== modules/timeline/timeline.js (Timeline Module) =====

// Imports
import { getState } from '../../core/state.js';
// MODIFIED: Import new date utils
import { 
    formatDate, formatTime, calculateEndTime, getDayKey, 
    getYearKey, getMonthKey, getWeekNumberKey, getMonthName 
} from '../../utils.js';
import { handleEditEntry, handlePreviewEntry } from '../../crud-handlers.js';

/**
 * Initializes all event listeners for the timeline container.
 */
export function initTimeline() {
    document.getElementById('timeline-container').addEventListener('click', (e) => {
        
        // --- NEW: Handle Nested Header Toggles (Year, Month, Week) ---
        const nestedHeader = e.target.closest('.nested-header');
        if (nestedHeader) {
            const contentId = nestedHeader.dataset.target;
            const content = document.getElementById(contentId);
            const chevron = nestedHeader.querySelector('.chevron-up');
            
            if (content) content.classList.toggle('expanded');
            if (chevron) chevron.classList.toggle('expanded');
            return; // Acción completada
        }

        // --- EXISTING: Handle Toggle Day (Expands Down) ---
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

        // --- EXISTING: Handle Toggle Recap (Expands Down) ---
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

        // --- EXISTING: Handle Clicks on Entry Cards ---
        const entryEl = e.target.closest('.breadcrumb-entry, .recap-block');
        
        if (!entryEl) return; // Si no fue en un crumb, no hacer nada más

        const id = entryEl.dataset.id;
        
        // Handle Edit (Still needed for Recaps)
        if (e.target.closest('.btn-edit')) {
            e.stopPropagation();
            handleEditEntry(id);
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

        // Handle Audio Controls (Prevent preview)
        if (e.target.closest('audio')) {
            e.stopPropagation(); // Prevent card click
            return;
        }

        // Handle click on the card itself to open preview
        if (entryEl.classList.contains('breadcrumb-entry')) {
            handlePreviewEntry(id);
            return; // Action completed
        }
    });
}

// --- MODIFIED: Helper function to render a single Day Block (with Spine structure) ---
/**
 * Renders the HTML for a single day block.
 * @param {string} dayKey - The YYYY-MM-DD key for the day.
 * @param {Array} dayEntries - The entries for that day.
 * @returns {string} HTML string for the day block.
 */
function renderDayBlock(dayKey, dayEntries) {
    const todayKey = getDayKey(new Date().toISOString());
    const isToday = (dayKey === todayKey);
    // Days expand DOWN, so 'expanded' class opens it.
    const expandedClass = isToday ? 'expanded' : ''; 
    
    const recaps = dayEntries.filter(e => e.type === 'recap');
    const regularEntries = dayEntries.filter(e => e.type !== 'recap');

    // MODIFIED: Added timeline-node (the circle) and wrapper
    return `
    <div class="timeline-day-wrapper">
        <div class="timeline-node"></div>
        <div class="day-block" data-day="${dayKey}">
            <div class="day-header">
                <span>${formatDate(dayKey + 'T12:00:00')}</span>
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
                        
                        ${recap.highlights && recap.highlights.length > 0 && recap.highlights.some(h => h) ? `
                            <div style="margin-bottom: 16px;">
                                <strong>Highlights:</strong>
                                <div class="recap-highlights-container" style="margin-top: 8px;">
                                    ${recap.highlights.filter(h => h).map(h => `<span class="recap-highlight-tag">${h}</span>`).join('')}
                                </div>
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
                        ${entry.isTimedActivity ? 
                            `<div>
                                <div class="breadcrumb-time">⏰ ${formatTime(entry.timestamp)} - ${calculateEndTime(entry.timestamp, entry.duration)}</div>
                                <div class="time-event-duration">Duration: ${entry.duration} minutes</div>
                                <div class="time-event-activity-box">${entry.activity}</div>
                            </div>
                            ${entry.optionalNote ? `
                                <div class="time-event-note-box">${entry.optionalNote}</div>
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
                            <div class="optional-note">${optionalNoteContent}</div>
                            ${needsReadMoreOptional ? `<button class="read-more-btn">Read more</button>` : ''}
                        ` : ''}
                        
                        ${!entry.isTimedActivity && !entry.isQuickTrack && !entry.isSpent && entry.type !== 'recap' ? `
                            <div style="display: flex; align-items: flex-start; gap: 12px; margin-bottom: 8px;">
                                ${entry.mood ? `<span class="mood-display">${entry.mood.emoji}</span>` : ''}
                                <div style="flex: 1;">
                                    <div class="breadcrumb-note">${noteContent}</div>
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
                            <div style="margin-top: 12px; margin-bottom: 12px; text-align: left;">
                                <audio controls style="width: 100%; max-width: 300px;">
                                    <source src="${entry.audio}">
                                </audio>
                            </div>
                        ` : ''}
                        
                        <div class="breadcrumb-preview" style="text-align: left;">
                            ${entry.images && entry.images.length > 0 ? entry.images.map((img, idx) => `
                                <img src="${img}" class="preview-image-thumb" alt="Thumbnail ${idx+1}" data-index="${idx}">
                            `).join('') : ''}
                            ${entry.coords ? `<div class="preview-map-thumb" id="mini-map-${entry.id}"></div>` : ''}
                        </div>
                    </div>
                    `}).join('')}
            </div>
        </div>
    </div>
    `;
}


/**
 * Renders the entire timeline based on the global state.
 */
export function renderTimeline() {
    const { entries } = getState();
    const container = document.getElementById('timeline-container');
    const emptyState = document.getElementById('empty-state');

    if (entries.length === 0) {
        container.innerHTML = '';
        emptyState.classList.remove('hidden');
        return;
    }

    emptyState.classList.add('hidden');

    // --- NEW: Multi-level grouping ---
    const grouped = {};

    entries.forEach(entry => {
        const yearKey = getYearKey(entry.timestamp);
        const monthKey = getMonthKey(entry.timestamp);
        const weekKey = getWeekNumberKey(entry.timestamp); // MODIFIED: Use week number key
        const dayKey = getDayKey(entry.timestamp);

        if (!grouped[yearKey]) grouped[yearKey] = {};
        if (!grouped[yearKey][monthKey]) grouped[yearKey][monthKey] = {};
        if (!grouped[yearKey][monthKey][weekKey]) grouped[yearKey][monthKey][weekKey] = {};
        if (!grouped[yearKey][monthKey][weekKey][dayKey]) grouped[yearKey][monthKey][weekKey][dayKey] = [];
        
        grouped[yearKey][monthKey][weekKey][dayKey].push(entry);
    });

    // --- NEW: HTML generation from nested groups ---
    
    // MODIFIED Sort Years: Newest at the top (descending)
    const sortedYearKeys = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

    const html = `
        <div class="timeline">
            <div class="timeline-spine">
                <div class="timeline-line-vertical"></div>
            </div>
            
            <div class="timeline-content">
                ${sortedYearKeys.map((yearKey, yearIdx) => {
                    const yearData = grouped[yearKey];
                    // MODIFIED Sort Months: Newest at the top (descending)
                    const sortedMonthKeys = Object.keys(yearData).sort((a, b) => b.localeCompare(a));
                    
                    // MODIFIED: Expand the first (newest) year by default
                    const yearExpandedClass = yearIdx === 0 ? 'expanded' : '';
                    
                    // --- Render Year Block (Inverted: content first) ---
                    return `
                    <div class="timeline-day-wrapper"> 
                        <div class="timeline-node"></div>
                        <div class="year-block" data-year="${yearKey}">
                            <div class="nested-content ${yearExpandedClass}" id="year-content-${yearKey}">
                                ${sortedMonthKeys.map((monthIdx, monthKey) => {
                                    const monthData = yearData[monthKey];
                                    // MODIFIED Sort Weeks: Newest at the top (descending)
                                    const sortedWeekKeys = Object.keys(monthData).sort((a, b) => b.localeCompare(a));
                                    
                                    // MODIFIED: Expand the first (newest) month by default
                                    const monthExpandedClass = monthIdx === 0 ? 'expanded' : '';
                                    
                                    // --- Render Month Block (Inverted: content first) ---
                                    return `
                                    <div class="timeline-day-wrapper">
                                        <div class="timeline-node"></div>
                                        <div class="month-block" data-month="${monthKey}">
                                            <div class="nested-content ${monthExpandedClass}" id="month-content-${monthKey}">
                                                ${sortedWeekKeys.map((weekKey, weekIdx) => {
                                                    const weekData = monthData[weekKey];
                                                    // MODIFIED Sort Days: Newest at the top (descending)
                                                    const sortedDayKeys = Object.keys(weekData).sort((a, b) => b.localeCompare(a));
                                                    
                                                    // MODIFIED: Expand the first (newest) week by default
                                                    const weekExpandedClass = weekIdx === 0 ? 'expanded' : '';
                                                    
                                                    // MODIFIED: Get week number from key
                                                    const weekNum = weekKey.split('-W')[1].replace(/^0+/, ''); // "2025-W05" -> "5"
                                                    
                                                    // --- Render Week Block (Inverted: content first) ---
                                                    return `
                                                    <div class="timeline-day-wrapper">
                                                        <div class="timeline-node"></div>
                                                        <div class="week-block" data-week="${weekKey}">
                                                            <div class="nested-content ${weekExpandedClass}" id="week-content-${weekKey}">
                                                                ${sortedDayKeys.map(dayKey => {
                                                                    // --- Render Day Block (NORMAL: header first) ---
                                                                    return renderDayBlock(dayKey, weekData[dayKey]);
                                                                }).join('')}
                                                            </div>
                                                            <div class="nested-header week-header" data-target="week-content-${weekKey}">
                                                                <span>Week ${weekNum}</span>
                                                                <span class="chevron-up ${weekExpandedClass}">▼</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    `;
                                                }).join('')}
                                            </div>
                                            <div class="nested-header month-header" data-target="month-content-${monthKey}">
                                                <span>${getMonthName(monthKey)}</span>
                                                <span class="chevron-up ${monthExpandedClass}">▼</span>
                                            </div>
                                        </div>
                                    </div>
                                    `;
                                }).join('')}
                            </div>
                            <div class="nested-header year-header" data-target="year-content-${yearKey}">
                                <span>${yearKey}</span>
                                <span class="chevron-up ${yearExpandedClass}">▼</span>
                            </div>
                        </div>
                    </div>
                    `;
                }).join('')}
            </div> </div>
    `;
    
    container.innerHTML = html;
    
    // --- Post-render logic (for mini-maps) ---
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
