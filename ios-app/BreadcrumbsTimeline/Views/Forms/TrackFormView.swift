//
//  TrackFormView.swift
//  BreadcrumbsTimeline
//
//  Quick Track form (meals and tasks)
//

import SwiftUI

struct TrackFormView: View {
    @EnvironmentObject var appState: AppState
    @Environment(\.dismiss) var dismiss

    @State private var timestamp = Date()
    @State private var selectedTrackItem: String?
    @State private var optionalNote = ""

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 16) {
                    // Date & Time
                    macField(label: "📅 Date & Time") {
                        DatePicker("", selection: $timestamp, displayedComponents: [.date, .hourAndMinute])
                            .labelsHidden()
                            .font(.custom("Courier", size: 14))
                    }

                    // Track Items (Meals)
                    macField(label: "Meals:") {
                        LazyVGrid(columns: [GridItem(.adaptive(minimum: 80))], spacing: 8) {
                            ForEach(appState.settings.trackItems.meals, id: \.self) { item in
                                trackButton(item: item)
                            }
                        }
                    }

                    // Track Items (Tasks)
                    macField(label: "Tasks:") {
                        LazyVGrid(columns: [GridItem(.adaptive(minimum: 80))], spacing: 8) {
                            ForEach(appState.settings.trackItems.tasks, id: \.self) { item in
                                trackButton(item: item)
                            }
                        }
                    }

                    // Optional Note
                    macField(label: "Optional Note:") {
                        TextField("Add a short note (optional)", text: $optionalNote)
                            .font(.custom("Courier", size: 14))
                            .padding(8)
                            .background(Color.white)
                            .overlay(
                                RoundedRectangle(cornerRadius: 0)
                                    .stroke(Color.black, lineWidth: 2)
                            )
                    }

                    // Delete button (when editing)
                    if appState.editingEntryId != nil {
                        Button(action: deleteEntry) {
                            HStack {
                                Image(systemName: "trash.fill")
                                Text("Delete")
                                    .font(.custom("Courier", size: 14))
                                    .fontWeight(.bold)
                            }
                            .foregroundColor(.white)
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color.red)
                            .overlay(
                                RoundedRectangle(cornerRadius: 0)
                                    .stroke(Color.black, lineWidth: 3)
                            )
                        }
                    }
                }
                .padding(16)
            }
            .background(Color(hex: "f0f0f0"))
            .navigationTitle(appState.editingEntryId == nil ? "Quick Track" : "Edit Track")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        appState.clearTrackState()
                        dismiss()
                    }
                }
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Save") {
                        saveEntry()
                    }
                    .disabled(selectedTrackItem == nil)
                }
            }
        }
        .onAppear {
            loadEditingEntry()
        }
    }

    private func trackButton(item: String) -> some View {
        Button(action: {
            selectedTrackItem = item
        }) {
            Text(item)
                .font(.custom("Courier", size: 12))
                .foregroundColor(selectedTrackItem == item ? .white : .black)
                .frame(maxWidth: .infinity)
                .padding(8)
                .background(selectedTrackItem == item ? Color.green : Color.white)
                .overlay(
                    RoundedRectangle(cornerRadius: 0)
                        .stroke(Color.black, lineWidth: selectedTrackItem == item ? 3 : 2)
                )
        }
    }

    private func macField<Content: View>(label: String, @ViewBuilder content: () -> Content) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(label)
                .font(.custom("Courier", size: 14))
                .fontWeight(.bold)
            content()
        }
    }

    private func loadEditingEntry() {
        guard let entryId = appState.editingEntryId,
              let entry = appState.entries.first(where: { $0.id == entryId }) else {
            return
        }

        timestamp = entry.timestamp
        selectedTrackItem = entry.note  // The track item is stored as note
        optionalNote = entry.optionalNote ?? ""
    }

    private func saveEntry() {
        guard let trackItem = selectedTrackItem else { return }

        let entry = Entry(
            id: appState.editingEntryId ?? Int64(Date().timeIntervalSince1970 * 1000),
            timestamp: timestamp,
            note: trackItem,
            optionalNote: optionalNote.isEmpty ? nil : optionalNote,
            isTimedActivity: false,
            isQuickTrack: true,
            isSpent: false,
            isRecap: false,
            type: "track"
        )

        if appState.editingEntryId != nil {
            appState.updateEntry(entry)
        } else {
            appState.addEntry(entry)
        }

        appState.clearTrackState()
        dismiss()
    }

    private func deleteEntry() {
        guard let entryId = appState.editingEntryId else { return }
        appState.removeEntry(id: entryId)
        appState.clearTrackState()
        dismiss()
    }
}
