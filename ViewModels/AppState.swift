//
//  AppState.swift
//  BreadcrumbsTimeline
//
//  Central state management (equivalent to core/state.js)
//

import SwiftUI
import Combine

class AppState: ObservableObject {
    static let shared = AppState()

    // MARK: - Published State

    // Auth State
    @Published var currentUser: User?
    @Published var isOfflineMode: Bool = false

    // Data State
    @Published var entries: [Entry] = []

    // Settings State
    @Published var settings: Settings = Settings.default

    // UI State
    @Published var editingEntryId: Int64?
    @Published var selectedMood: Int?  // Index in settings.moods array
    @Published var selectedDuration: Int?
    @Published var selectedActivity: String?
    @Published var selectedTrackItem: String?

    // Media State
    @Published var currentImages: [String] = []
    @Published var currentAudio: String?
    @Published var currentCoords: Coordinates?

    // Modal State
    @Published var showAuthPanel: Bool = true
    @Published var showCrumbModal: Bool = false
    @Published var showTimeModal: Bool = false
    @Published var showTrackModal: Bool = false
    @Published var showSpentModal: Bool = false
    @Published var showRecapModal: Bool = false
    @Published var showPreviewModal: Bool = false
    @Published var showSettingsModal: Bool = false
    @Published var showStatsModal: Bool = false
    @Published var showToolsModal: Bool = false
    @Published var showExportModal: Bool = false

    // Preview State
    @Published var previewEntry: Entry?
    @Published var previewImageIndex: Int = 0

    // FAB Menu State
    @Published var isFabMenuOpen: Bool = false

    // Filter State
    @Published var searchText: String = ""
    @Published var filterYear: String = ""
    @Published var filterMonth: String = ""
    @Published var filteredEntries: [Entry]? = nil

    private init() {
        // Private singleton init
        loadOfflineMode()
    }

    // MARK: - Auth Methods

    func setCurrentUser(_ user: User) {
        currentUser = user
        isOfflineMode = false
        UserDefaults.standard.set(false, forKey: "isOfflineMode")
    }

    func clearCurrentUser() {
        currentUser = nil
        UserDefaults.standard.removeObject(forKey: "isOfflineMode")
        UserDefaults.standard.removeObject(forKey: "gdrive_access_token")
        UserDefaults.standard.removeObject(forKey: "gdrive_token_expiry")
    }

    func setOfflineMode(_ offline: Bool) {
        isOfflineMode = offline
        UserDefaults.standard.set(offline, forKey: "isOfflineMode")
    }

    private func loadOfflineMode() {
        isOfflineMode = UserDefaults.standard.bool(forKey: "isOfflineMode")
    }

    // MARK: - Data Methods

    func addEntry(_ entry: Entry) {
        entries.insert(entry, at: 0)
        saveLocalData()
    }

    func updateEntry(_ entry: Entry) {
        if let index = entries.firstIndex(where: { $0.id == entry.id }) {
            entries[index] = entry
            saveLocalData()
        }
    }

    func removeEntry(id: Int64) {
        entries.removeAll { $0.id == id }
        saveLocalData()
    }

    // MARK: - Settings Methods

    func updateSettings(_ newSettings: Settings) {
        settings = newSettings
        saveLocalSettings()
    }

    // MARK: - UI State Methods

    func clearFormState() {
        editingEntryId = nil
        selectedMood = nil
        currentImages = []
        currentAudio = nil
        currentCoords = nil
    }

    func clearTimerState() {
        editingEntryId = nil
        selectedDuration = nil
        selectedActivity = nil
    }

    func clearTrackState() {
        editingEntryId = nil
        selectedTrackItem = nil
    }

    func clearSpentState() {
        editingEntryId = nil
    }

    func clearRecapState() {
        editingEntryId = nil
    }

    // MARK: - Persistence (LocalStorage equivalent)

    func saveData() {
        saveLocalData()
    }

    func saveSettings() {
        saveLocalSettings()
    }

    func saveLocalData() {
        if let encoded = try? JSONEncoder().encode(entries) {
            UserDefaults.standard.set(encoded, forKey: "timeline-entries")
        }
    }

    func loadLocalData() {
        if let data = UserDefaults.standard.data(forKey: "timeline-entries"),
           let decoded = try? JSONDecoder().decode([Entry].self, from: data) {
            entries = decoded
        }
    }

    func saveLocalSettings() {
        if let encoded = try? JSONEncoder().encode(settings) {
            UserDefaults.standard.set(encoded, forKey: "timeline-settings")
        }
    }

    func loadLocalSettings() {
        if let data = UserDefaults.standard.data(forKey: "timeline-settings"),
           let decoded = try? JSONDecoder().decode(Settings.self, from: data) {
            settings = decoded
        }
    }

    // MARK: - Google Drive Session Restore

    func tryRestoreGoogleDriveSession() {
        // This will be implemented in GoogleDriveService
        // For now, check if offline mode is persistent
        if !isOfflineMode {
            // Will attempt Google Drive restore in the service
            showAuthPanel = true
        } else {
            showAuthPanel = false
        }
    }

    // MARK: - Filtered Entries

    func filteredEntries() -> [Entry] {
        var result = entries

        // Search filter
        if !searchText.isEmpty {
            result = result.filter { entry in
                entry.note.localizedCaseInsensitiveContains(searchText) ||
                (entry.location?.localizedCaseInsensitiveContains(searchText) ?? false) ||
                (entry.optionalNote?.localizedCaseInsensitiveContains(searchText) ?? false)
            }
        }

        // Year filter
        if !filterYear.isEmpty, let year = Int(filterYear) {
            result = result.filter {
                Calendar.current.component(.year, from: $0.timestamp) == year
            }
        }

        // Month filter
        if !filterMonth.isEmpty, let month = Int(filterMonth) {
            result = result.filter {
                Calendar.current.component(.month, from: $0.timestamp) == month
            }
        }

        return result
    }
}
