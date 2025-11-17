//
//  PreviewView.swift
//  BreadcrumbsTimeline
//

import SwiftUI

struct PreviewView: View {
    @EnvironmentObject var appState: AppState
    @Environment(\.dismiss) var dismiss
    let entry: Entry

    var body: some View {
        NavigationView {
            ScrollView {
                Text("Preview - TODO")
                    .padding()
            }
            .navigationTitle("Preview")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Close") {
                        appState.previewEntry = nil
                        dismiss()
                    }
                }
            }
        }
    }
}
