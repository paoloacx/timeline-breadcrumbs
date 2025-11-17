# Breadcrumbs Timeline - iOS Native App

Native iOS app that replicates the web version of Breadcrumbs Timeline.

## Project Structure

```
BreadcrumbsTimeline/
├── Models/                  # Data models
│   ├── Entry.swift         # Main entry model (crumb, time, track, spent, recap)
│   ├── Mood.swift          # Mood model
│   ├── Settings.swift      # Settings model
│   └── User.swift          # User model for auth
│
├── ViewModels/             # State management
│   └── AppState.swift      # Central app state (equivalent to state.js)
│
├── Views/                  # SwiftUI views
│   ├── ContentView.swift  # Main view controller
│   ├── MainAppView.swift  # Main app layout
│   ├── AuthView.swift     # Authentication screen
│   │
│   ├── Timeline/          # Timeline components
│   │   ├── TimelineView.swift
│   │   ├── DayBlock.swift
│   │   └── EntryCard.swift
│   │
│   ├── Forms/             # Entry forms
│   │   ├── CrumbFormView.swift
│   │   ├── TimeFormView.swift
│   │   ├── TrackFormView.swift
│   │   ├── SpentFormView.swift
│   │   └── RecapFormView.swift
│   │
│   ├── Modals/            # Modal views
│   │   ├── PreviewView.swift
│   │   ├── ToolsView.swift
│   │   ├── SettingsView.swift
│   │   └── StatsView.swift
│   │
│   └── Components/        # Reusable components
│       └── FABMenuView.swift
│
├── Services/              # External services
│   ├── GoogleDrive/      # Google Drive sync
│   ├── Location/         # GPS & Location
│   ├── Audio/            # Audio recording
│   ├── Weather/          # Weather API
│   └── Music/            # iTunes/Apple Music API
│
├── Utils/                 # Utilities
└── Resources/             # Assets, icons, etc.
```

## Features

- 📍 **Breadcrumbs**: Full entries with mood, notes, GPS, weather, images, audio
- ⏱️ **Time Events**: Activities with duration tracking
- 📊 **Quick Track**: Habit tracking (meals, tasks)
- 💰 **Spent**: Expense tracking
- 🌟 **Day Recap**: Daily reflection with rating, highlights, and BSO (iTunes)
- ☁️ **iCloud Sync**: Automatic backup and restore across devices
- 🗺️ **Apple Maps**: Native map display with GPS coordinates
- 🎤 **Audio**: Voice note recording with AVFoundation
- 📸 **Images**: Multiple image attachments with Photo Library
- 📊 **Statistics**: Entry analytics
- 💾 **Export**: CSV and iCal export

## Tech Stack (100% Native Apple)

- **SwiftUI**: Modern declarative UI
- **Combine**: Reactive state management
- **UserDefaults**: Local persistence
- **CoreLocation**: GPS tracking
- **AVFoundation**: Audio recording
- **MapKit**: Native Apple Maps integration
- **CloudKit + iCloud Drive**: Cloud sync with Apple ID
- **SF Symbols**: Native iOS icons (no custom assets needed)
- **URLSession**: API calls (OpenWeatherMap, iTunes)
- **PhotosUI**: Native photo picker

## Design

Replicates the **Mac Classic** aesthetic from the web version:
- Monospace font (Courier/Monaco)
- Black borders and retro UI
- SF Symbols for all icons (native iOS)
- Floating Action Button (FAB) menu with spring animation
- Collapsible timeline grouped by days
- Native Apple Maps instead of Leaflet
- iCloud sync instead of Google Drive

## Status

🚧 **In Progress** - Step 1 Complete:
- ✅ Project structure
- ✅ Data models
- ✅ State management
- ✅ Main views and timeline
- ✅ FAB menu
- ⏳ Forms (TODO)
- ⏳ Services (TODO)
- ⏳ Assets (TODO)

## Native Apple Technologies

✅ **iCloud Drive** instead of Google Drive:
- Uses CloudKit for seamless sync
- Automatic authentication with Apple ID
- No OAuth redirect needed
- Data syncs across all user's Apple devices

✅ **Apple Maps (MapKit)** instead of Leaflet:
- Native map rendering
- Better performance and battery life
- Familiar iOS map interface
- Offline map support

✅ **SF Symbols** instead of custom SVG icons:
- System-provided icons
- Automatic light/dark mode adaptation
- Perfect resolution at any size
- Mood icons: face.smiling, face.dashed, figure.mind.and.body, exclamationmark.triangle, moon.zzz

✅ **OpenWeatherMap API** for weather (same as web):
- Could use WeatherKit (Apple's weather service) in the future
- Requires Apple Developer Program membership

## Next Steps

1. Implement full forms (Crumb, Time, Track, Spent, Recap)
2. Add iCloud authentication and sync logic
3. Implement GPS with CoreLocation
4. Add audio recording with AVFoundation
5. Add camera and PhotosPicker
6. Complete Weather API integration
7. Complete iTunes API for BSO (Apple Music search)
8. Add statistics view
9. Add export functionality (CSV, iCal)
10. Polish UI to match web design exactly
