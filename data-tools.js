// data-tools.js
// Módulo para gestionar las herramientas de datos (Exportar y Estadísticas).
// Extraído de app.js

// Export functions (Llamadas desde HTML, deben ser globales)
window.exportCSV = function() {
    window.openExportModal('csv');
}

window.exportICS = function() {
    window.openExportModal('ical');
}

// Hacemos global para ser llamada por exportCSV/ICS
window.openExportModal = function(format) {
    let modal = document.getElementById('export-modal');
    if (!modal) {
        createExportModalInternal(); // Crear si no existe (función interna)
        modal = document.getElementById('export-modal');
    }
    
    // Configurar el modal según el formato
    const formatSpan = document.getElementById('export-format-type');
    if (formatSpan) formatSpan.textContent = format === 'csv' ? 'CSV' : 'iCal';
    
    modal.classList.add('show');
    
    // Configurar opciones de iCal
    const icalOptions = document.getElementById('ical-options');
    if (icalOptions) {
        icalOptions.style.display = format === 'ical' ? 'block' : 'none';
    }
}

// Función interna para crear el modal
function createExportModalInternal() {
    const modalHTML = `
        <div id="export-modal" class="preview-modal" onclick="closeExportModal(event)">
            <div class="preview-content" onclick="event.stopPropagation()">
                <div class="mac-title-bar">
                    <span>📤 Export <span id="export-format-type">CSV</span></span>
                    <button onclick="closeExportModal()" style="background: #fff; border: 2px solid #000; padding: 2px 8px; cursor: pointer;">✕</button>
                </div>
                <div class="mac-content">
                    <h3 style="margin-bottom: 16px;">Select Export Range</h3>
                    
                    <div style="margin-bottom: 20px;">
                        <label class="mac-label">
                            <input type="radio" name="export-range" value="all" checked onchange="updateExportOptions()"> 
                            Export All Entries
                        </label>
                    </div>
                    
                    <div style="margin-bottom: 20px;">
                        <label class="mac-label">
                            <input type="radio" name="export-range" value="month" onchange="updateExportOptions()"> 
                            Export Specific Month
                        </label>
                        <div id="month-selector" style="margin-left: 20px; margin-top: 8px; display: none;">
                            <input type="month" class="mac-input" id="export-month" style="max-width: 200px;">
                        </div>
                    </div>
                    
                    <div style="margin-bottom: 20px;">
                        <label class="mac-label">
                            <input type="radio" name="export-range" value="day" onchange="updateExportOptions()"> 
                            Export Specific Day
                        </label>
                        <div id="day-selector" style="margin-left: 20px; margin-top: 8px; display: none;">
                            <input type="date" class="mac-input" id="export-day" style="max-width: 200px;">
                        </div>
                    </div>
                    
                    <div id="ical-options" style="display: none;">
                        <hr style="margin: 20px 0; border: 1px solid #ddd;">
                        <h3 style="margin-bottom: 16px;">iCal Options</h3>
                        <div style="margin-bottom: 20px;">
                            <label class="mac-label">
                                <input type="radio" name="ical-grouping" value="individual" checked> 
                                Each event as separate calendar entry
                            </label>
                        </div>
                        <div style="margin-bottom: 20px;">
                            <label class="mac-label">
                                <input type="radio" name="ical-grouping" value="daily"> 
                                Group all events per day as one calendar entry
                            </label>
                        </div>
                    </div>
                    
                    <button class="mac-button mac-button-primary" onclick="performExport()" style="width: 100%; margin-top: 24px;">
                        📥 Export
                    </button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Establecer fechas por defecto
    const today = new Date();
    const monthInput = document.getElementById('export-month');
    const dayInput = document.getElementById('export-day');
    
    if (monthInput) monthInput.value = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    if (dayInput) dayInput.value = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
}

// Hacemos global para ser llamada por onchange
window.updateExportOptions = function() {
    const rangeInput = document.querySelector('input[name="export-range"]:checked');
    if (!rangeInput) return;
    const range = rangeInput.value;
    
    const monthSelector = document.getElementById('month-selector');
    const daySelector = document.getElementById('day-selector');
    
    if (monthSelector) monthSelector.style.display = range === 'month' ? 'block' : 'none';
    if (daySelector) daySelector.style.display = range === 'day' ? 'block' : 'none';
}

// Hacemos global para ser llamada por onclick
window.closeExportModal = function(event) {
    // Si se hace clic en el fondo (el modal en sí)
    if (event && event.target.id === 'export-modal') {
        const modal = document.getElementById('export-modal');
        if (modal) modal.classList.remove('show');
        return;
    }
    // Si se hace clic en el botón de cerrar (que no tiene ID específico)
    if (event && event.target.closest('.mac-title-bar button')) {
         const modal = document.getElementById('export-modal');
         if (modal) modal.classList.remove('show');
         return;
    }
    // Si se llama sin evento (desde performExport)
    if (!event) {
        const modal = document.getElementById('export-modal');
        if (modal) modal.classList.remove('show');
        return;
    }
    // Si no, no hacer nada (se hizo clic dentro del contenido)
}

// Hacemos global para ser llamada por onclick
window.performExport = function() {
    const formatSpan = document.getElementById('export-format-type');
    const rangeInput = document.querySelector('input[name="export-range"]:checked');
    const icalGroupingInput = document.querySelector('input[name="ical-grouping"]:checked');

    if (!formatSpan || !rangeInput || !icalGroupingInput) {
        console.error("Export modal elements not found.");
        return;
    }

    const format = formatSpan.textContent.toLowerCase();
    const range = rangeInput.value;
    const icalGrouping = icalGroupingInput.value;
    
    // Filtrar entradas según el rango seleccionado
    // Usar la variable global 'entries' de app.js
    let filteredEntries = [...window.entries];
    let filenameSuffix = 'all';
    
    if (range === 'month') {
        const monthInput = document.getElementById('export-month');
        if (!monthInput) return;
        const monthValue = monthInput.value;
        const [year, month] = monthValue.split('-');
        filteredEntries = window.entries.filter(e => {
            const date = new Date(e.timestamp);
            return date.getFullYear() === parseInt(year) && 
                   date.getMonth() + 1 === parseInt(month);
        });
        filenameSuffix = `${year}-${month}`;
    } else if (range === 'day') {
        const dayInput = document.getElementById('export-day');
        if (!dayInput) return;
        const dayValue = dayInput.value;
        filteredEntries = window.entries.filter(e => {
            const date = new Date(e.timestamp);
            const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
            return dateStr === dayValue;
        });
        filenameSuffix = dayValue;
    }
    
    if (filteredEntries.length === 0) {
        alert('No entries found for the selected period.');
        return;
    }
    
    // Realizar la exportación (funciones internas)
    if (format === 'csv') {
        exportCSVDataInternal(filteredEntries, filenameSuffix);
    } else {
        exportICSDataInternal(filteredEntries, filenameSuffix, icalGrouping);
    }
    
    window.closeExportModal(); // Cerrar el modal
}

// Función interna
function exportCSVDataInternal(data, suffix) {
    const headers = ['ID', 'Timestamp', 'Type', 'Note', 'Optional Note', 'Mood', 'Location', 'Weather', 'Activity', 'Duration (min)', 'Spent Amount', 'Images (count)', 'Audio (exists)', 'Coords (lat)', 'Coords (lon)', 'Recap Rating', 'Recap Highlights'];
    const rows = data.map(e => {
        let type = 'Crumb';
        if (e.isTimedActivity) type = 'Time';
        if (e.isQuickTrack) type = 'Track';
        if (e.isSpent) type = 'Spent';
        if (e.type === 'recap') type = 'Recap';
        
        return [
            e.id,
            e.timestamp,
            type,
            e.note || '',
            e.optionalNote || '',
            e.mood ? `${e.mood.emoji} ${e.mood.label}` : '',
            e.location || '',
            e.weather || '',
            e.activity || '',
            e.duration || '',
            e.spentAmount || '',
            e.images ? e.images.length : 0,
            e.audio ? 'Yes' : 'No',
            e.coords ? e.coords.lat : '',
            e.coords ? e.coords.lon : '',
            e.rating || '',
            e.highlights ? e.highlights.join('; ') : ''
        ];
    });
    
    const csv = [headers, ...rows].map(row => 
        row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `breadcrumbs-${suffix}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

// Función interna
function exportICSDataInternal(data, suffix, grouping) {
    let icsEvents = '';
    
    if (grouping === 'daily') {
        // Agrupar por día
        const groupedByDay = {};
        data.forEach(e => {
            const date = new Date(e.timestamp);
            const dayKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
            if (!groupedByDay[dayKey]) {
                groupedByDay[dayKey] = [];
            }
            groupedByDay[dayKey].push(e);
        });
        
        // Crear un evento por día
        icsEvents = Object.keys(groupedByDay).map(dayKey => {
            const dayEntries = groupedByDay[dayKey];
            const firstEntry = dayEntries[0];
            const date = new Date(firstEntry.timestamp);
            const dateStr = date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
            
            // Crear descripción con todos los eventos del día
            const description = dayEntries.map(e => {
                const time = new Date(e.timestamp).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
                let text = `${time}: ${e.note || e.activity || 'Event'}`;
                if (e.duration) text += ` (${e.duration} min)`;
                if (e.optionalNote) text += `\\n  - Note: ${e.optionalNote}`;
                if (e.type === 'recap') text = `${time}: 🌟 DAY RECAP (Rating: ${e.rating}/10)`;
                return text;
            }).join('\\n\\n');
            
            return `BEGIN:VEVENT
UID:${dayKey}@breadcrumbs
DTSTAMP:${dateStr}
DTSTART;VALUE=DATE:${dayKey.replace(/-/g, '')}
SUMMARY:Breadcrumbs - ${dayEntries.length} events
DESCRIPTION:${description.replace(/\n/g, '\\n')}
END:VEVENT`;
        }).join('\n');
    } else {
        // Evento individual por cada entrada
        icsEvents = data.map(e => {
            const date = new Date(e.timestamp);
            const dateStr = date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
            
            let endDate = new Date(date);
            if (e.duration) {
                endDate.setMinutes(endDate.getMinutes() + e.duration);
            } else if (e.type === 'recap') {
                 endDate.setMinutes(endDate.getMinutes() + 15); // 15 min para recap
            } else {
                endDate.setMinutes(endDate.getMinutes() + 30); // 30 min por defecto
            }
            const endDateStr = endDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
            
            let summary = 'Breadcrumb';
            if (e.isTimedActivity) summary = `⏱️ ${e.activity}`;
            else if (e.isQuickTrack) summary = `📊 ${e.note}`;
            else if (e.isSpent) summary = `💰 ${e.note} (€${e.spentAmount})`;
            else if (e.type === 'recap') summary = `🌟 Day Recap (Rating: ${e.rating}/10)`;
            else if (e.note) summary = `📝 ${e.note.substring(0, 50)}${e.note.length > 50 ? '...' : ''}`;
            
            let description = (e.note || '');
            if (e.optionalNote) description += `\\n\\nOptional Note: ${e.optionalNote}`;
            if (e.location) description += `\\n\\n📍 Location: ${e.location}`;
            if (e.weather) description += `\\n☁️ Weather: ${e.weather}`;
            if (e.type === 'recap') {
                description = `Reflection: ${e.reflection || 'N/A'}\\nHighlights:\\n${(e.highlights || []).map(h => `- ${h}`).join('\\n')}`;
            }

            return `BEGIN:VEVENT
UID:${e.id}@breadcrumbs
DTSTAMP:${dateStr}
DTSTART:${dateStr}
DTEND:${endDateStr}
SUMMARY:${summary.replace(/\n/g, ' ')}
DESCRIPTION:${description.replace(/\n/g, '\\n')}
LOCATION:${e.location || ''}
END:VEVENT`;
        }).join('\n');
    }

    const ics = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Breadcrumbs Timeline//ES
CALSCALE:GREGORIAN
METHOD:PUBLISH
${icsEvents}
END:VCALENDAR`;

    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `breadcrumbs-${suffix}.ics`;
    a.click();
    URL.revokeObjectURL(url);
}

// Stats functions (Llamadas desde HTML, deben ser globales)
window.openStats = function() {
    calculateStatsInternal(); // Usar función interna
    const modal = document.getElementById('stats-modal');
    if (modal) {
        modal.classList.add('show');
    }
}

// Función interna
function calculateStatsInternal() {
    // Usar la variable global 'entries' de app.js
    const totalEntries = window.entries.length;
    const breadcrumbs = window.entries.filter(e => !e.isTimedActivity && !e.isQuickTrack && !e.isSpent && e.type !== 'recap').length;
    const timeEvents = window.entries.filter(e => e.isTimedActivity).length;
    const trackEvents = window.entries.filter(e => e.isQuickTrack).length;
    const spentEvents = window.entries.filter(e => e.isSpent).length;
    const recapEvents = window.entries.filter(e => e.type === 'recap').length;
    
    const totalSpent = window.entries
        .filter(e => e.isSpent)
        .reduce((sum, e) => sum + (e.spentAmount || 0), 0);
    
    const totalMinutes = window.entries
        .filter(e => e.isTimedActivity)
        .reduce((sum, e) => sum + (e.duration || 0), 0);
    
    const totalHours = (totalMinutes / 60).toFixed(1);
    
    // Actividades más frecuentes
    const activityCount = {};
    window.entries.filter(e => e.isTimedActivity).forEach(e => {
        activityCount[e.activity] = (activityCount[e.activity] || 0) + 1;
    });
    const topActivity = Object.keys(activityCount).length > 0 
        ? Object.keys(activityCount).reduce((a, b) => activityCount[a] > activityCount[b] ? a : b)
        : 'None';
    
    // Tracks más frecuentes
    const trackCount = {};
    window.entries.filter(e => e.isQuickTrack).forEach(e => {
        trackCount[e.note] = (trackCount[e.note] || 0) + 1;
    });
    const topTrack = Object.keys(trackCount).length > 0
        ? Object.keys(trackCount).reduce((a, b) => trackCount[a] > trackCount[b] ? a : b)
        : 'None';
        
    const statsContent = document.getElementById('stats-content');
    if (!statsContent) return;

    const statsHTML = `
        <div class="stat-card">
            <div class="stat-number">${totalEntries}</div>
            <div class="stat-label">Total Entries</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${breadcrumbs}</div>
            <div class="stat-label">📝 Breadcrumbs</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${timeEvents}</div>
            <div class="stat-label">⏱️ Time Events</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${trackEvents}</div>
            <div class="stat-label">📊 Tracked Items</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${spentEvents}</div>
            <div class="stat-label">💰 Expenses</div>
        </div>
         <div class="stat-card">
            <div class="stat-number">${recapEvents}</div>
            <div class="stat-label">🌟 Recaps</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">€${totalSpent.toFixed(2)}</div>
            <div class="stat-label">Total Spent</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${totalHours}h</div>
            <div class="stat-label">Hours Tracked</div>
        </div>
        <div class="stat-card">
            <div class="stat-number" style="font-size: 18px;">${topActivity}</div>
            <div class="stat-label">Top Activity</div>
        </div>
        <div class="stat-card">
            <div class="stat-number" style="font-size: 16px;">${topTrack}</div>
            <div class="stat-label">Most Tracked</div>
        </div>
    `;
    
    statsContent.innerHTML = statsHTML;
}

// Hacemos global para ser llamada por onclick
window.closeStats = function(event) {
    // Si se hace clic en el fondo (el modal en sí)
    if (event && event.target.id === 'stats-modal') {
        const modal = document.getElementById('stats-modal');
        if (modal) modal.classList.remove('show');
        return;
    }
    // Si se hace clic en el botón de cerrar (que no tiene ID específico)
    if (event && event.target.closest('.mac-title-bar button')) {
         const modal = document.getElementById('stats-modal');
         if (modal) modal.classList.remove('show');
         return;
    }
    // Si no, no hacer nada (se hizo clic dentro del contenido)
}
