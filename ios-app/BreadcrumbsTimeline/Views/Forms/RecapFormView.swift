//
//  RecapFormView.swift
//  BreadcrumbsTimeline
//

import SwiftUI

struct RecapFormView: View {
    @Environment(\.dismiss) var dismiss

    var body: some View {
        NavigationView {
            Text("Recap Form - TODO")
                .navigationTitle("Day Recap")
                .navigationBarTitleDisplayMode(.inline)
                .toolbar {
                    ToolbarItem(placement: .navigationBarTrailing) {
                        Button("Close") { dismiss() }
                    }
                }
        }
    }
}
