// ===== modules/timeline/timeline.js (Timeline Module) =====

// Imports
import { getState } from '../../core/state.js';
import { 
    formatDate, formatTime, calculateEndTime, getDayKey
} from '../../utils.js';
import { handleEditEntry, handlePreviewEntry } from '../../crud-handlers.js';
// P-FIX: Import the icon map
import { MOOD_ICON_MAP } from '../../ui-renderer.js';

// --- Icon Helper Functions ---
const createIcon = (iconName, altText, extraStyle = '') => {
    return `<img src="assets/icons/${iconName}.svg" alt="${altText}" class="icon-mac" style="vertical-align: middle; margin-right: 4px; ${extraStyle}">`;
};
const createLocationIcon = () => {
     return `<img src="assets/icons/keep.svg" class="icon-mac" style="width: 12px; height: 12px; vertical-align: middle; margin-right: 2px;">`;
}

// --- Pagination State ---
let currentDaysShown = 30; // Start with 30 days

/**
 * Initializes all event listeners for the timeline container.
 */
export function initTimeline() {
    const container = document.getElementById('timeline-container');
    
    container.addEventListener('click', (e) => {
        
        // Handle Load More button
        if (e.target.closest('#load-more-btn')) {
            e.preventDefault();
            currentDaysShown += 30;
            renderTimeline();
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
                
                // P2: Change toggle class for animation
                if (content) content.classList.toggle('expanded');
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
 * Resets pagination to initial state
 */
export function resetPagination() {
    currentDaysShown = 30;
}

/**
 * Renders the entire timeline based on the global state.
 * @param {Array} [entriesToRender] - Optional array of entries to render. If null, uses global state.
 */
export function renderTimeline(entriesToRender = null) {
    const { entries, settings } = getState(); // P-FIX: Get settings
    const renderData = entriesToRender || entries;
    const container = document.getElementById('timeline-container');
    const emptyState = document.getElementById('empty-state');

    if (renderData.length === 0) {
        // Check if it's an empty filter result
        if (entriesToRender) {
            container.innerHTML = `<div class="mac-window" style="margin: 16px;"><div class="mac-content"><p><strong>No entries found</strong></p><p>Your search or filter returned no results.</p></div></div>`;
            emptyState.classList.add('hidden');
        } else {
            // It's genuinely empty
            container.innerHTML = '';
            emptyState.classList.remove('hidden');
        }
        return;
    }

    emptyState.classList.add('hidden');

    // Group by day
    const grouped = {};
    renderData.forEach(entry => {
        const dayKey = getDayKey(entry.timestamp);
        if (!grouped[dayKey]) grouped[dayKey] = [];
        grouped[dayKey].push(entry);
    });

    // Sort days: newest first
    const sortedDayKeys = Object.keys(grouped).sort((a, b) => b.localeCompare(a));
    
    // Apply pagination (only if not showing filtered results)
    const displayedDayKeys = entriesToRender ? sortedDayKeys : sortedDayKeys.slice(0, currentDaysShown);
    const hasMoreDays = !entriesToRender && sortedDayKeys.length > currentDaysShown;
    const isEndOfTimeline = !entriesToRender && sortedDayKeys.length <= currentDaysShown;
    
    const todayKey = getDayKey(new Date().toISOString());

    const html = `
        <div class="timeline">
            <div class="timeline-line"></div>
            ${displayedDayKeys.map(dayKey => {
                const dayEntries = grouped[dayKey];
                
                // P-FIX: This is the line you asked about, with the 'else' part
                const isToday = (dayKey === todayKey); 
                const expandedClass = (isToday || entriesToRender) ? 'expanded' : '';
                
                const recaps = dayEntries.filter(e => e.type === 'recap');
                const regularEntries = dayEntries.filter(e => e.type !== 'recap');

                return `
                    <div class="day-block" data-day="${dayKey}">
                        <div class="day-header">
                            <span>${formatDate(dayKey + 'T12:00:00')}</span>
                            <span class="chevron ${expandedClass}" id="chevron-${dayKey}">▼</span>
                        </div>
                        
                        ${recaps.map(recap => {
                            // P-FIX: Expand recap if showing search results
                            const recapExpandedClass = entriesToRender ? 'expanded' : '';
                            return `
                            <div class="recap-block" data-id="${recap.id}">
                                <div class="recap-header">
                                    <span>${createIcon('star', 'Recap')} Day Recap</span>
                                    <span class="chevron-recap ${recapExpandedClass}" id="chevron-recap-${recap.id}">▼</span>
                                </div>
                                <div class="recap-content ${recapExpandedClass}" id="recap-content-${recap.id}">
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
                                    
                                    ${recap.track ? `
                                        <div style="margin-bottom: 16px;">
                                            <strong>BSO of the Day:</strong>
                                            <div style="display: flex; align-items: center; gap: 12px; margin-top: 8px; padding: 12px; border: 2px solid #000; background: #f9f9f9;">
                                                <img src="${recap.track.artwork}" style="width: 60px; height: 60px; border: 2px solid #000;">
                                                <div style="flex: 1;">
                                                    <div style="font-weight: bold;">${recap.track.name}</div>
                                                    <div style="font-size: 12px; color: #666;">${recap.track.artist}</div>
                                                </div>
                                                <a href="${recap.track.url}" target="_blank" style="text-decoration: none;">
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
                        `}).join('')}
                        
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

                                // P-FIX: Robust mood rendering logic
                                let moodHTML = '';
                                let moodLabel = 'Mood';
                                if (entry.mood !== undefined && entry.mood !== null) {
                                    let visual = null;
                                    
                                    if (typeof entry.mood === 'object') {
                                        // Type 1 (New): { visual: 'happy', label: 'Happy' }
                                        // Type 2 (Old): { emoji: '🙂', label: 'Happy' }
                                        visual = entry.mood.visual || entry.mood.emoji; // Use 'visual' first, fallback to 'emoji'
                                        moodLabel = entry.mood.label;
                                    } else if (typeof entry.mood === 'number') {
                                        // Type 3 (Broken Fix): 0
                                        if (settings.moods[entry.mood]) {
                                            visual = settings.moods[entry.mood].visual;
                                            moodLabel = settings.moods[entry.mood].label;
                                        }
                                    }
                                    
                                    if (visual) {
                                        const iconSrc = MOOD_ICON_MAP[visual]; // Check if it's a keyword
                                        if (iconSrc) {
                                            moodHTML = `<img src="${iconSrc}" alt="${moodLabel}" class="icon-mac" style="width: 32px; height: 32px; flex-shrink: 0;">`;
                                        } else {
                                            // It's an emoji
                                            moodHTML = `<span class="mood-emoji-visual" style="font-size: 32px; line-height: 1; flex-shrink: 0;">${visual}</span>`;
                                        }
                                    }
                                }
                                // --- End P-FIX ---

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
                                                /* SYNTAX FIX HERE: Added comma */
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
                                            ${moodHTML}
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
            }).join('')}
            
            ${hasMoreDays ? `
                <div class="load-more-container">
                    <button id="load-more-btn" class="mac-button load-more-btn">
                        Load 30 more days
                    </button>
                </div>
            ` : ''}
            
            ${isEndOfTimeline ? `
                <div class="timeline-footer">
                    <img src="footer.png" alt="End of timeline" class="footer-banner">
                </div>
            ` : ''}
        </div>
    `;
    
    container.innerHTML = html;
    
    // Mini-maps
    renderData.forEach(entry => {
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
