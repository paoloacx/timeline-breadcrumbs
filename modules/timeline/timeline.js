// ===== modules/timeline/timeline.js (Timeline Module) =====

// Imports
import { getState } from '../../core/state.js';
import { formatDate, formatTime, calculateEndTime, getDayKey } from '../../utils.js';
import { handleEditEntry, handlePreviewEntry } from '../../crud-handlers.js';

// --- Constantes de Tiempo ---
const MONTH_NAMES = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

// --- Funciones de Ayuda de Tiempo ---
function getMonthName(monthIndex) {
    return MONTH_NAMES[monthIndex];
}

function getWeekNumber(d) {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    var weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return `Semana ${weekNo}`;
}

// --- Lógica de Interactividad ---

/**
 * Colapsa/expande un grupo (año, mes, semana)
 * @param {HTMLElement} headerEl - El elemento de cabecera que se ha clickeado.
 */
function toggleGroup(headerEl) {
    const groupSelector = headerEl.dataset.group; // ej: 'data-year-id'
    const groupID = headerEl.dataset.id;
    const chevron = headerEl.querySelector('.chevron');
    const isExpanding = !chevron.classList.contains('expanded');

    chevron.classList.toggle('expanded');
    
    const timelineContainer = headerEl.closest('.timeline');
    if (!timelineContainer) return;

    // Encuentra todos los elementos "hermanos" que vienen después
    let nextEl = headerEl.nextElementSibling;
    while(nextEl) {
        // Si encontramos una cabecera del mismo nivel o superior, paramos.
        if (nextEl.matches('.year-header') || 
           (groupSelector === 'data-month-id' && nextEl.matches('.month-header')) ||
           (groupSelector === 'data-week-id' && nextEl.matches('.week-header'))) {
            break;
        }

        if (isExpanding) {
            // Si expandimos, solo mostramos el siguiente nivel
            if (nextEl.matches(`[${groupSelector}="${groupID}"]`)) {
                nextEl.classList.remove('collapsed');
                // No expandir sub-niveles
                const childChevron = nextEl.querySelector('.chevron');
                if (childChevron) childChevron.classList.remove('expanded');
            }
        } else {
            // Si colapsamos, ocultamos TODOS los hijos
            if (nextEl.matches(`[data-year-id="${groupID}"]`)) {
                nextEl.classList.add('collapsed');
                const childChevrons = nextEl.querySelectorAll('.chevron');
                childChevrons.forEach(c => c.classList.remove('expanded'));
            }
        }
        nextEl = nextEl.nextElementSibling;
    }
}

/**
 * Initializes all event listeners for the timeline container.
 */
export function initTimeline() {
    document.getElementById('timeline-container').addEventListener('click', (e) => {
        
        // --- Lógica para colapsar/expandir ---
        
        const yearHeader = e.target.closest('.year-header');
        if (yearHeader) {
            toggleGroup(yearHeader);
            return;
        }
        
        const monthHeader = e.target.closest('.month-header');
        if (monthHeader) {
            toggleGroup(monthHeader);
            return;
        }

        const weekHeader = e.target.closest('.week-header');
        if (weekHeader) {
            toggleGroup(weekHeader);
            return;
        }

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
        // --- FIN DE LÓGICA DE COLAPSAR ---

        // Comprueba si el clic fue en un crumb O en un recap-block
        const entryEl = e.target.closest('.breadcrumb-entry, .recap-block');
        
        if (!entryEl) return; 

        const id = entryEl.dataset.id;
        
        if (e.target.closest('.btn-edit')) {
            e.stopPropagation();
            handleEditEntry(id);
            return;
        }
        
        if (e.target.closest('.btn-preview')) {
            e.stopPropagation();
            handlePreviewEntry(id);
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
    });
}


/**
 * Renders the entire timeline based on the global state.
 * CAMBIO: Reescrito para renderizar una lista plana con la lógica de "presente arriba".
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

    // 1. Preparar IDs de la semana/mes/año actual
    const today = new Date();
    const todayKey = getDayKey(today.toISOString());
    const currentYearStr = today.getFullYear().toString();
    const currentMonthStr = getMonthName(today.getMonth());
    const currentWeekStr = getWeekNumber(today);
    
    const currentYearID = currentYearStr;
    const currentMonthID = `${currentMonthStr}-${currentYearStr}`;
    const currentWeekID = `${currentWeekStr}-${currentYearStr}`;

    let html = `<div class="timeline"><div class="timeline-line"></div>`;

    // 2. Trackers
    let lastYear = null;
    let lastMonth = null;
    let lastWeek = null;
    let lastDay = null;
    
    // Agrupar entradas por día
    const groupedByDay = {};
    entries.forEach(entry => {
        const dayKey = getDayKey(entry.timestamp);
        if (!groupedByDay[dayKey]) groupedByDay[dayKey] = [];
        groupedByDay[dayKey].push(entry);
    });
    
    // 3. Loop sobre las CLAVES de día (ordenadas de más nuevas a más viejas)
    const sortedDayKeys = Object.keys(groupedByDay).sort((a, b) => b.localeCompare(a));

    for (const dayKey of sortedDayKeys) {
        const dayEntries = groupedByDay[dayKey];
        const firstEntry = dayEntries[0]; // Usar la primera entrada para la fecha
        const date = new Date(firstEntry.timestamp);
        
        const entryYear = date.getFullYear().toString();
        const entryMonth = getMonthName(date.getMonth());
        const entryWeek = getWeekNumber(date);
        
        const yearID = entryYear;
        const monthID = `${entryMonth}-${entryYear}`;
        const weekID = `${entryWeek}-${entryYear}`;
        
        const isCurrentWeek = (weekID === currentWeekID);
        
        // --- Imprimir Cabeceras ---

        if (entryYear !== lastYear) {
            lastYear = entryYear;
            lastMonth = null; 
            lastWeek = null;  
            
            const isCurrent = yearID === currentYearID;
            const expandedClass = isCurrent ? 'expanded' : '';
            
            html += `
                <div class="year-block">
                    <div class="year-header" data-id="${yearID}" data-group="data-year-id">
                        <span>${entryYear}</span>
                        <span class="chevron chevron-year ${expandedClass}">▲</span>
                    </div>
                </div>`;
        }

        if (entryMonth !== lastMonth) {
            lastMonth = entryMonth;
            lastWeek = null; 
            
            const isCurrent = monthID === currentMonthID;
            const expandedClass = isCurrent ? 'expanded' : '';
            const collapsedClass = !isCurrent ? 'collapsed' : ''; // Colapsar si no es el mes actual

            html += `
                <div class="month-block ${collapsedClass}" data-year-id="${yearID}">
                    <div class="month-header" data-id="${monthID}" data-group="data-month-id">
                        <span>${entryMonth}</span>
                        <span class="chevron chevron-month ${expandedClass}">▲</span>
                    </div>
                </div>`;
        }

        if (entryWeek !== lastWeek) {
            lastWeek = entryWeek;

            const isCurrent = weekID === currentWeekID;
            const expandedClass = isCurrent ? 'expanded' : '';
            const collapsedClass = !isCurrent ? 'collapsed' : ''; // Colapsar si no es la semana actual

            html += `
                <div class="week-block ${collapsedClass}" data-year-id="${yearID}" data-month-id="${monthID}">
                    <div class="week-header" data-id="${weekID}" data-group="data-week-id">
                        <span>${entryWeek}</span>
                        <span class="chevron chevron-week ${expandedClass}">▲</span>
                    </div>
                </div>`;
        }
        
        // --- Renderizar el Bloque del Día ---
        
        const isToday = dayKey === todayKey;
        const dayExpanded = isToday ? 'expanded' : ''; // Excepción: hoy expandido
        const dayCollapsed = !isCurrentWeek ? 'collapsed' : ''; 

        const recaps = dayEntries.filter(e => e.type === 'recap');
        const regularEntries = dayEntries.filter(e => e.type !== 'recap');
        
        // Render Recaps (si existen)
        if (!isToday) {
            html += recaps.map(recap => renderRecapBlock(recap, yearID, monthID, weekID, dayCollapsed)).join('');
        }
        
        html += `
        <div class="day-block ${dayCollapsed}" 
             data-day="${dayKey}" 
             data-year-id="${yearID}" 
             data-month-id="${monthID}" 
             data-week-id="${weekID}">
            
            <div class="day-header" data-id="${dayKey}">
                <span>${formatDate(firstEntry.timestamp)}</span>
                <span class="chevron ${dayExpanded}" id="chevron-${dayKey}">▼</span>
            </div>
        `;
        
        if (isToday) {
            html += recaps.map(recap => renderRecapBlock(recap, yearID, monthID, weekID, "")).join('');
        }

        // Render Day Content (Crumbs)
        html += `<div class="day-content ${dayExpanded}" id="day-content-${dayKey}">`;
                      
        html += regularEntries.map(entry => renderEntryCard(entry)).join('');

        html += `</div></div>`; // Cierra day-content y day-block
        
    } // Fin loop Días

    html += `</div>`; // Cierra .timeline
    container.innerHTML = html;
    
    // Renderiza los mini-mapas
    entries.forEach(entry => {
        if (entry.coords) {
            setTimeout(() => {
                const mapEl = document.getElementById(`mini-map-${entry.id}`);
                if (mapEl && !mapEl.classList.contains('leaflet-container')) {
                    try {
                        const miniMap = L.map(`mini-map-${entry.id}`, {
                            zoomControl: false, attributionControl: false, dragging: false,
                            scrollWheelZoom: false, doubleClickZoom: false, boxZoom: false, keyboard: false
                        }).setView([entry.coords.lat, entry.coords.lon], 13);
                        
                        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(miniMap);
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

/**
 * Función Ayudante para renderizar un Recap Block
 */
function renderRecapBlock(recap, yearID, monthID, weekID, collapsedClass) {
    return `
    <div class="recap-block ${collapsedClass}" data-id="${recap.id}" 
         data-year-id="${yearID}" 
         data-month-id="${monthID}" 
         data-week-id="${weekID}">
        
        <div class="recap-header">
            <span>🌟 Day Recap</span>
            <span class="chevron-recap">▼</span>
        </div>
        <div class="recap-content hidden" id="recap-content-${recap.id}">
            <button class="mac-button edit-button btn-edit">✏️ Edit</button>
            ${recap.rating ? `<div style="margin-bottom: 16px;"><strong>Rating:</strong> ${recap.rating}/10 ${'⭐'.repeat(Math.round(recap.rating / 2))}</div>` : ''}
            ${recap.reflection ? `<div style="margin-bottom: 16px;"><strong>Reflection:</strong><div style="margin-top: 8px; line-height: 1.6; white-space: pre-wrap;">${recap.reflection}</div></div>` : ''}
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
                        <div><div style="font-weight: bold; font-size: 13px;">${recap.track.name}</div><div style="font-size: 11px; color: #666;">${recap.track.artist}</div></div>
                        <a href="${recap.track.url}" target="_blank" style="text-decoration: none; font-size: 18px;">🔗</a>
                    </div>
                </div>
            ` : ''}
        </div>
    </div>
    `;
}

/**
 * Función Ayudante para renderizar una Tarjeta de Entrada (Crumb)
 */
function renderEntryCard(entry) {
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
            `<div><div class="breadcrumb-time">⏰ ${formatTime(entry.timestamp)} - ${calculateEndTime(entry.timestamp, entry.duration)}</div><div class="activity-label">${entry.activity}</div><div style="font-size: 13px; color: #666; margin-top: 8px;">Duration: ${entry.duration} minutes</div></div>
            ${entry.optionalNote ? `<div class="optional-note">${entry.optionalNote}</div>${needsReadMoreOptional ? `<button class="read-more-btn">Read more</button>` : ''}` : ''}` :
            `<div class="breadcrumb-time">${entry.isQuickTrack ? `<span class="compact-time">⏰ ${formatTime(entry.timestamp)} ${entry.note}</span>` : `⏰ ${formatTime(entry.timestamp)}`}
            ${entry.isSpent ? `<span class="spent-badge">💰 €${entry.spentAmount.toFixed(2)}</span>` : ''}</div>`
        }
        ${entry.isQuickTrack && entry.optionalNote ? `<div class="optional-note">${entry.optionalNote}</div>${needsReadMoreOptional ? `<button class="read-more-btn">Read more</button>` : ''}` : ''}
        ${!entry.isTimedActivity && !entry.isQuickTrack && !entry.isSpent && entry.type !== 'recap' ? `
            <div style="display: flex; align-items: flex-start; gap: 12px; margin-bottom: 8px;">
                ${entry.mood ? `<span class="mood-display">${entry.mood.emoji}</span>` : ''}
                <div style="flex: 1;"><div class="breadcrumb-note">${entry.note}</div>
                ${needsReadMore ? `<button class="read-more-btn">Read more</button>` : ''}</div>
            </div>
        ` : ''}
        ${(entry.weather || entry.location) ? `<div class="breadcrumb-meta">${entry.weather ? `<span>${entry.weather}</span>` : ''}${entry.weather && entry.location ? ` • ` : ''}${entry.location ? `<span>📍 ${entry.location}</span>` : ''}</div>` : ''}
        ${entry.audio ? `<div style="margin-top: 12px; margin-bottom: 12px;"><audio controls style="width: 100%; max-width: 300px;"><source src="${entry.audio}"></audio></div>` : ''}
        <div class="breadcrumb-preview">
            ${entry.images && entry.images.length > 0 ? entry.images.map((img, idx) => `<img src="${img}" class="preview-image-thumb" alt="Thumbnail ${idx+1}" data-index="${idx}">`).join('') : ''}
            ${entry.coords ? `<div class="preview-map-thumb" id="mini-map-${entry.id}"></div>` : ''}
            <button class="mac-button preview-button btn-preview">🔍 Preview</button>
        </div>
    </div>
    `;
}
