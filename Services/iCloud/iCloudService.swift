//
//  iCloudService.swift
//  BreadcrumbsTimeline
//
//  iCloud Drive sync service (replaces Google Drive)
//  Uses CloudKit to sync data across devices
//

import Foundation
import CloudKit

class iCloudService {
    static let shared = iCloudService()

    // iCloud container
    private let container: CKContainer
    private let privateDatabase: CKDatabase

    // Backup file info
    private let backupRecordType = "BreadcrumbsBackup"
    private let backupRecordID = CKRecord.ID(recordName: "MainBackup")

    private init() {
        // Use default container or custom one
        container = CKContainer(identifier: "iCloud.com.breadcrumbs.timeline")
        privateDatabase = container.privateCloudDatabase
    }

    // MARK: - iCloud Availability

    func checkiCloudStatus(completion: @escaping (Bool, Error?) -> Void) {
        container.accountStatus { status, error in
            DispatchQueue.main.async {
                switch status {
                case .available:
                    completion(true, nil)
                case .noAccount:
                    completion(false, NSError(domain: "iCloud", code: 1, userInfo: [NSLocalizedDescriptionKey: "No iCloud account found. Please sign in to iCloud in Settings."]))
                case .restricted:
                    completion(false, NSError(domain: "iCloud", code: 2, userInfo: [NSLocalizedDescriptionKey: "iCloud is restricted on this device."]))
                case .couldNotDetermine:
                    completion(false, NSError(domain: "iCloud", code: 3, userInfo: [NSLocalizedDescriptionKey: "Could not determine iCloud status."]))
                case .temporarilyUnavailable:
                    completion(false, NSError(domain: "iCloud", code: 4, userInfo: [NSLocalizedDescriptionKey: "iCloud is temporarily unavailable."]))
                @unknown default:
                    completion(false, error)
                }
            }
        }
    }

    // MARK: - Backup to iCloud

    func backupToiCloud(entries: [Entry], settings: Settings, completion: @escaping (Bool, Error?) -> Void) {
        checkiCloudStatus { [weak self] available, error in
            guard available, let self = self else {
                completion(false, error ?? NSError(domain: "iCloud", code: 0, userInfo: [NSLocalizedDescriptionKey: "iCloud not available"]))
                return
            }

            // Create backup data
            let backupData: [String: Any] = [
                "version": "1.0.0",
                "createdAt": ISO8601DateFormatter().string(from: Date()),
                "entriesCount": entries.count
            ]

            // Encode entries and settings
            guard let entriesData = try? JSONEncoder().encode(entries),
                  let settingsData = try? JSONEncoder().encode(settings) else {
                completion(false, NSError(domain: "iCloud", code: 5, userInfo: [NSLocalizedDescriptionKey: "Failed to encode data"]))
                return
            }

            // Create or update record
            let record = CKRecord(recordType: self.backupRecordType, recordID: self.backupRecordID)
            record["metadata"] = backupData as CKRecordValue
            record["entries"] = String(data: entriesData, encoding: .utf8)
            record["settings"] = String(data: settingsData, encoding: .utf8)
            record["lastModified"] = Date()

            // Save to iCloud
            self.privateDatabase.save(record) { savedRecord, error in
                DispatchQueue.main.async {
                    if let error = error {
                        completion(false, error)
                    } else {
                        completion(true, nil)
                    }
                }
            }
        }
    }

    // MARK: - Restore from iCloud

    func restoreFromiCloud(completion: @escaping ([Entry]?, Settings?, Error?) -> Void) {
        checkiCloudStatus { [weak self] available, error in
            guard available, let self = self else {
                completion(nil, nil, error ?? NSError(domain: "iCloud", code: 0, userInfo: [NSLocalizedDescriptionKey: "iCloud not available"]))
                return
            }

            // Fetch backup record
            self.privateDatabase.fetch(withRecordID: self.backupRecordID) { record, error in
                DispatchQueue.main.async {
                    if let error = error {
                        // If record doesn't exist, it's not an error - just no backup yet
                        if (error as NSError).code == CKError.unknownItem.rawValue {
                            completion(nil, nil, nil)
                        } else {
                            completion(nil, nil, error)
                        }
                        return
                    }

                    guard let record = record,
                          let entriesString = record["entries"] as? String,
                          let settingsString = record["settings"] as? String,
                          let entriesData = entriesString.data(using: .utf8),
                          let settingsData = settingsString.data(using: .utf8) else {
                        completion(nil, nil, NSError(domain: "iCloud", code: 6, userInfo: [NSLocalizedDescriptionKey: "Failed to parse backup data"]))
                        return
                    }

                    // Decode data
                    do {
                        let entries = try JSONDecoder().decode([Entry].self, from: entriesData)
                        let settings = try JSONDecoder().decode(Settings.self, from: settingsData)
                        completion(entries, settings, nil)
                    } catch {
                        completion(nil, nil, error)
                    }
                }
            }
        }
    }

    // MARK: - Sync on Login (Auto-restore if needed)

    func syncOnLogin(currentEntries: [Entry], completion: @escaping (Bool, String?) -> Void) {
        restoreFromiCloud { [weak self] remoteEntries, remoteSettings, error in
            if let error = error {
                completion(false, error.localizedDescription)
                return
            }

            // No remote backup found - do initial backup
            guard let remoteEntries = remoteEntries, let remoteSettings = remoteSettings else {
                print("No remote backup found. Creating initial backup...")
                completion(true, "No backup found. Local data preserved.")
                return
            }

            // Remote backup exists
            if currentEntries.isEmpty && !remoteEntries.isEmpty {
                // Local is empty, remote has data - restore
                completion(true, "restore_needed")
            } else if !currentEntries.isEmpty && remoteEntries.isEmpty {
                // Local has data, remote is empty - backup
                completion(true, "backup_needed")
            } else {
                // Both have data - user should choose
                completion(true, "both_exist")
            }
        }
    }
}
