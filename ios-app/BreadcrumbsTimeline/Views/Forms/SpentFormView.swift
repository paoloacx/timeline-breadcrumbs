//
//  SpentFormView.swift
//  BreadcrumbsTimeline
//

import SwiftUI

struct SpentFormView: View {
    @Environment(\.dismiss) var dismiss

    var body: some View {
        NavigationView {
            Text("Spent Form - TODO")
                .navigationTitle("Spent")
                .navigationBarTitleDisplayMode(.inline)
                .toolbar {
                    ToolbarItem(placement: .navigationBarTrailing) {
                        Button("Close") { dismiss() }
                    }
                }
        }
    }
}
