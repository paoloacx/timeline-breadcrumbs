import SwiftUI

struct SettingsView: View {
    @EnvironmentObject var appState: AppState
    @Environment(\.dismiss) var dismiss

    // Local copies for editing
    @State private var timeDurations: [Int] = []
    @State private var timeActivities: [String] = []
    @State private var trackMeals: [String] = []
    @State private var trackTasks: [String] = []
    @State private var moods: [Mood] = []

    // New item inputs
    @State private var newDuration = ""
    @State private var newActivity = ""
    @State private var newMeal = ""
    @State private var newTask = ""
    @State private var newMoodVisual = ""
    @State private var newMoodLabel = ""

    var body: some View {
        NavigationView {
            Form {
                // MARK: - Time Durations
                Section {
                    ForEach(timeDurations.indices, id: \.self) { index in
                        HStack {
                            TextField("Minutes", value: $timeDurations[index], format: .number)
                                .font(.custom("Courier", size: 14))
                                .keyboardType(.numberPad)

                            Spacer()

                            Button(action: {
                                timeDurations.remove(at: index)
                            }) {
                                Image(systemName: "xmark.circle.fill")
                                    .foregroundColor(.red)
                            }
                        }
                    }

                    HStack {
                        TextField("New duration (min)", text: $newDuration)
                            .font(.custom("Courier", size: 14))
                            .keyboardType(.numberPad)

                        Button(action: addDuration) {
                            Image(systemName: "plus.circle.fill")
                                .foregroundColor(.green)
                        }
                        .disabled(newDuration.isEmpty)
                    }
                } header: {
                    Text("Time Durations")
                        .font(.custom("Courier", size: 14)).bold()
                }

                // MARK: - Time Activities
                Section {
                    ForEach(timeActivities.indices, id: \.self) { index in
                        HStack {
                            TextField("Activity", text: $timeActivities[index])
                                .font(.custom("Courier", size: 14))

                            Spacer()

                            Button(action: {
                                timeActivities.remove(at: index)
                            }) {
                                Image(systemName: "xmark.circle.fill")
                                    .foregroundColor(.red)
                            }
                        }
                    }

                    HStack {
                        TextField("New activity", text: $newActivity)
                            .font(.custom("Courier", size: 14))

                        Button(action: addActivity) {
                            Image(systemName: "plus.circle.fill")
                                .foregroundColor(.green)
                        }
                        .disabled(newActivity.isEmpty)
                    }
                } header: {
                    Text("Time Activities")
                        .font(.custom("Courier", size: 14)).bold()
                }

                // MARK: - Track Items - Meals
                Section {
                    ForEach(trackMeals.indices, id: \.self) { index in
                        HStack {
                            TextField("Meal", text: $trackMeals[index])
                                .font(.custom("Courier", size: 14))

                            Spacer()

                            Button(action: {
                                trackMeals.remove(at: index)
                            }) {
                                Image(systemName: "xmark.circle.fill")
                                    .foregroundColor(.red)
                            }
                        }
                    }

                    HStack {
                        TextField("New meal", text: $newMeal)
                            .font(.custom("Courier", size: 14))

                        Button(action: addMeal) {
                            Image(systemName: "plus.circle.fill")
                                .foregroundColor(.green)
                        }
                        .disabled(newMeal.isEmpty)
                    }
                } header: {
                    Text("Track Items - Meals")
                        .font(.custom("Courier", size: 14)).bold()
                }

                // MARK: - Track Items - Tasks
                Section {
                    ForEach(trackTasks.indices, id: \.self) { index in
                        HStack {
                            TextField("Task", text: $trackTasks[index])
                                .font(.custom("Courier", size: 14))

                            Spacer()

                            Button(action: {
                                trackTasks.remove(at: index)
                            }) {
                                Image(systemName: "xmark.circle.fill")
                                    .foregroundColor(.red)
                            }
                        }
                    }

                    HStack {
                        TextField("New task", text: $newTask)
                            .font(.custom("Courier", size: 14))

                        Button(action: addTask) {
                            Image(systemName: "plus.circle.fill")
                                .foregroundColor(.green)
                        }
                        .disabled(newTask.isEmpty)
                    }
                } header: {
                    Text("Track Items - Tasks")
                        .font(.custom("Courier", size: 14)).bold()
                }

                // MARK: - Moods
                Section {
                    ForEach(moods.indices, id: \.self) { index in
                        HStack {
                            Image(systemName: moods[index].iconName)
                                .font(.system(size: 20))
                                .frame(width: 30)

                            VStack(alignment: .leading, spacing: 4) {
                                Text(moods[index].label)
                                    .font(.custom("Courier", size: 14))

                                Text(moods[index].visual)
                                    .font(.custom("Courier", size: 10))
                                    .foregroundColor(.gray)
                            }

                            Spacer()

                            Button(action: {
                                moods.remove(at: index)
                            }) {
                                Image(systemName: "xmark.circle.fill")
                                    .foregroundColor(.red)
                            }
                        }
                    }

                    VStack(spacing: 8) {
                        HStack {
                            TextField("Visual (e.g., happy)", text: $newMoodVisual)
                                .font(.custom("Courier", size: 14))
                                .autocapitalization(.none)

                            TextField("Label (e.g., Happy)", text: $newMoodLabel)
                                .font(.custom("Courier", size: 14))

                            Button(action: addMood) {
                                Image(systemName: "plus.circle.fill")
                                    .foregroundColor(.green)
                            }
                            .disabled(newMoodVisual.isEmpty || newMoodLabel.isEmpty)
                        }

                        Text("Available visuals: happy, sad, relax, anxious, tired, neutral, excited, angry, calm")
                            .font(.custom("Courier", size: 10))
                            .foregroundColor(.gray)
                    }
                } header: {
                    Text("Moods")
                        .font(.custom("Courier", size: 14)).bold()
                }

                // MARK: - Save Button
                Section {
                    Button(action: saveSettings) {
                        Text("Save Settings")
                            .font(.custom("Courier", size: 16)).bold()
                            .foregroundColor(.white)
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color.black)
                    }
                }
            }
            .navigationTitle("Settings")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                    .font(.custom("Courier", size: 16))
                    .foregroundColor(.black)
                }
            }
            .onAppear {
                loadCurrentSettings()
            }
        }
    }

    // MARK: - Helper Functions

    private func loadCurrentSettings() {
        timeDurations = appState.settings.timeDurations
        timeActivities = appState.settings.timeActivities
        trackMeals = appState.settings.trackItems.meals
        trackTasks = appState.settings.trackItems.tasks
        moods = appState.settings.moods
    }

    private func addDuration() {
        guard let duration = Int(newDuration), duration > 0 else { return }
        timeDurations.append(duration)
        newDuration = ""
    }

    private func addActivity() {
        guard !newActivity.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else { return }
        timeActivities.append(newActivity.trimmingCharacters(in: .whitespacesAndNewlines))
        newActivity = ""
    }

    private func addMeal() {
        guard !newMeal.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else { return }
        trackMeals.append(newMeal.trimmingCharacters(in: .whitespacesAndNewlines))
        newMeal = ""
    }

    private func addTask() {
        guard !newTask.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else { return }
        trackTasks.append(newTask.trimmingCharacters(in: .whitespacesAndNewlines))
        newTask = ""
    }

    private func addMood() {
        let visual = newMoodVisual.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        let label = newMoodLabel.trimmingCharacters(in: .whitespacesAndNewlines)

        guard !visual.isEmpty && !label.isEmpty else { return }

        let newMood = Mood(visual: visual, label: label)
        moods.append(newMood)

        newMoodVisual = ""
        newMoodLabel = ""
    }

    private func saveSettings() {
        // Update AppState
        appState.settings.timeDurations = timeDurations
        appState.settings.timeActivities = timeActivities
        appState.settings.trackItems.meals = trackMeals
        appState.settings.trackItems.tasks = trackTasks
        appState.settings.moods = moods

        // Save to persistence
        appState.saveSettings()

        dismiss()
    }
}
