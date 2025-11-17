import SwiftUI

struct StatsView: View {
    @EnvironmentObject var appState: AppState
    @Environment(\.dismiss) var dismiss

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 16) {
                    // Main Stats Grid
                    LazyVGrid(columns: [
                        GridItem(.flexible()),
                        GridItem(.flexible())
                    ], spacing: 12) {
                        StatCard(value: "\(stats.totalEntries)", label: "Total Entries")
                        StatCard(value: "\(stats.totalCrumbs)", label: "Crumbs")
                        StatCard(value: "\(stats.totalTime)", label: "Time Events")
                        StatCard(value: "\(stats.totalTrack)", label: "Tracked Items")
                        StatCard(value: "€\(String(format: "%.2f", stats.totalSpent))", label: "Total Spent")
                        StatCard(value: "\(stats.totalRecaps)", label: "Day Recaps")
                    }

                    // Mood Stats
                    if !stats.moodCounts.isEmpty {
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Mood Distribution")
                                .font(.custom("Courier", size: 16)).bold()
                                .padding(.horizontal)

                            LazyVGrid(columns: [
                                GridItem(.flexible()),
                                GridItem(.flexible())
                            ], spacing: 12) {
                                ForEach(stats.moodCounts, id: \.label) { mood in
                                    MoodStatCard(
                                        iconName: mood.iconName,
                                        label: mood.label,
                                        count: mood.count
                                    )
                                }
                            }
                        }
                    }

                    // Top Activities
                    if !stats.activityCounts.isEmpty {
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Top Activities")
                                .font(.custom("Courier", size: 16)).bold()
                                .padding(.horizontal)

                            ForEach(stats.activityCounts.prefix(5), id: \.activity) { activity in
                                ActivityStatRow(activity: activity.activity, count: activity.count)
                            }
                        }
                    }
                }
                .padding()
            }
            .navigationTitle("Statistics")
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
    }

    // MARK: - Computed Stats

    private var stats: Stats {
        calculateStats(from: appState.entries)
    }

    private func calculateStats(from entries: [Entry]) -> Stats {
        var stats = Stats()

        // Dictionaries for counting
        var moodMap: [String: (iconName: String, count: Int)] = [:]
        var activityMap: [String: Int] = [:]

        for entry in entries {
            stats.totalEntries += 1

            if entry.isTimedActivity {
                stats.totalTime += 1
                if let activity = entry.activity {
                    activityMap[activity, default: 0] += 1
                }
            } else if entry.isQuickTrack {
                stats.totalTrack += 1
            } else if entry.isSpent {
                stats.totalSpent += entry.amount ?? 0
            } else if entry.isRecap {
                stats.totalRecaps += 1
            } else {
                stats.totalCrumbs += 1
                if let mood = entry.mood {
                    let key = mood.label
                    moodMap[key, default: (iconName: mood.iconName, count: 0)].count += 1
                }
            }
        }

        // Convert mood map to array and sort by count
        stats.moodCounts = moodMap.map { (label, data) in
            MoodCount(iconName: data.iconName, label: label, count: data.count)
        }.sorted { $0.count > $1.count }

        // Convert activity map to array and sort by count
        stats.activityCounts = activityMap.map { (activity, count) in
            ActivityCount(activity: activity, count: count)
        }.sorted { $0.count > $1.count }

        return stats
    }
}

// MARK: - Stats Model

struct Stats {
    var totalEntries = 0
    var totalCrumbs = 0
    var totalTime = 0
    var totalTrack = 0
    var totalSpent: Double = 0
    var totalRecaps = 0
    var moodCounts: [MoodCount] = []
    var activityCounts: [ActivityCount] = []
}

struct MoodCount {
    let iconName: String
    let label: String
    let count: Int
}

struct ActivityCount {
    let activity: String
    let count: Int
}

// MARK: - Stat Cards

struct StatCard: View {
    let value: String
    let label: String

    var body: some View {
        VStack(spacing: 8) {
            Text(value)
                .font(.custom("Courier", size: 24)).bold()
                .foregroundColor(.black)

            Text(label)
                .font(.custom("Courier", size: 12))
                .foregroundColor(.gray)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding()
        .background(Color.white)
        .overlay(
            Rectangle()
                .stroke(Color.black, lineWidth: 3)
        )
    }
}

struct MoodStatCard: View {
    let iconName: String
    let label: String
    let count: Int

    var body: some View {
        HStack(spacing: 8) {
            Image(systemName: iconName)
                .font(.system(size: 24))
                .foregroundColor(.black)
                .frame(width: 30)

            VStack(alignment: .leading, spacing: 2) {
                Text(label)
                    .font(.custom("Courier", size: 12))
                    .foregroundColor(.black)

                Text("\(count)")
                    .font(.custom("Courier", size: 16)).bold()
                    .foregroundColor(.gray)
            }

            Spacer()
        }
        .padding(12)
        .background(Color.white)
        .overlay(
            Rectangle()
                .stroke(Color.black, lineWidth: 2)
        )
    }
}

struct ActivityStatRow: View {
    let activity: String
    let count: Int

    var body: some View {
        HStack {
            Text(activity)
                .font(.custom("Courier", size: 14))
                .foregroundColor(.black)

            Spacer()

            Text("\(count)")
                .font(.custom("Courier", size: 14)).bold()
                .foregroundColor(.gray)
        }
        .padding()
        .background(Color.white)
        .overlay(
            Rectangle()
                .stroke(Color.black, lineWidth: 2)
        )
    }
}
