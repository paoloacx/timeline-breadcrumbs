// ===== modules/timeline/timeline.js (Timeline Module) =====

// Imports
import { getState } from '../../core/state.js';
// MODIFIED: Import new date utils
import { 
    formatDate, formatTime, calculateEndTime, getDayKey, 
    getYearKey, getMonthKey, getWeekNumberKey, getMonthName 
} from '../../utils.js';
import { handleEditEntry, handlePreviewEntry } from '../../crud-handlers.js';

// --- NEW: Icon Helper Functions ---
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
        
        // --- NEW: Handle Nested Header Toggles (Year, Month, Week) ---
        const nestedHeader = e.target.closest('.nested-header');
        if (nestedHeader) {
            const contentId = nestedHeader.dataset.target;
            const content = document.getElementById(contentId);
            const chevron = nestedHeader.querySelector('.chevron-up, .chevron-down');
            
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

// --- NEW: Helper function to render a single Day Block ---
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

    // Note: Day block structure is NOT inverted
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
                ${regularEntries.map(entry => `
                    <div class="breadcrumb-entry" data-id="${entry.id}">
                        <div class="breadcrumb-header" style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; margin-bottom: 12px;">
                            <div style="flex: 1;">
                                <div style="font-weight: bold; font-size: 14px;">${formatTime(entry.timestamp)}</div>
                                ${entry.endTime ? `<div style="font-size: 12px; color: #666;">Ended: ${entry.endTime}</div>` : ''}
                            </div>
                            <div class="breadcrumb-mood">
                                ${entry.mood !== undefined && entry.mood !== null ? 
                                    `<img src="assets/icons/mood-icon-${entry.mood}.svg" alt="Mood" class="icon-mac" style="width: 24px; height: 24px;">` 
                                    : ''}
                            </div>
                        </div>
                        
                        ${entry.title ? `
                            <div class="breadcrumb-title">${entry.title}</div>
                        ` : ''}
                        
                        ${entry.note ? `
                            <div class="breadcrumb-note ${entry.note.length > 200 ? 'truncated' : ''}" style="margin-bottom: 12px;">
                                ${entry.note}
                            </div>
                            ${entry.note.length > 200 ? '<button class="read-more-btn mac-button">Read more</button>' : ''}
                        ` : ''}
                        
                        ${entry.location ? `
                            <div style="font-size: 12px; color: #666; margin-bottom: 12px; display: flex; align-items: center; gap: 4px;">
                                ${createLocationIcon()}
                                <span>${entry.location}</span>
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
                    `).join('')}
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

    // Get current week and year for comparison
    const now = new Date();
    const currentWeekKey = getWeekNumberKey(now.toISOString());
    const currentYearKey = getYearKey(now.toISOString());

    // --- NEW: Multi-level grouping ---
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

    // --- NEW: HTML generation from nested groups ---
    
    // Sort Years: Newest at the top (descending)
    const sortedYearKeys = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

    const html = `
        <div class="timeline">
            <div class="timeline-line"></div>
            ${sortedYearKeys.map((yearKey, yearIdx) => {
                const yearData = grouped[yearKey];
                const isCurrentYear = (yearKey === currentYearKey);
                // Sort Months: Newest at the top (descending)
                const sortedMonthKeys = Object.keys(yearData).sort((a, b) => b.localeCompare(a));
                
                // Expand the current year by default
                const yearExpandedClass = isCurrentYear ? 'expanded' : '';
                
                // --- Render Year Block (Inverted: content first, header after) ---
                return `
                <div class="year-block" data-year="${yearKey}">
                    <div class="nested-content ${yearExpandedClass}" id="year-content-${yearKey}">
                        ${sortedMonthKeys.map((monthKey, monthIdx) => {
                            const monthData = yearData[monthKey];
                            // Sort Weeks: Newest at the top (descending)
                            const sortedWeekKeys = Object.keys(monthData).sort((a, b) => b.localeCompare(a));
                            
                            // Expand the first (newest) month of current year by default
                            const monthExpandedClass = (isCurrentYear && monthIdx === 0) ? 'expanded' : '';
                            
                            // --- Render Month Block (Inverted: content first, header after) ---
                            return `
                            <div class="month-block" data-month="${monthKey}">
                                <div class="nested-content ${monthExpandedClass}" id="month-content-${monthKey}">
                                    ${sortedWeekKeys.map((weekKey, weekIdx) => {
                                        const weekData = monthData[weekKey];
                                        const isCurrentWeek = (weekKey === currentWeekKey);
                                        // Sort Days: Newest at the top (descending)
                                        const sortedDayKeys = Object.keys(weekData).sort((a, b) => b.localeCompare(a));
                                        
                                        // Expand current week by default
                                        const weekExpandedClass = isCurrentWeek ? 'expanded' : '';
                                        
                                        // Get week number from key
                                        const weekNum = weekKey.split('-W')[1].replace(/^0+/, ''); // "2025-W05" -> "5"
                                        
                                        // --- MODIFIED: Render Week Block with different structure for current week ---
                                        if (isCurrentWeek) {
                                            // Current week: NORMAL structure (header first, expands DOWN)
                                            return `
                                            <div class="week-block week-current" data-week="${weekKey}">
                                                <div class="nested-header week-header" data-target="week-content-${weekKey}">
                                                    <span>Week ${weekNum}</span>
                                                    <span class="chevron-down ${weekExpandedClass}">▼</span>
                                                </div>
                                                <div class="nested-content ${weekExpandedClass}" id="week-content-${weekKey}">
                                                    ${sortedDayKeys.map(dayKey => {
                                                        return renderDayBlock(dayKey, weekData[dayKey]);
                                                    }).join('')}
                                                </div>
                                            </div>
                                            `;
                                        } else {
                                            // Other weeks: INVERTED structure (content first, expands UP)
                                            return `
                                            <div class="week-block" data-week="${weekKey}">
                                                <div class="nested-content ${weekExpandedClass}" id="week-content-${weekKey}">
                                                    ${sortedDayKeys.map(dayKey => {
                                                        return renderDayBlock(dayKey, weekData[dayKey]);
                                                    }).join('')}
                                                </div>
                                                <div class="nested-header week-header" data-target="week-content-${weekKey}">
                                                    <span>Week ${weekNum}</span>
                                                    <span class="chevron-up ${weekExpandedClass}">▼</span>
                                                </div>
                                            </div>
                                            `;
                                        }
                                    }).join('')}
                                </div>
                                <div class="nested-header month-header" data-target="month-content-${monthKey}">
                                    <span>${getMonthName(monthKey)}</span>
                                    <span class="chevron-up ${monthExpandedClass}">▼</span>
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
                `;
            }).join('')}
        </div>
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
