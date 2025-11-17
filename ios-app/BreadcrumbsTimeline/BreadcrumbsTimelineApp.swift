//
//  BreadcrumbsTimelineApp.swift
//  BreadcrumbsTimeline
//
//  Main app entry point
//

import SwiftUI

@main
struct BreadcrumbsTimelineApp: App {
    @StateObject private var appState = AppState.shared

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(appState)
                .onAppear {
                    // Initialize app on launch
                    appState.loadLocalData()
                    appState.loadLocalSettings()
                    appState.tryRestoreGoogleDriveSession()
                }
        }
    }
}
