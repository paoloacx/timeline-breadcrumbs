//
//  MainAppView.swift
//  BreadcrumbsTimeline
//
//  Main app view with timeline and FAB menu
//

import SwiftUI

struct MainAppView: View {
    @EnvironmentObject var appState: AppState

    var body: some View {
        ZStack(alignment: .bottomTrailing) {
            VStack(spacing: 0) {
                // Header (Mac Window style)
                MacWindowHeader()

                // Timeline
                ScrollView {
                    TimelineView()
                        .padding(.horizontal, 16)
                        .padding(.bottom, 100) // Space for FAB
                }
            }

            // FAB Menu (Floating Action Button)
            FABMenuView()
                .padding(.trailing, 20)
                .padding(.bottom, 20)
        }
        .ignoresSafeArea(edges: .top)
    }
}

struct MacWindowHeader: View {
    @EnvironmentObject var appState: AppState

    var body: some View {
        HStack {
            HStack(spacing: 8) {
                Text("Breadcrumbs Timeline")
                    .font(.custom("Courier", size: 16))
                    .fontWeight(.bold)

                Button(action: {
                    appState.loadLocalData()
                    appState.loadLocalSettings()
                }) {
                    Image(systemName: "arrow.clockwise")
                        .font(.system(size: 14))
                }
                .macButtonStyle()
            }

            Spacer()

            // Tools button (robot icon from web)
            Button(action: {
                appState.showToolsModal = true
            }) {
                Image(systemName: "gearshape.fill")
                    .font(.system(size: 18))
            }
            .macButtonStyle()
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
        .background(Color(hex: "e0e0e0"))
        .overlay(
            Rectangle()
                .stroke(Color.black, lineWidth: 3)
        )
    }
}

// MARK: - Mac Button Style

struct MacButtonModifier: ViewModifier {
    func body(content: Content) -> some View {
        content
            .padding(.horizontal, 12)
            .padding(.vertical, 6)
            .background(Color.white)
            .overlay(
                RoundedRectangle(cornerRadius: 0)
                    .stroke(Color.black, lineWidth: 2)
            )
            .foregroundColor(.black)
    }
}

extension View {
    func macButtonStyle() -> some View {
        self.modifier(MacButtonModifier())
    }
}

struct MainAppView_Previews: PreviewProvider {
    static var previews: some View {
        MainAppView()
            .environmentObject(AppState.shared)
    }
}
