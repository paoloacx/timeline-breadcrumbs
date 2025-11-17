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
            // Fondo a rayas HORIZONTALES (Mac Classic style)
            StripedBackground()
                .ignoresSafeArea()

            VStack(spacing: 0) {
                // Header (Mac Window style)
                MacWindowHeader()

                // Timeline
                ScrollView {
                    TimelineView()
                        .padding(.horizontal, 18)
                        .padding(.bottom, 100) // Space for FAB
                }
                .background(Color.clear)
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
        HStack(alignment: .center) {
            Text("Breadcrumbs Timeline")
                .font(.system(size: 20, weight: .bold, design: .monospaced))
                .foregroundColor(Color(hex: "ffd700")) // Amarillo

            Spacer()

            // Tools button (Happy Mac)
            Button(action: {
                appState.showToolsModal = true
            }) {
                Image(systemName: "wrench.and.screwdriver.fill")
                    .font(.system(size: 18))
                    .foregroundColor(Color(hex: "ffd700"))
            }
            .buttonStyle(PlainButtonStyle())
            .frame(width: 30, height: 30)
        }
        .frame(minHeight: 40)
        .padding(.leading, 16)
        .padding(.trailing, 5)
        .background(
            // Fondo negro con patrón de puntos
            ZStack {
                Color.black
                DottedPattern()
            }
        )
    }
}

// MARK: - Dotted Pattern (Title Bar)

struct DottedPattern: View {
    var body: some View {
        GeometryReader { geometry in
            Canvas { context, size in
                let dotSize: CGFloat = 2
                let spacing: CGFloat = 2

                for y in stride(from: 0, to: size.height, by: spacing) {
                    for x in stride(from: 0, to: size.width, by: spacing) {
                        let rect = CGRect(x: x, y: y, width: dotSize, height: dotSize)
                        context.fill(Path(rect), with: .color(Color(hex: "333333")))
                    }
                }
            }
        }
    }
}

// MARK: - Striped Background (HORIZONTAL lines - Mac Classic style)

struct StripedBackground: View {
    var body: some View {
        GeometryReader { geometry in
            Canvas { context, size in
                // Rayas horizontales alternando colores cada 2px
                for y in stride(from: 0, to: size.height, by: 2) {
                    let color = (Int(y) / 2) % 2 == 0 ? Color(hex: "c0c0c0") : Color(hex: "d0d0d0")
                    let rect = CGRect(x: 0, y: y, width: size.width, height: 1)
                    context.fill(Path(rect), with: .color(color))
                }
            }
        }
    }
}

struct MainAppView_Previews: PreviewProvider {
    static var previews: some View {
        MainAppView()
            .environmentObject(AppState.shared)
    }
}
