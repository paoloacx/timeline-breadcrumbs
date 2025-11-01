// ===== DATA TOOLS FUNCTIONS (Stats & Export) =====

// --- Stats Functions ---

/**
 * Opens the statistics modal.
 */
window.openStats = function() {
    const modal = document.getElementById('stats-modal');
    const content = document.getElementById('stats-content');
    
    // 'window.entries' is a global from app.js
    const stats = window.calculateStats(window.entries);
    
    let html = `
        <div class="stat-item">
            <div class="stat-value">${stats.totalEntries}</div>
            <div class="stat-label">Total Entries</div>
        </div>
        <div class="stat-item">
            <div class="stat-value">${stats.totalCrumbs}</div>
            <div class="stat-label">Crumbs</div>
        </div>
        <div class="stat-item">
            <div class="stat-value">${stats.totalTime}</div>
            <div class="stat-label">Time Events</div>
        </div>
        <div class="stat-item">
            <div class="stat-value">${stats.totalTrack}</div>
            <div class="stat-label">Tracked Items</div>
        </div>
        <div class="stat-item">
            <div class="stat-value">€${stats.totalSpent.toFixed(2)}</div>
            <div class="stat-label">Total Spent</div>
        </div>
        <div class="stat-item">
            <div class="stat-value">${stats.totalRecaps}</div>
            <div class="stat-label">Day Recaps</div>
        </div>
    `;

    // Mood Stats
    if (stats.moodCounts.length > 0) {
        stats.moodCounts.forEach(mood => {
            html += `
                <div class="stat-item">
                    <div class="stat-value">${mood.emoji} ${mood.count}</div>
                    <div class="stat-label">${mood.label}</div>
                </div>
            `;
        });
    }

    // Activity Stats
     if (stats.activityCounts.length > 0) {
        html += `<div class="stat-item stat-header">Top Activities</div>`;
        stats.activityCounts.slice(0, 5).forEach(activity => { // Show top 5
            html += `
                <div class="stat-item">
                    <div class="stat-value">${activity.count}</div>
                    <div class="stat-label">${activity.activity}</div>
                </div>
            `;
        });
    }

    content.innerHTML = html;
    modal.classList.add('show');
}

/**
 * Calculates various statistics from the entries.
 * @param {Array} entries - The global entries array.
 * @returns {object} An object containing calculated stats.
 */
window.calculateStats = function(entries) {
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
            if (entry.activity) {
                const count = (activityMap.get(entry.activity) || 0) + 1;
                activityMap.set(entry.activity, count);
            }
        } else if (entry.isQuickTrack) {
            stats.totalTrack++;
        } else if (entry.isSpent) {
            stats.totalSpent += entry.spentAmount || 0;
        } else if (entry.type === 'recap') {
            stats.totalRecaps++;
        } else {
            // It's a standard crumb
            stats.totalCrumbs++;
            if (entry.mood) {
                const key = `${entry.mood.emoji}|${entry.mood.label}`;
                const count = (moodMap.get(key) || 0) + 1;
                moodMap.set(key, count);
            }
        }
    });

    // Convert maps to sorted arrays
    stats.moodCounts = Array.from(moodMap.entries())
        .map(([key, count]) => {
            const [emoji, label] = key.split('|');
            return { emoji, label, count };
        })
        .sort((a, b) => b.count - a.count);

    stats.activityCounts = Array.from(activityMap.entries())
        .map(([activity, count]) => ({ activity, count }))
        .sort((a, b) => b.count - a.count);

    return stats;
}

/**
 * Closes the statistics modal.
 */
window.closeStats = function(event) {
    // Check if the click is on the modal backdrop or the close button
    if (event && (event.target.id !== 'stats-modal' && !event.target.closest('.mac-title-bar button'))) {
        return;
    }
    const modal = document.getElementById('stats-modal');
    modal.classList.remove('show');
    document.getElementById('stats-content').innerHTML = '';
}

// --- Export Functions ---

window.exportCSV = function() {
    window.openExportModal('csv');
}

window.exportICS = function() {
    window.openExportModal('ics');
}

window.openExportModal = function(format) {
    // 'window.entries' is a global from app.js
    if (window.entries.length === 0) {
        alert("No entries to export.");
        return;
    }

    // Create modal if it doesn't exist
    if (!document.getElementById('export-modal')) {
        window.createExportModal();
    }

    window.updateExportOptions(format);
    document.getElementById('export-modal').classList.add('show');
}

window.createExportModal = function() {
    const modalHTML = `
        <div id="export-modal" class="preview-modal" onclick="closeExportModal(event)">
            <div class="preview-content" onclick="event.stopPropagation()">
                <div class="mac-title-bar">
                    <span>Export Data</span>
                    <button onclick="closeExportModal()" style="background: #fff; border: 2px solid #000; padding: 2px 8px; cursor: pointer;">✕</button>
                </div>
                <div class="mac-content">
                    <h3 id="export-title" style="margin-bottom: 16px;">Export as CSV</h3>
                    
                    <label class="mac-label">Date Range:</label>
                    <select id="export-range" class="mac-input">
                        <option value="all">All Time</option>
                        <option value="today">Today</option>
                        <option value="7days">Last 7 Days</option>
                        <option value="30days">Last 30 Days</option>
                        <option value="current_month">This Month</option>
                    </select>

                    <label class="mac-label" style="margin-top: 16px;">Entry Types:</label>
                    <div id="export-types" class="export-types-grid">
                        </div>

                    <button class="mac-button mac-button-primary" onclick="performExport()" style="width: 100%; margin-top: 24px;">💾 Export</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

window.updateExportOptions = function(format) {
    document.getElementById('export-title').textContent = `Export as ${format.toUpperCase()}`;
    document.getElementById('export-modal').dataset.format = format;

    // 'window.entries' is a global from app.js
    const entryTypes = new Set(window.entries.map(e => {
        if (e.isTimedActivity) return 'Time Event';
        if (e.isQuickTrack) return 'Tracked Item';
        if (e.isSpent) return 'Spent';
        if (e.type === 'recap') return 'Day Recap';
        return 'Crumb';
    }));

    const typesContainer = document.getElementById('export-types');
    let typesHTML = '';
    entryTypes.forEach(type => {
        const typeId = type.toLowerCase().replace(' ', '-');
        typesHTML += `
            <div class="mac-checkbox-wrapper">
                <input type="checkbox" id="export-type-${typeId}" class="export-type-check" value="${type}" checked>
                <label for="export-type-${typeId}">${type}</label>
            </div>
        `;
    });
    typesContainer.innerHTML = typesHTML;
}

window.closeExportModal = function(event) {
    if (event && (event.target.id !== 'export-modal' && !event.target.closest('.mac-title-bar button'))) {
        return;
    }
    document.getElementById('export-modal').classList.remove('show');
}

window.performExport = function() {
    const format = document.getElementById('export-modal').dataset.format;
    const range = document.getElementById('export-range').value;
    const selectedTypes = Array.from(document.querySelectorAll('.export-type-check:checked')).map(cb => cb.value);

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let startDate = new Date(0); // The beginning of time

    if (range === 'today') {
        startDate = today;
    } else if (range === '7days') {
        startDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (range === '30days') {
        startDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else if (range === 'current_month') {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const filteredEntries = window.entries.filter(entry => {
        const entryDate = new Date(entry.timestamp);
        if (entryDate < startDate) return false;

        let type = 'Crumb';
        if (entry.isTimedActivity) type = 'Time Event';
        else if (entry.isQuickTrack) type = 'Tracked Item';
        else if (entry.isSpent) type = 'Spent';
        else if (entry.type === 'recap') type = 'Day Recap';

        return selectedTypes.includes(type);
    });

    if (filteredEntries.length === 0) {
        alert("No entries match your filter criteria.");
        return;
    }

    if (format === 'csv') {
        window.exportCSVData(filteredEntries);
    } else if (format === 'ics') {
        window.exportICSData(filteredEntries);
    }

    window.closeExportModal();
}

window.exportCSVData = function(entries) {
    let csvContent = "data:text/csv;charset=utf-sh,-8,";
    // Define headers
    const headers = [
        "id", "timestamp", "type", "note", "mood_emoji", "mood_label", 
        "location", "weather", "coords_lat", "coords_lon", 
        "activity", "duration", "optional_note", 
        "spent_amount", 
        "recap_reflection", "recap_rating", "recap_highlights"
    ];
    csvContent += headers.join(",") + "\r\n";

    // Add rows
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
            `"${(entry.highlights || []).join(', ').replace(/"/g, '""')}"`
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

window.exportICSData = function(entries) {
    let icsContent = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//paoloacx/timeline-breadcrumbs//NONSGML v1.0//EN"
    ];

    const toICSDate = (date) => {
        return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    entries.forEach(entry => {
        const startDate = new Date(entry.timestamp);
        let endDate = new Date(startDate.getTime() + 15 * 60 * 1000); // Default 15 min
        let summary = entry.note;

        if (entry.isTimedActivity && entry.duration) {
            endDate = new Date(startDate.getTime() + entry.duration * 60 * 1000);
            summary = `${entry.activity}: ${entry.note}`;
        } else if (entry.isQuickTrack) {
            summary = `Track: ${entry.note}`;
        } else if (entry.isSpent) {
            summary = `Spent: ${entry.note} (€${entry.spentAmount})`;
        } else if (entry.type === 'recap') {
            summary = `Day Recap: Rating ${entry.rating}/10`;
        }

        icsContent.push(
            "BEGIN:VEVENT",
            `UID:${entry.id}@paoloacx.github.io`,
            `DTSTAMP:${toICSDate(new Date())}`,
            `DTSTART:${toICSDate(startDate)}`,
            `DTEND:${toICSDate(endDate)}`,
            `SUMMARY:${summary}`,
            `DESCRIPTION:${(entry.note || entry.reflection || '').replace(/\n/g, '\\n')}`,
            `LOCATION:${entry.location || ""}`,
            "END:VEVENT"
        );
    });

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
