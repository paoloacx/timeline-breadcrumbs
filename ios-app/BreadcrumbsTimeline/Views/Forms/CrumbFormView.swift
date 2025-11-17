//
//  CrumbFormView.swift
//  BreadcrumbsTimeline
//
//  Crumb form (TODO: Full implementation)
//

import SwiftUI

struct CrumbFormView: View {
    @EnvironmentObject var appState: AppState
    @Environment(\.dismiss) var dismiss

    var body: some View {
        NavigationView {
            Text("Crumb Form - TODO")
                .navigationTitle("New Breadcrumb")
                .navigationBarTitleDisplayMode(.inline)
                .toolbar {
                    ToolbarItem(placement: .navigationBarTrailing) {
                        Button("Close") {
                            dismiss()
                        }
                    }
                }
        }
    }
}
