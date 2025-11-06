// ===== modules/timeline/timeline.js (Timeline Module) =====

// Imports
import { getState } from '../../core/state.js';
import { 
    formatDate, formatTime, calculateEndTime, getDayKey, 
    getYearKey, getMonthKey, getWeekNumberKey, getMonthName 
} from '../../utils.js';
import { handleEditEntry, handlePreviewEntry } from '../../crud-handlers.js';

// --- Icon Helper Functions ---
const createIcon = (iconName, altText, extraStyle = '') => {
    return `<img src="assets/icons/${iconName}.svg" alt="${altText}" class="icon-mac" style="vertical-align: middle; margin-right: 4px; ${extraStyle}">`;
};
const createLocationIcon = () => {
     return `<img src="assets/icons/keep.svg" class="icon-mac" style="width: 12px; height: 12px; vertical-align: middle; margin-right: 2px;">`;
}

/**
 * Initializes all event listeners for the timeline container.
 */
export function initTimeline() {
    document.getElementById('timeline-container').addEventListener('click', (e) => {
        
        // Handle Year/Month/Week toggles
        if (e.target.closest('.year-header')) {
            const header = e.target.closest('.year-header');
            const yearBlock = header.closest('.year-block');
            const content = yearBlock.querySelector('.year-content');
            const chevron = header.querySelector('.chevron-up');
            if (content) content.classList.toggle('expanded');
            if (chevron) chevron.classList.toggle('expanded');
            return;
        }
        
        if (e.target.closest('.month-header')) {
            const header = e.target.closest('.month-header');
            const monthBlock = header.closest('.month-block');
            const content = monthBlock.querySelector('.month-content');
            const chevron = header.querySelector('.chevron-up');
            if (content) content.classList.toggle('expanded');
            if (chevron) chevron.classList.toggle('expanded');
            return;
        }
        
        if (e.target.closest('.week-header')) {
            const header = e.target.closest('.week-header');
            const weekBlock = header.closest('.week-block');
            const content = weekBlock.querySelector('.week-content');
            const chevron = header.querySelector('.chevron-up');
            if (content) content.classList.toggle('expanded');
            if (chevron) chevron.classList.toggle('expanded');
            return;
        }

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
            return;
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
            return;
        }

        // Handle Clicks on Entry Cards
        const entryEl = e.target.closest('.breadcrumb-entry, .recap-block');
        
        if (!entryEl) return;

        const id = entryEl.dataset.id;
        
        if (e.target.closest('.btn-edit')) {
            e.stopPropagation();
            handleEditEntry(id);
            return;
        }
        
        if (e.target.closest('.preview-image-thumb')) {
            e.stopPropagation();
            const imageIndex = e.target.dataset.index;
            handlePreviewEntry(id, imageIndex);
            return;
        }

        if (e.target.closest('.preview-map-thumb')) {
            e.stopPropagation();
            handlePreviewEntry(id);
            return;
        }
        
        if (e.target.closest('.read-more-btn')) {
            e.stopPropagation();
            const noteEl = entryEl.querySelector('.breadcrumb-note, .optional-note');
            if (noteEl) {
                noteEl.classList.toggle('expanded');
                e.target.textContent = noteEl.classList.contains('expanded') ? 'Show less' : 'Read more';
            }
            return;
        }

        if (e.target.closest('audio')) {
            e.stopPropagation();
            return;
        }

        if (entryEl.classList.contains('breadcrumb-entry')) {
            handlePreviewEntry(id);
            return;
        }
    });
}

/**
 * Renders a single day block
 */
function renderDayBlock(dayKey, dayEntries) {
    const todayKey = getDayKey(new Date().toISOString());
    const isToday = (dayKey === todayKey);
    const expandedClass = isToday ? 'expanded' : '';
    
    const recaps = dayEntries.filter(e => e.type === 'recap');
    const regularEntries = dayEntries.filter(e => e.type !== 'recap');

    return `
        <div class="day-block" data-day="${dayKey}">
            <div class="day-header">
                <span>${formatDate(dayKey + 'T12:00:00')}</span>
                <span class="chevron ${expandedClass}" id="chevron-${dayKey}">▼</span>
            </div>
            
            ${recaps.map(recap => `
                <div class="recap-block" data-id="${recap.id}">
                    <div class="recap-header">
                        <span>${createIcon('star', 'Recap')} Day Recap</span>
                        <span class="chevron-recap" id="chevron-recap-${recap.id}">▼</span>
                    </div>
                    <div class="recap-content hidden" id="recap-content-${recap.id}">
                        <button class="mac-button edit-button btn-edit">
                            ${createIcon('edit', 'Edit')} Edit
                        </button>
                        
                        <div style="margin-bottom: 16px;">
                            <strong>Rating:</strong> ${recap.rating}/10
                            <div style="font-size: 12px; letter-spacing: -1px; margin-top: 4px; line-height: 1.2;">
                                ${'⭐'.repeat(recap.rating)}
                            </div>
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
                                <ul style="margin: 8px 0; padding-left: 20px;">
                                    ${recap.highlights.filter(h => h).map(h => `<li style="margin-bottom: 4px;">${h}</li>`).join('')}
                                </ul>
                            </div>
                        ` : ''}
                        
                        ${recap.lowlights && recap.lowlights.length > 0 && recap.lowlights.some(l => l) ? `
                            <div style="margin-bottom: 16px;">
                                <strong>Lowlights:</strong>
                                <ul style="margin: 8px 0; padding-left: 20px;">
                                    ${recap.lowlights.filter(l => l).map(l => `<li style="margin-bottom: 4px;">${l}</li>`).join('')}
                                </ul>
                            </div>
                        ` : ''}
                        
                        ${recap.bso ? `
                            <div style="margin-bottom: 16px;">
                                <strong>BSO of the Day:</strong>
                                <div style="display: flex; align-items: center; gap: 12px; margin-top: 8px; padding: 12px; border: 2px solid #000; background: #f9f9f9;">
                                    <img src="${recap.bso.artwork}" style="width: 60px; height: 60px; border: 2px solid #000;">
                                    <div style="flex: 1;">
                                        <div style="font-weight: bold;">${recap.bso.name}</div>
                                        <div style="font-size: 12px; color: #666;">${recap.bso.artist}</div>
                                    </div>
                                    <a href="${recap.bso.url}" target="_blank" style="text-decoration: none;">
                                        ${createIcon('link', 'Listen')}
                                    </a>
                                </div>
                            </div>
                        ` : ''}
                        
                        ${recap.gratitude ? `
                            <div>
                                <strong>Gratitude:</strong>
                                <div style="margin-top: 8px; line-height: 1.6; white-space: pre-wrap;">${recap.gratitude}</div>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `).join('')}
            
            <div class="day-content ${expandedClass}" id="day-content-${dayKey}">
                ${regularEntries.map(entry => {
                    const heightStyle = entry.isTimedActivity && entry.duration ? 
                        `min-height: ${Math.max(100, entry.duration * 1.5)}px;` : '';
                    
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
                                <div class="breadcrumb-time">${createIcon('time', 'Time')} ${formatTime(entry.timestamp)} - ${calculateEndTime(entry.timestamp, entry.duration)}</div>
                                <div class="time-event-duration">Duration: ${entry.duration} minutes</div>
                                <div class="time-event-activity-box">${entry.activity}</div>
                            </div>
                            ${entry.optionalNote ? `
                                <div class="time-event-note-box">${entry.optionalNote}</div>
                            ` : ''}` :
                            `<div class="breadcrumb-time">
                                ${entry.isQuickTrack ?
                                    `<span class="compact-time">${createIcon('time', 'Time')} ${formatTime(entry.timestamp)} ${entry.note}</span>` :
                                    `${createIcon('time', 'Time')} ${formatTime(entry.timestamp)}`
                                }
                                ${entry.isSpent ? `<span class="spent-badge">${createIcon('money', 'Spent')} €${entry.spentAmount.toFixed(2)}</span>` : ''}
                            </div>`
                        }
                        
                        ${entry.isQuickTrack && entry.optionalNote ? `
                            <div class="optional-note">${optionalNoteContent}</div>
                            ${needsReadMoreOptional ? `<button class="read-more-btn">Read more</button>` : ''}
                        ` : ''}
                        
                        ${!entry.isTimedActivity && !entry.isQuickTrack && !entry.isSpent && entry.type !== 'recap' ? `
                            <div style="display: flex; align-items: flex-start; gap: 12px; margin-bottom: 8px;">
                                ${entry.mood !== undefined && entry.mood !== null ? 
                                    `<img src="assets/icons/mood-icon-${entry.mood}.svg" alt="Mood" class="icon-mac" style="width: 32px; height: 32px; flex-shrink: 0;">` 
                                    : ''}
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
                                ${entry.location ? `<span>${createLocationIcon()} ${entry.location}</span>` : ''}
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
    `;
}

/**
 * Renders the entire timeline with nesting
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

    const now = new Date();
    const currentWeekKey = getWeekNumberKey(now.toISOString());

    // Group entries
    const grouped = {};
    entries.forEach(entry => {
        const yearKey = getYearKey(entry.timestamp);
        const monthKey = getMonthKey(entry.timestamp);
        const weekKey = getWeekNumberKey(entry.timestamp);
        const dayKey = getDayKey(entry.timestamp);

        if (!grouped[yearKey]) grouped[yearKey] = {};
        if (!grouped[yearKey][monthKey]) grouped[yearKey][monthKey] = {};
        if (!grouped[yearKey][monthKey][weekKey]) grouped[yearKey][monthKey][weekKey] = {};
        if (!grouped[yearKey][monthKey][weekKey][dayKey]) grouped[yearKey][monthKey][weekKey][dayKey] = [];
        
        grouped[yearKey][monthKey][weekKey][dayKey].push(entry);
    });

    const sortedYearKeys = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

    const html = `
        <div class="timeline">
            <div class="timeline-line"></div>
            ${sortedYearKeys.map((yearKey, yearIdx) => {
                const yearData = grouped[yearKey];
                const sortedMonthKeys = Object.keys(yearData).sort((a, b) => b.localeCompare(a));
                const yearExpandedClass = yearIdx === 0 ? 'expanded' : '';
                
                return `
                <div class="year-block">
                    <div class="year-content ${yearExpandedClass}">
                        ${sortedMonthKeys.map((monthKey, monthIdx) => {
                            const monthData = yearData[monthKey];
                            const sortedWeekKeys = Object.keys(monthData).sort((a, b) => b.localeCompare(a));
                            const monthExpandedClass = monthIdx === 0 ? 'expanded' : '';
                            
                            return `
                            <div class="month-block">
                                <div class="month-content ${monthExpandedClass}">
                                    ${sortedWeekKeys.map((weekKey, weekIdx) => {
                                        const weekData = monthData[weekKey];
                                        const isCurrentWeek = (weekKey === currentWeekKey);
                                        const sortedDayKeys = Object.keys(weekData).sort((a, b) => b.localeCompare(a));
                                        const weekExpandedClass = isCurrentWeek ? 'expanded' : '';
                                        const weekNum = weekKey.split('-W')[1].replace(/^0+/, '');
                                        
                                        return `
                                        <div class="week-block">
                                            <div class="week-content ${weekExpandedClass}">
                                                ${sortedDayKeys.map(dayKey => {
                                                    return renderDayBlock(dayKey, weekData[dayKey]);
                                                }).join('')}
                                            </div>
                                            <div class="week-header">
                                                <span>Week ${weekNum}</span>
                                                <span class="chevron-up ${weekExpandedClass}">▼</span>
                                            </div>
                                        </div>
                                        `;
                                    }).join('')}
                                </div>
                                <div class="month-header">
                                    <span>${getMonthName(monthKey)}</span>
                                    <span class="chevron-up ${monthExpandedClass}">▼</span>
                                </div>
                            </div>
                            `;
                        }).join('')}
                    </div>
                    <div class="year-header">
                        <span>${yearKey}</span>
                        <span class="chevron-up ${yearExpandedClass}">▼</span>
                    </div>
                </div>
                `;
            }).join('')}
        </div>
    `;
    
    container.innerHTML = html;
    
    // Mini-maps
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
                    } catch (e) {
                        console.error('Error creating mini map:', e);
                        mapEl.innerHTML = "Map failed";
                    }
                }
            }, 100);
        }
    });
}
