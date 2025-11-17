//
//  Mood.swift
//  BreadcrumbsTimeline
//
//  Model for mood data (replaces state.js moods)
//

import Foundation

struct Mood: Codable, Identifiable, Equatable {
    let id: UUID
    let visual: String  // "happy", "sad", "relax", "anxious", "tired"
    let label: String   // "Happy", "Sad", "Relax", "Anxious", "Tired"

    init(id: UUID = UUID(), visual: String, label: String) {
        self.id = id
        self.visual = visual
        self.label = label
    }

    // Default moods matching web app
    static let defaultMoods = [
        Mood(visual: "happy", label: "Happy"),
        Mood(visual: "sad", label: "Sad"),
        Mood(visual: "relax", label: "Relax"),
        Mood(visual: "anxious", label: "Anxious"),
        Mood(visual: "tired", label: "Tired")
    ]

    // Icon mapping (using SF Symbols)
    var iconName: String {
        switch visual {
        case "happy": return "face.smiling"
        case "sad": return "face.dashed"
        case "relax": return "figure.mind.and.body"
        case "anxious": return "exclamationmark.triangle"
        case "tired": return "moon.zzz"
        default: return "face.smiling"
        }
    }
}
