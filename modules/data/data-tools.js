// ===== modules/data/data-tools.js (Stats & Export Logic) =====

// Imports
import { getState } from '../../core/state.js';
import { openModal, closeModal } from '../ui/modal-manager.js';
import { getDayKey, formatTime } from '../../utils.js';
// P2: Import renderTimeline to show results
import { renderTimeline } from '../timeline/timeline.js'; 


// --- Stats Functions ---

/**
 * Opens the statistics modal.
 */
export function openStats() {
    const content = document.getElementById('stats-content');
    const { entries } = getState();
    const stats = calculateStats(entries); // Llama a la función local
    
    let html = `
        <div class="stat-item"><div class="stat-value">${stats.totalEntries}</div><div class="stat-label">Total Entries</div></div>
        <div class="stat-item"><div class="stat-value">${stats.totalCrumbs}</div><div class="stat-label">Crumbs</div></div>
        <div class="stat-item"><div class="stat-value">${stats.totalTime}</div><div class="stat-label">Time Events</div></div>
        <div class="stat-item"><div class="stat-value">${stats.totalTrack}</div><div class="stat-label">Tracked Items</div></div>
        <div class="stat-item"><div class="stat-value">€${stats.totalSpent.toFixed(2)}</div><div class="stat-label">Total Spent</div></div>
        <div class="stat-item"><div class="stat-value">${stats.totalRecaps}</div><div class="stat-label">Day Recaps</div></div>
    `;

    if (stats.moodCounts.length > 0) {
        stats.moodCounts.forEach(mood => {
            html += `<div class="stat-item"><div class="stat-value">${mood.emoji} ${mood.count}</div><div class="stat-label">${mood.label}</div></div>`;
        });
    }

     if (stats.activityCounts.length > 0) {
        html += `<div class="stat-item stat-header"><div class="stat-label">Top Activities</div></div>`;
        stats.activityCounts.slice(0, 5).forEach(activity => {
            html += `<div class="stat-item"><div class="stat-value">${activity.count}</div><div class="stat-label">${activity.activity}</div></div>`;
        });
    }

    content.innerHTML = html;
    openModal('stats-modal');
}

/**
 * (Local) Calculates various statistics from the entries.
 */
function calculateStats(entries) {
    const stats = {
        totalEntries: entries.length,
        totalCrumbs: 0,
        totalTime: 0,
        totalTrack: 0,
        totalSpent: 0,
        totalRecaps: 0,
        moodCounts: [],
        activityCounts: []
    };
    const moodMap = new Map();
    const activityMap = new Map();

    entries.forEach(entry => {
        if (entry.isTimedActivity) {
            stats.totalTime++;
            if (entry.activity) activityMap.set(entry.activity, (activityMap.get(entry.activity) || 0) + 1);
        } else if (entry.isQuickTrack) {
            stats.totalTrack++;
        } else if (entry.isSpent) {
            stats.totalSpent += entry.spentAmount || 0;
        } else if (entry.type === 'recap') {
            stats.totalRecaps++;
        } else {
            stats.totalCrumbs++;
            if (entry.mood) {
                const key = `${entry.mood.emoji}|${entry.mood.label}`;
                moodMap.set(key, (moodMap.get(key) || 0) + 1);
            }
        }
    });

    stats.moodCounts = Array.from(moodMap.entries())
        .map(([key, count]) => { const [emoji, label] = key.split('|'); return { emoji, label, count }; })
        .sort((a, b) => b.count - a.count);

    stats.activityCounts = Array.from(activityMap.entries())
        .map(([activity, count]) => ({ activity, count }))
        .sort((a, b) => b.count - a.count);

    return stats;
}

// --- Export Functions ---

/**
 * Opens the export modal and configures it for CSV.
 */
export function exportCSV() {
    openExportModal('csv');
}

/**
 * Opens the export modal and configures it for iCal.
 */
export function exportICS() {
    openExportModal('ics');
}

/**
 * (Local) Opens and configures the (now static) export modal.
 * @param {string} format - 'csv' or 'ics'.
 */
export function openExportModal(format) {
    const { entries } = getState();
    if (entries.length === 0) {
        alert("No entries to export.");
        return;
    }

    // Actualiza el modal estático
    document.getElementById('export-title').textContent = `Export as ${format.toUpperCase()}`;
    document.getElementById('export-modal').dataset.format = format; // Guarda el formato

    const icsOptions = document.getElementById('ics-options');
    if (format === 'ics') {
        icsOptions.classList.remove('hidden');
    } else {
        icsOptions.classList.add('hidden');
    }

    // Popula los tipos de entrada
    const entryTypes = new Set(entries.map(e => {
        if (e.isTimedActivity) return 'Time Event';
        if (e.isQuickTrack) return 'Tracked Item';
        if (e.isSpent) return 'Spent';
        if (e.type === 'recap') return 'Day Recap';
        return 'Crumb';
    }));

    const typesContainer = document.getElementById('export-types');
    typesContainer.innerHTML = Array.from(entryTypes).map(type => {
        const typeId = type.toLowerCase().replace(' ', '-');
        return `
            <div class="mac-checkbox-wrapper">
                <input type="checkbox" id="export-type-${typeId}" class="export-type-check" value="${type}" checked>
                <label for="export-type-${typeId}">${type}</label>
            </div>
        `;
    }).join('');

    openModal('export-modal');
}

/**
 * Gathers filter data and triggers the correct export download function.
 */
export function performExport() {
    const format = document.getElementById('export-modal').dataset.format;
    const range = document.getElementById('export-range').value;
    const selectedTypes = Array.from(document.querySelectorAll('.export-type-check:checked')).map(cb => cb.value);
    const icsFormat = document.querySelector('input[name="ics-format"]:checked').value;

    const { entries } = getState();
    const filteredEntries = filterEntries(entries, range, selectedTypes);

    if (filteredEntries.length === 0) {
        alert("No entries match your filter criteria.");
        return;
    }

    if (format === 'csv') {
        exportCSVData(filteredEntries);
    } else if (format === 'ics') {
        exportICSData(filteredEntries, icsFormat);
    }

    closeModal('export-modal');
}

/**
 * (Local) Filters entries based on date range and type.
 */
function filterEntries(entries, range, selectedTypes) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let startDate = new Date(0);

    if (range === 'today') startDate = today;
    else if (range === '7days') startDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    else if (range === '30days') startDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    else if (range === 'current_month') startDate = new Date(now.getFullYear(), now.getMonth(), 1);

    return entries.filter(entry => {
        const entryDate = new Date(entry.timestamp);
        if (entryDate < startDate) return false;

        let type = 'Crumb';
        if (entry.isTimedActivity) type = 'Time Event';
        else if (entry.isQuickTrack) type = 'Tracked Item';
        else if (entry.isSpent) type = 'Spent';
        else if (entry.type === 'recap') type = 'Day Recap';

        return selectedTypes.includes(type);
    });
}

/**
 * (Local) Generates and downloads a CSV file.
 */
function exportCSVData(entries) {
    let csvContent = "data:text/csv;charset=utf-8,";
    const headers = [
        "id", "timestamp", "type", "note", "mood_emoji", "mood_label", 
        "location", "weather", "coords_lat", "coords_lon", 
        "activity", "duration", "optional_note", 
        "spent_amount", 
        "recap_reflection", "recap_rating", "recap_highlights", "recap_bso_track", "recap_bso_artist"
    ];
    csvContent += headers.join(",") + "\r\n";

    entries.forEach(entry => {
        let type = 'Crumb';
        if (entry.isTimedActivity) type = 'Time Event';
        else if (entry.isQuickTrack) type = 'Tracked Item';
        else if (entry.isSpent) type = 'Spent';
        else if (entry.type === 'recap') type = 'Day Recap';

        const row = [
            entry.id,
            entry.timestamp,
            type,
            `"${(entry.note || "").replace(/"/g, '""')}"`,
            entry.mood ? entry.mood.emoji : "",
            entry.mood ? entry.mood.label : "",
            `"${(entry.location || "").replace(/"/g, '""')}"`,
            `"${(entry.weather || "").replace(/"/g, '""')}"`,
            entry.coords ? entry.coords.lat : "",
            entry.coords ? entry.coords.lon : "",
            entry.activity || "",
            entry.duration || "",
            `"${(entry.optionalNote || "").replace(/"/g, '""')}"`,
            entry.spentAmount || "",
            `"${(entry.reflection || "").replace(/"/g, '""')}"`,
            entry.rating || "",
            `"${(entry.highlights || []).join('; ').replace(/"/g, '""')}"`,
            entry.track ? `"${(entry.track.name || "").replace(/"/g, '""')}"` : "",
            entry.track ? `"${(entry.track.artist || "").replace(/"/g, '""')}"` : ""
        ];
        csvContent += row.join(",") + "\r\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "breadcrumbs_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/**
 * (Local) Generates and downloads an iCal (.ics) file.
 */
function exportICSData(entries, icsFormat) {
    let icsContent = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//paoloacx/timeline-breadcrumbs//NONSGML v1.0//EN"
    ];

    const toICSDate = (date) => date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const toICSDateOnly = (date) => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}${m}${d}`;
    };

    if (icsFormat === 'single') {
        const groupedByDay = {};
        entries.forEach(entry => {
            const dayKey = getDayKey(entry.timestamp);
            if (!groupedByDay[dayKey]) groupedByDay[dayKey] = [];
            groupedByDay[dayKey].push(entry);
        });

        for (const dayKey in groupedByDay) {
            const dayEntries = groupedByDay[dayKey];
            const firstEntryDate = new Date(dayEntries[0].timestamp);
            let summary = `Breadcrumbs Recap (${dayEntries.length} entries)`;
            let description = dayEntries.map(entry => {
                let desc = `${formatTime(entry.timestamp)}: `;
                if (entry.isTimedActivity) desc += `(Time) ${entry.activity} - ${entry.duration}min`;
                else if (entry.isQuickTrack) desc += `(Track) ${entry.note}`;
                else if (entry.isSpent) desc += `(Spent) ${entry.note} - €${entry.spentAmount}`;
                else if (entry.type === 'recap') desc += `(Recap) Rating: ${entry.rating}/10`;
                else desc += entry.note;
                return desc.replace(/\n/g, ' ');
            }).join('\\n');

            icsContent.push(
                "BEGIN:VEVENT",
                `UID:${dayKey}@paoloacx.github.io`,
                `DTSTAMP:${toICSDate(new Date())}`,
                `DTSTART;VALUE=DATE:${toICSDateOnly(firstEntryDate)}`,
                `SUMMARY:${summary}`,
                `DESCRIPTION:${description}`,
                "END:VEVENT"
            );
        }
    } else {
        entries.forEach(entry => {
            const startDate = new Date(entry.timestamp);
            let endDate = new Date(startDate.getTime() + 15 * 60 * 1000); // Default 15 min
            let summary = entry.note;
            let description = (entry.note || entry.reflection || '').replace(/\n/g, '\\n');

            if (entry.isTimedActivity && entry.duration) {
                endDate = new Date(startDate.getTime() + entry.duration * 60 * 1000);
                summary = `${entry.activity}`;
                description = entry.optionalNote ? entry.optionalNote.replace(/\n/g, '\\n') : '';
            } else if (entry.isQuickTrack) {
                summary = `Track: ${entry.note}`;
                description = entry.optionalNote ? entry.optionalNote.replace(/\n/g, '\\n') : '';
            } else if (entry.isSpent) {
                summary = `Spent: ${entry.note} (€${entry.spentAmount})`;
            } else if (entry.type === 'recap') {
                summary = `Day Recap: Rating ${entry.rating}/10`;
                description = (entry.reflection || '').replace(/\n/g, '\\n');
                if (entry.highlights) {
                    description += `\\n\\nHighlights:\\n- ${entry.highlights.join('\\n- ')}`;
                }
            }

            icsContent.push(
                "BEGIN:VEVENT",
                `UID:${entry.id}@paoloacx.github.io`,
                `DTSTAMP:${toICSDate(new Date())}`,
                `DTSTART:${toICSDate(startDate)}`,
                `DTEND:${toICSDate(endDate)}`,
                `SUMMARY:${summary.replace(/\n/g, ' ')}`,
                `DESCRIPTION:${description}`,
                `LOCATION:${(entry.location || "").replace(/\n/g, ' ')}`,
                "END:VEVENT"
            );
        });
    }

    icsContent.push("END:VCALENDAR");

    const icsFile = new Blob([icsContent.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(icsFile);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "breadcrumbs.ics");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// --- NEW: Full Backup Functions ---

/**
 * Generates a filename for the backup.
 * @returns {string} e.g., "breadcrumbs_backup_2025-11-03.json"
 */
function getBackupFilename() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `breadcrumbs_backup_${year}-${month}-${day}.json`;
}

/**
 * NEW: Exports the entire app state (entries and settings) as a single JSON file.
 */
export function exportFullBackup() {
    console.log('Generating full backup...');
    const { entries, settings } = getState();
    
    const backupData = {
        version: '1.0.0',
        createdAt: new Date().toISOString(),
        settings: settings,
        entries: entries
    };

    const jsonString = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", getBackupFilename());
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    console.log('Full backup downloaded.');
}

/**
 * NEW: Imports app state from a JSON backup file.
 * @param {File} file - The JSON file to import
 * @returns {Promise<object>} The parsed backup data
 */
export function importFullBackup(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (event) => {
            try {
                const backupData = JSON.parse(event.target.result);
                
                if (!backupData.entries || !backupData.settings) {
                    reject(new Error('Invalid backup file format. Missing entries or settings.'));
                    return;
                }
                
                console.log('Backup file parsed successfully:', {
                    version: backupData.version,
                    createdAt: backupData.createdAt,
                    entriesCount: backupData.entries.length
                });
                
                resolve(backupData);
            } catch (error) {
                console.error('Error parsing backup file:', error);
                reject(new Error('Invalid JSON file. Could not parse backup.'));
            }
        };
        
        reader.onerror = () => {
            reject(new Error('Error reading file.'));
        };
        
        reader.readText(file);
    });
}

// --- P2/P4: Universal Search ---

/**
 * NEW: Initializes the universal search functionality.
 * NOTE: Call this from app.js or your main init script.
 */
export function initUniversalSearch() {
    const searchInput = document.getElementById('universal-search');
    const searchButton = document.getElementById('btn-universal-search');
    const yearSelect = document.getElementById('filter-year');
    const monthSelect = document.getElementById('filter-month');
    
    if (searchButton) {
        searchButton.addEventListener('click', performSearch);
    }
    // P2: Removed clearButton listener
    if (searchInput) {
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                performSearch();
            }
        });
    }

    // P4: Add listeners to selectors
    if (yearSelect) {
        yearSelect.addEventListener('change', performSearch);
    }
    if (monthSelect) {
        monthSelect.addEventListener('change', performSearch);
    }

    // Populate date filters when tools modal is opened
    const toolsButton = document.getElementById('btn-open-tools');
    if (toolsButton) {
        toolsButton.addEventListener('click', populateDateFilters);
    }
}

/**
 * P2: Populates the Year and Month filter dropdowns based on available entries.
 */
function populateDateFilters() {
    const { entries } = getState();
    const yearSelect = document.getElementById('filter-year');
    const monthSelect = document.getElementById('filter-month');
    
    const availableYears = new Set();
    const availableMonths = new Set();
    
    entries.forEach(entry => {
        const date = new Date(entry.timestamp);
        availableYears.add(date.getFullYear());
        availableMonths.add(date.getMonth()); // 0-11
    });

    // --- Populate Years ---
    const sortedYears = Array.from(availableYears).sort((a, b) => b - a);
    const currentYear = yearSelect.value;
    yearSelect.innerHTML = '<option value="">Year</option>'; // Reset
    sortedYears.forEach(year => {
        yearSelect.innerHTML += `<option value="${year}">${year}</option>`;
    });
    yearSelect.value = currentYear;

    // --- Populate Months ---
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const sortedMonths = Array.from(availableMonths).sort((a, b) => a - b);
    const currentMonth = monthSelect.value;
    monthSelect.innerHTML = '<option value="">Month</option>'; // Reset
    sortedMonths.forEach(monthIndex => {
        monthSelect.innerHTML += `<option value="${monthIndex}">${monthNames[monthIndex]}</option>`;
    });
    monthSelect.value = currentMonth;
}


/**
 * P2/P4: Performs the search/filter based on input.
 */
function performSearch() {
    const { entries } = getState();
    const query = document.getElementById('universal-search').value.toLowerCase().trim();
    const year = document.getElementById('filter-year').value;
    const month = document.getElementById('filter-month').value;

    // P4: Change logic. Only run if *any* value is present.
    if (!query && !year && !month) {
        // If all are empty, render the full timeline (reset filter)
        console.log('All search fields empty. Resetting timeline.');
        renderTimeline(null);
        closeModal('tools-modal'); // Close modal only if reset
        return;
    }
    
    console.log(`Searching for: query='${query}', year='${year}', month='${month}'`);
    
    const filteredEntries = entries.filter(entry => {
        const entryDate = new Date(entry.timestamp);
        
        // 1. Filter by Year
        if (year && entryDate.getFullYear() != year) {
            return false;
        }
        
        // 2. Filter by Month
        if (month && entryDate.getMonth() != month) {
            return false;
        }
        
        // 3. Filter by Text Query
        if (query) {
            let textMatch = false;
            if (entry.note) textMatch = entry.note.toLowerCase().includes(query);
            if (entry.activity) textMatch = textMatch || entry.activity.toLowerCase().includes(query);
            if (entry.location) textMatch = textMatch || entry.location.toLowerCase().includes(query);
            if (entry.reflection) textMatch = textMatch || entry.reflection.toLowerCase().includes(query);
            if (entry.highlights) textMatch = textMatch || entry.highlights.join(' ').toLowerCase().includes(query);
            if (entry.optionalNote) textMatch = textMatch || entry.optionalNote.toLowerCase().includes(query);
            
            if (!textMatch) {
                return false;
            }
        }
        
        // If it passed all filters, keep it
        return true;
    });
    
    console.log(`Found ${filteredEntries.length} entries.`);
    
    // Render the timeline with the filtered results
    renderTimeline(filteredEntries);
    
    // Close the modal to show the results
    closeModal('tools-modal');
}

/**
 * P2: Clears all search filters and re-renders the timeline.
 * (This function is no longer called by a button, but kept in case)
 */
function clearSearch() {
    console.log('Clearing search filters...');
    // Reset inputs
    document.getElementById('universal-search').value = '';
    document.getElementById('filter-year').value = '';
    document.getElementById('filter-month').value = '';
    
    // Re-render the full timeline (null uses all entries)
    renderTimeline(null);
    
    // Close the modal
    closeModal('tools-modal');
}
