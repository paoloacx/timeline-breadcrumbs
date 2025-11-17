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
            // Fondo a rayas (Mac Classic style)
            StripedBackground()
                .ignoresSafeArea()

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

            HStack(spacing: 8) {
                // Stats button
                Button(action: {
                    appState.showStatsModal = true
                }) {
                    Image(systemName: "chart.bar.fill")
                        .font(.system(size: 18))
                }
                .macButtonStyle()

                // Settings button
                Button(action: {
                    appState.showSettingsModal = true
                }) {
                    Image(systemName: "slider.horizontal.3")
                        .font(.system(size: 18))
                }
                .macButtonStyle()

                // Tools button (search, export, backup)
                Button(action: {
                    appState.showToolsModal = true
                }) {
                    Image(systemName: "wrench.and.screwdriver.fill")
                        .font(.system(size: 18))
                }
                .macButtonStyle()
            }
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

// MARK: - Striped Background (Mac Classic style)

struct StripedBackground: View {
    var body: some View {
        GeometryReader { geometry in
            Path { path in
                let stripeWidth: CGFloat = 4
                let stripeSpacing: CGFloat = 4
                let totalWidth = stripeWidth + stripeSpacing
                let numberOfStripes = Int(geometry.size.width / totalWidth) + 1

                for i in 0..<numberOfStripes {
                    let x = CGFloat(i) * totalWidth
                    path.move(to: CGPoint(x: x, y: 0))
                    path.addLine(to: CGPoint(x: x, y: geometry.size.height))
                }
            }
            .stroke(Color.black.opacity(0.05), lineWidth: 4)
            .background(Color(hex: "f5f5f5"))
        }
    }
}

struct MainAppView_Previews: PreviewProvider {
    static var previews: some View {
        MainAppView()
            .environmentObject(AppState.shared)
    }
}
