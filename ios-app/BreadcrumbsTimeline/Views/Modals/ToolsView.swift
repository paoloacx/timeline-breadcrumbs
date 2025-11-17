import SwiftUI
import UniformTypeIdentifiers

struct ToolsView: View {
    @EnvironmentObject var appState: AppState
    @Environment(\.dismiss) var dismiss

    // Search state
    @State private var searchText = ""
    @State private var selectedYear: Int? = nil
    @State private var selectedMonth: Int? = nil

    // Export state
    @State private var showingExportOptions = false
    @State private var exportFormat: ExportFormat = .csv

    // Import state
    @State private var showingImportPicker = false

    // iCloud state
    @State private var iCloudStatus = "Checking..."

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 24) {

                    // MARK: - Universal Search
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Search & Filter")
                            .font(.custom("Courier", size: 16, weight: .bold))

                        TextField("Search entries...", text: $searchText)
                            .font(.custom("Courier", size: 14))
                            .padding(12)
                            .overlay(
                                Rectangle()
                                    .stroke(Color.black, lineWidth: 2)
                            )

                        HStack(spacing: 12) {
                            Picker("Year", selection: $selectedYear) {
                                Text("All Years").tag(nil as Int?)
                                ForEach(availableYears, id: \.self) { year in
                                    Text(String(year)).tag(year as Int?)
                                }
                            }
                            .pickerStyle(.menu)
                            .font(.custom("Courier", size: 14))
                            .padding(8)
                            .overlay(
                                Rectangle()
                                    .stroke(Color.black, lineWidth: 2)
                            )

                            Picker("Month", selection: $selectedMonth) {
                                Text("All Months").tag(nil as Int?)
                                ForEach(1...12, id: \.self) { month in
                                    Text(monthName(month)).tag(month as Int?)
                                }
                            }
                            .pickerStyle(.menu)
                            .font(.custom("Courier", size: 14))
                            .padding(8)
                            .overlay(
                                Rectangle()
                                    .stroke(Color.black, lineWidth: 2)
                            )
                        }

                        Button(action: performSearch) {
                            Text("Search")
                                .font(.custom("Courier", size: 14, weight: .bold))
                                .foregroundColor(.white)
                                .frame(maxWidth: .infinity)
                                .padding()
                                .background(Color.black)
                        }

                        if searchText.isEmpty && selectedYear == nil && selectedMonth == nil {
                            // No filter applied
                        } else {
                            Button(action: clearSearch) {
                                Text("Clear Filters")
                                    .font(.custom("Courier", size: 14))
                                    .foregroundColor(.gray)
                                    .frame(maxWidth: .infinity)
                                    .padding()
                                    .overlay(
                                        Rectangle()
                                            .stroke(Color.gray, lineWidth: 2)
                                    )
                            }
                        }
                    }

                    Divider()
                        .background(Color.black)

                    // MARK: - Export Section
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Export Data")
                            .font(.custom("Courier", size: 16, weight: .bold))

                        Button(action: {
                            exportFormat = .csv
                            showingExportOptions = true
                        }) {
                            HStack {
                                Image(systemName: "doc.text")
                                Text("Export as CSV")
                                    .font(.custom("Courier", size: 14))
                                Spacer()
                            }
                            .foregroundColor(.black)
                            .padding()
                            .overlay(
                                Rectangle()
                                    .stroke(Color.black, lineWidth: 2)
                            )
                        }

                        Button(action: {
                            exportFormat = .ical
                            showingExportOptions = true
                        }) {
                            HStack {
                                Image(systemName: "calendar")
                                Text("Export as iCal")
                                    .font(.custom("Courier", size: 14))
                                Spacer()
                            }
                            .foregroundColor(.black)
                            .padding()
                            .overlay(
                                Rectangle()
                                    .stroke(Color.black, lineWidth: 2)
                            )
                        }
                    }

                    Divider()
                        .background(Color.black)

                    // MARK: - Backup Section
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Backup & Restore")
                            .font(.custom("Courier", size: 16, weight: .bold))

                        Button(action: exportFullBackup) {
                            HStack {
                                Image(systemName: "arrow.down.doc")
                                Text("Download Full Backup (JSON)")
                                    .font(.custom("Courier", size: 14))
                                Spacer()
                            }
                            .foregroundColor(.black)
                            .padding()
                            .overlay(
                                Rectangle()
                                    .stroke(Color.black, lineWidth: 2)
                            )
                        }

                        Button(action: {
                            showingImportPicker = true
                        }) {
                            HStack {
                                Image(systemName: "arrow.up.doc")
                                Text("Import Backup (JSON)")
                                    .font(.custom("Courier", size: 14))
                                Spacer()
                            }
                            .foregroundColor(.black)
                            .padding()
                            .overlay(
                                Rectangle()
                                    .stroke(Color.black, lineWidth: 2)
                            )
                        }
                    }

                    Divider()
                        .background(Color.black)

                    // MARK: - iCloud Section
                    VStack(alignment: .leading, spacing: 12) {
                        Text("iCloud Sync")
                            .font(.custom("Courier", size: 16, weight: .bold))

                        Text("Status: \(iCloudStatus)")
                            .font(.custom("Courier", size: 12))
                            .foregroundColor(.gray)

                        Button(action: syncToiCloud) {
                            HStack {
                                Image(systemName: "icloud.and.arrow.up")
                                Text("Backup to iCloud")
                                    .font(.custom("Courier", size: 14))
                                Spacer()
                            }
                            .foregroundColor(.black)
                            .padding()
                            .overlay(
                                Rectangle()
                                    .stroke(Color.black, lineWidth: 2)
                            )
                        }

                        Button(action: syncFromiCloud) {
                            HStack {
                                Image(systemName: "icloud.and.arrow.down")
                                Text("Restore from iCloud")
                                    .font(.custom("Courier", size: 14))
                                Spacer()
                            }
                            .foregroundColor(.black)
                            .padding()
                            .overlay(
                                Rectangle()
                                    .stroke(Color.black, lineWidth: 2)
                            )
                        }
                    }
                }
                .padding()
            }
            .navigationTitle("Tools & Account")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Close") {
                        dismiss()
                    }
                    .font(.custom("Courier", size: 16))
                    .foregroundColor(.black)
                }
            }
        }
        .sheet(isPresented: $showingExportOptions) {
            ExportOptionsView(format: exportFormat, entries: appState.entries)
        }
        .fileImporter(
            isPresented: $showingImportPicker,
            allowedContentTypes: [.json],
            allowsMultipleSelection: false
        ) { result in
            handleImport(result)
        }
        .onAppear {
            checkiCloudStatus()
        }
    }

    // MARK: - Computed Properties

    private var availableYears: [Int] {
        let years = Set(appState.entries.map {
            Calendar.current.component(.year, from: $0.timestamp)
        })
        return years.sorted(by: >)
    }

    // MARK: - Helper Functions

    private func monthName(_ month: Int) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "MMMM"
        let date = Calendar.current.date(from: DateComponents(month: month))!
        return formatter.string(from: date)
    }

    private func performSearch() {
        let filtered = appState.entries.filter { entry in
            // Text search
            if !searchText.isEmpty {
                let matchesText = entry.note.localizedCaseInsensitiveContains(searchText)
                    || (entry.location?.localizedCaseInsensitiveContains(searchText) ?? false)
                    || (entry.activity?.localizedCaseInsensitiveContains(searchText) ?? false)
                    || (entry.reflection?.localizedCaseInsensitiveContains(searchText) ?? false)

                if !matchesText {
                    return false
                }
            }

            // Year filter
            if let year = selectedYear {
                let entryYear = Calendar.current.component(.year, from: entry.timestamp)
                if entryYear != year {
                    return false
                }
            }

            // Month filter
            if let month = selectedMonth {
                let entryMonth = Calendar.current.component(.month, from: entry.timestamp)
                if entryMonth != month {
                    return false
                }
            }

            return true
        }

        appState.filteredEntries = filtered
        dismiss()
    }

    private func clearSearch() {
        searchText = ""
        selectedYear = nil
        selectedMonth = nil
        appState.filteredEntries = nil
    }

    private func exportFullBackup() {
        let backup = BackupData(
            version: "1.0.0",
            createdAt: Date(),
            settings: appState.settings,
            entries: appState.entries
        )

        guard let jsonData = try? JSONEncoder().encode(backup),
              let jsonString = String(data: jsonData, encoding: .utf8) else {
            print("Failed to encode backup")
            return
        }

        // Create filename with date
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        let filename = "breadcrumbs_backup_\(formatter.string(from: Date())).json"

        // Save to temporary file
        let tempURL = FileManager.default.temporaryDirectory.appendingPathComponent(filename)
        try? jsonString.write(to: tempURL, atomically: true, encoding: .utf8)

        // Share the file
        let activityVC = UIActivityViewController(activityItems: [tempURL], applicationActivities: nil)
        if let scene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
           let rootVC = scene.windows.first?.rootViewController {
            rootVC.present(activityVC, animated: true)
        }
    }

    private func handleImport(_ result: Result<[URL], Error>) {
        guard let url = try? result.get().first else {
            print("Failed to get file URL")
            return
        }

        guard url.startAccessingSecurityScopedResource() else {
            print("Failed to access security scoped resource")
            return
        }

        defer { url.stopAccessingSecurityScopedResource() }

        guard let jsonData = try? Data(contentsOf: url),
              let backup = try? JSONDecoder().decode(BackupData.self, from: jsonData) else {
            print("Failed to decode backup")
            return
        }

        // Merge entries (avoid duplicates)
        let existingIds = Set(appState.entries.map { $0.id })
        let newEntries = backup.entries.filter { !existingIds.contains($0.id) }

        appState.entries.append(contentsOf: newEntries)
        appState.settings = backup.settings
        appState.saveData()

        print("Imported \(newEntries.count) new entries")
    }

    private func checkiCloudStatus() {
        // TODO: Implement actual iCloud status check
        iCloudStatus = "Available"
    }

    private func syncToiCloud() {
        // TODO: Implement iCloud backup
        print("Syncing to iCloud...")
    }

    private func syncFromiCloud() {
        // TODO: Implement iCloud restore
        print("Restoring from iCloud...")
    }
}

// MARK: - Export Options View

struct ExportOptionsView: View {
    let format: ExportFormat
    let entries: [Entry]
    @Environment(\.dismiss) var dismiss

    @State private var dateRange: DateRange = .all
    @State private var selectedTypes: Set<EntryType> = [.crumb, .time, .track, .spent, .recap]
    @State private var icalFormat: ICalFormat = .single

    var body: some View {
        NavigationView {
            Form {
                Section("Date Range") {
                    Picker("Range", selection: $dateRange) {
                        Text("All Time").tag(DateRange.all)
                        Text("Today").tag(DateRange.today)
                        Text("Last 7 Days").tag(DateRange.week)
                        Text("Last 30 Days").tag(DateRange.month)
                        Text("Current Month").tag(DateRange.currentMonth)
                    }
                }

                Section("Entry Types") {
                    ForEach(EntryType.allCases, id: \.self) { type in
                        Toggle(type.rawValue, isOn: Binding(
                            get: { selectedTypes.contains(type) },
                            set: { isOn in
                                if isOn {
                                    selectedTypes.insert(type)
                                } else {
                                    selectedTypes.remove(type)
                                }
                            }
                        ))
                    }
                }

                if format == .ical {
                    Section("iCal Format") {
                        Picker("Format", selection: $icalFormat) {
                            Text("One event per entry").tag(ICalFormat.individual)
                            Text("One event per day").tag(ICalFormat.single)
                        }
                        .pickerStyle(.segmented)
                    }
                }

                Button("Export") {
                    performExport()
                    dismiss()
                }
                .font(.custom("Courier", size: 16, weight: .bold))
            }
            .navigationTitle("Export Options")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Cancel") { dismiss() }
                }
            }
        }
    }

    private func performExport() {
        let filtered = filterEntries()

        if format == .csv {
            exportCSV(filtered)
        } else {
            exportICal(filtered, format: icalFormat)
        }
    }

    private func filterEntries() -> [Entry] {
        entries.filter { entry in
            // Date filter
            if !dateRange.includes(entry.timestamp) {
                return false
            }

            // Type filter
            let type = EntryType.from(entry)
            if !selectedTypes.contains(type) {
                return false
            }

            return true
        }
    }

    private func exportCSV(_ entries: [Entry]) {
        var csv = "id,timestamp,type,note,mood,location,weather,activity,duration,amount\n"

        for entry in entries {
            let type = EntryType.from(entry).rawValue
            let mood = entry.mood?.label ?? ""
            let location = entry.location ?? ""
            let weather = entry.weather ?? ""
            let activity = entry.activity ?? ""
            let duration = entry.duration.map { String($0) } ?? ""
            let amount = entry.amount.map { String(format: "%.2f", $0) } ?? ""

            csv += "\(entry.id),\(entry.timestamp),\(type),\"\(entry.note)\",\(mood),\(location),\(weather),\(activity),\(duration),\(amount)\n"
        }

        shareFile(content: csv, filename: "breadcrumbs_export.csv")
    }

    private func exportICal(_ entries: [Entry], format: ICalFormat) {
        var ics = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Breadcrumbs Timeline//EN\n"

        // TODO: Implement iCal generation based on format

        ics += "END:VCALENDAR"

        shareFile(content: ics, filename: "breadcrumbs.ics")
    }

    private func shareFile(content: String, filename: String) {
        let tempURL = FileManager.default.temporaryDirectory.appendingPathComponent(filename)
        try? content.write(to: tempURL, atomically: true, encoding: .utf8)

        let activityVC = UIActivityViewController(activityItems: [tempURL], applicationActivities: nil)
        if let scene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
           let rootVC = scene.windows.first?.rootViewController {
            rootVC.present(activityVC, animated: true)
        }
    }
}

// MARK: - Supporting Types

enum ExportFormat {
    case csv
    case ical
}

enum DateRange {
    case all, today, week, month, currentMonth

    func includes(_ date: Date) -> Bool {
        let now = Date()
        let calendar = Calendar.current

        switch self {
        case .all:
            return true
        case .today:
            return calendar.isDateInToday(date)
        case .week:
            let weekAgo = calendar.date(byAdding: .day, value: -7, to: now)!
            return date >= weekAgo
        case .month:
            let monthAgo = calendar.date(byAdding: .day, value: -30, to: now)!
            return date >= monthAgo
        case .currentMonth:
            return calendar.component(.month, from: date) == calendar.component(.month, from: now)
                && calendar.component(.year, from: date) == calendar.component(.year, from: now)
        }
    }
}

enum EntryType: String, CaseIterable {
    case crumb = "Crumb"
    case time = "Time Event"
    case track = "Tracked Item"
    case spent = "Spent"
    case recap = "Day Recap"

    static func from(_ entry: Entry) -> EntryType {
        if entry.isTimedActivity { return .time }
        if entry.isQuickTrack { return .track }
        if entry.isSpent { return .spent }
        if entry.isRecap { return .recap }
        return .crumb
    }
}

enum ICalFormat {
    case individual
    case single
}

struct BackupData: Codable {
    let version: String
    let createdAt: Date
    let settings: Settings
    let entries: [Entry]
}
