//
//  TimeFormView.swift
//  BreadcrumbsTimeline
//
//  Time Event form (activity + duration)
//

import SwiftUI

struct TimeFormView: View {
    @EnvironmentObject var appState: AppState
    @Environment(\.dismiss) var dismiss

    @State private var timestamp = Date()
    @State private var selectedDuration: Int?
    @State private var selectedActivity: String?
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

                    // Duration
                    macField(label: "Duration:") {
                        LazyVGrid(columns: [GridItem(.adaptive(minimum: 70))], spacing: 8) {
                            ForEach(appState.settings.timeDurations, id: \.self) { duration in
                                Button(action: {
                                    selectedDuration = duration
                                }) {
                                    Text("\(duration) min")
                                        .font(.custom("Courier", size: 12))
                                        .foregroundColor(selectedDuration == duration ? .white : .black)
                                        .frame(maxWidth: .infinity)
                                        .padding(8)
                                        .background(selectedDuration == duration ? Color.blue : Color.white)
                                        .overlay(
                                            RoundedRectangle(cornerRadius: 0)
                                                .stroke(Color.black, lineWidth: selectedDuration == duration ? 3 : 2)
                                        )
                                }
                            }
                        }
                    }

                    // Activity
                    macField(label: "Activity:") {
                        LazyVGrid(columns: [GridItem(.adaptive(minimum: 100))], spacing: 8) {
                            ForEach(appState.settings.timeActivities, id: \.self) { activity in
                                Button(action: {
                                    selectedActivity = activity
                                }) {
                                    Text(activity)
                                        .font(.custom("Courier", size: 12))
                                        .foregroundColor(selectedActivity == activity ? .white : .black)
                                        .frame(maxWidth: .infinity)
                                        .padding(8)
                                        .background(selectedActivity == activity ? Color.purple : Color.white)
                                        .overlay(
                                            RoundedRectangle(cornerRadius: 0)
                                                .stroke(Color.black, lineWidth: selectedActivity == activity ? 3 : 2)
                                        )
                                }
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
            .navigationTitle(appState.editingEntryId == nil ? "New Time Event" : "Edit Time Event")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        appState.clearTimerState()
                        dismiss()
                    }
                }
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Save") {
                        saveEntry()
                    }
                    .disabled(selectedDuration == nil || selectedActivity == nil)
                }
            }
        }
        .onAppear {
            loadEditingEntry()
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
        selectedDuration = entry.duration
        selectedActivity = entry.activity
        optionalNote = entry.optionalNote ?? ""
    }

    private func saveEntry() {
        guard let duration = selectedDuration, let activity = selectedActivity else { return }

        let entry = Entry(
            id: appState.editingEntryId ?? Int64(Date().timeIntervalSince1970 * 1000),
            timestamp: timestamp,
            note: "\(activity) - \(duration) minutes",
            activity: activity,
            duration: duration,
            optionalNote: optionalNote.isEmpty ? nil : optionalNote,
            isTimedActivity: true,
            isQuickTrack: false,
            isSpent: false,
            isRecap: false,
            type: "time"
        )

        if appState.editingEntryId != nil {
            appState.updateEntry(entry)
        } else {
            appState.addEntry(entry)
        }

        appState.clearTimerState()
        dismiss()
    }

    private func deleteEntry() {
        guard let entryId = appState.editingEntryId else { return }
        appState.removeEntry(id: entryId)
        appState.clearTimerState()
        dismiss()
    }
}
