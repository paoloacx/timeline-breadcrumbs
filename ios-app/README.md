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
- ☁️ **Google Drive Sync**: Backup and restore data
- 🗺️ **Maps**: GPS coordinates with map preview
- 🎤 **Audio**: Voice note recording
- 📸 **Images**: Multiple image attachments
- 📊 **Statistics**: Entry analytics
- 💾 **Export**: CSV and iCal export

## Tech Stack

- **SwiftUI**: Modern declarative UI
- **Combine**: Reactive state management
- **UserDefaults**: Local persistence
- **CoreLocation**: GPS tracking
- **AVFoundation**: Audio recording
- **MapKit**: Map display
- **Google Drive SDK**: Cloud sync
- **URLSession**: API calls (Weather, iTunes)

## Design

Replicates the **Mac Classic** aesthetic from the web version:
- Monospace font (Courier/Monaco)
- Black borders and retro UI
- Floating Action Button (FAB) menu
- Collapsible timeline grouped by days

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

## Next Steps

1. Implement full forms (Crumb, Time, Track, Spent, Recap)
2. Add Google Drive authentication and sync
3. Implement GPS and location services
4. Add audio recording
5. Add camera and photo picker
6. Implement Weather API
7. Implement iTunes API for BSO
8. Add statistics view
9. Add export functionality (CSV, iCal)
10. Polish UI to match web design exactly
