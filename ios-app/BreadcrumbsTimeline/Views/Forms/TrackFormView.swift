//
//  TrackFormView.swift
//  BreadcrumbsTimeline
//

import SwiftUI

struct TrackFormView: View {
    @Environment(\.dismiss) var dismiss

    var body: some View {
        NavigationView {
            Text("Track Form - TODO")
                .navigationTitle("Quick Track")
                .navigationBarTitleDisplayMode(.inline)
                .toolbar {
                    ToolbarItem(placement: .navigationBarTrailing) {
                        Button("Close") { dismiss() }
                    }
                }
        }
    }
}
