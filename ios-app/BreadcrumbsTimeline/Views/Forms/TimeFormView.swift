//
//  TimeFormView.swift
//  BreadcrumbsTimeline
//

import SwiftUI

struct TimeFormView: View {
    @Environment(\.dismiss) var dismiss

    var body: some View {
        NavigationView {
            Text("Time Form - TODO")
                .navigationTitle("Time Event")
                .navigationBarTitleDisplayMode(.inline)
                .toolbar {
                    ToolbarItem(placement: .navigationBarTrailing) {
                        Button("Close") { dismiss() }
                    }
                }
        }
    }
}
