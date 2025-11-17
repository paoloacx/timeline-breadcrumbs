//
//  ToolsView.swift
//  BreadcrumbsTimeline
//

import SwiftUI

struct ToolsView: View {
    @Environment(\.dismiss) var dismiss

    var body: some View {
        NavigationView {
            Text("Tools - TODO")
                .navigationTitle("Tools & Account")
                .navigationBarTitleDisplayMode(.inline)
                .toolbar {
                    ToolbarItem(placement: .navigationBarTrailing) {
                        Button("Close") { dismiss() }
                    }
                }
        }
    }
}
