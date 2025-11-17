//
//  Settings.swift
//  BreadcrumbsTimeline
//
//  Settings model (replaces state.js settings)
//

import Foundation

struct Settings: Codable, Equatable {
    var timeDurations: [Int]
    var timeActivities: [String]
    var trackItems: TrackItems
    var moods: [Mood]

    init(
        timeDurations: [Int] = [15, 30, 60, 120, 180],
        timeActivities: [String] = ["Reading", "Sports", "Work", "Cleaning", "Errands"],
        trackItems: TrackItems = TrackItems(),
        moods: [Mood] = Mood.defaultMoods
    ) {
        self.timeDurations = timeDurations
        self.timeActivities = timeActivities
        self.trackItems = trackItems
        self.moods = moods
    }

    static let `default` = Settings()
}

struct TrackItems: Codable, Equatable {
    var meals: [String]
    var tasks: [String]

    init(
        meals: [String] = ["🍳 Breakfast", "🥗 Lunch", "🍽️ Dinner", "☕ Snack"],
        tasks: [String] = ["💊 Medicine", "💧 Water", "🚶 Walk", "📞 Call"]
    ) {
        self.meals = meals
        self.tasks = tasks
    }

    // Combined array for track selector
    var allItems: [String] {
        meals + tasks
    }
}
