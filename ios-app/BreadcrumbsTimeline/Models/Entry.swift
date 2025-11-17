//
//  Entry.swift
//  BreadcrumbsTimeline
//
//  Main Entry model (replaces entries in state.js)
//

import Foundation
import CoreLocation

struct Entry: Codable, Identifiable, Equatable {
    let id: Int64
    let timestamp: Date
    var note: String

    // Crumb-specific fields
    var location: String?
    var weather: String?
    var images: [String]?  // Base64 or URLs
    var audio: String?     // Base64 or URL
    var coords: Coordinates?
    var mood: Mood?

    // Time Event fields
    var activity: String?
    var duration: Int?     // minutes

    // Optional note for Time/Track/Spent
    var optionalNote: String?

    // Spent fields
    var spentDescription: String?
    var amount: Double?

    // Recap fields
    var reflection: String?
    var rating: Int?
    var highlights: [String]?  // Array of 3 highlights
    var bso: BSOTrack?

    // Type flags
    var isTimedActivity: Bool
    var isQuickTrack: Bool
    var isSpent: Bool
    var isRecap: Bool
    var type: String?  // "crumb", "time", "track", "spent", "recap"

    init(
        id: Int64 = Int64(Date().timeIntervalSince1970 * 1000),
        timestamp: Date = Date(),
        note: String,
        location: String? = nil,
        weather: String? = nil,
        images: [String]? = nil,
        audio: String? = nil,
        coords: Coordinates? = nil,
        mood: Mood? = nil,
        activity: String? = nil,
        duration: Int? = nil,
        optionalNote: String? = nil,
        spentDescription: String? = nil,
        amount: Double? = nil,
        reflection: String? = nil,
        rating: Int? = nil,
        highlights: [String]? = nil,
        bso: BSOTrack? = nil,
        isTimedActivity: Bool = false,
        isQuickTrack: Bool = false,
        isSpent: Bool = false,
        isRecap: Bool = false,
        type: String? = nil
    ) {
        self.id = id
        self.timestamp = timestamp
        self.note = note
        self.location = location
        self.weather = weather
        self.images = images
        self.audio = audio
        self.coords = coords
        self.mood = mood
        self.activity = activity
        self.duration = duration
        self.optionalNote = optionalNote
        self.spentDescription = spentDescription
        self.amount = amount
        self.reflection = reflection
        self.rating = rating
        self.highlights = highlights
        self.bso = bso
        self.isTimedActivity = isTimedActivity
        self.isQuickTrack = isQuickTrack
        self.isSpent = isSpent
        self.isRecap = isRecap
        self.type = type
    }

    // Computed property for entry type
    var entryType: EntryType {
        if isRecap { return .recap }
        if isSpent { return .spent }
        if isQuickTrack { return .track }
        if isTimedActivity { return .time }
        return .crumb
    }
}

enum EntryType: String {
    case crumb = "crumb"
    case time = "time"
    case track = "track"
    case spent = "spent"
    case recap = "recap"
}

// Coordinates struct
struct Coordinates: Codable, Equatable {
    let lat: Double
    let lon: Double

    var clCoordinate: CLLocationCoordinate2D {
        CLLocationCoordinate2D(latitude: lat, longitude: lon)
    }
}

// BSO Track struct (for recap)
struct BSOTrack: Codable, Equatable {
    let trackName: String
    let artistName: String
    let artworkUrl100: String?
    let previewUrl: String?
    let trackId: Int?
}
