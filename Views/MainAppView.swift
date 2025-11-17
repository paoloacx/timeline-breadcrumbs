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

            // Tools button (Happy Mac logo)
            Button(action: {
                appState.showToolsModal = true
            }) {
                HappyMacIcon()
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

// MARK: - Mac Button Style

struct MacButtonModifier: ViewModifier {
    func body(content: Content) -> some View {
        content
            .padding(.horizontal, 12)
            .padding(.vertical, 6)
            .background(Color(hex: "ddd"))
            .overlay(
                Rectangle()
                    .stroke(Color.white, lineWidth: 3)
                    .padding(3)
                    .background(
                        Rectangle()
                            .stroke(Color.black, lineWidth: 3)
                    )
            )
            .foregroundColor(.black)
    }
}

extension View {
    func macButtonStyle() -> some View {
        self.modifier(MacButtonModifier())
    }
}

// MARK: - Happy Mac SVG

struct HappyMacIcon: View {
    var body: some View {
        Canvas { context, size in
            // Fondo blanco del Mac
            context.fill(
                Path(roundedRect: CGRect(x: 3, y: 3, width: size.width - 6, height: size.height * 0.75),
                     cornerRadius: 5),
                with: .color(.white)
            )
            context.stroke(
                Path(roundedRect: CGRect(x: 3, y: 3, width: size.width - 6, height: size.height * 0.75),
                     cornerRadius: 5),
                with: .color(.black),
                lineWidth: 2
            )

            // Pantalla
            let screenRect = CGRect(x: size.width * 0.2, y: size.height * 0.15,
                                   width: size.width * 0.6, height: size.height * 0.45)
            context.fill(Path(screenRect), with: .color(.white))
            context.stroke(Path(screenRect), with: .color(.black), lineWidth: 2)

            // Ojos
            let eyeY = size.height * 0.3
            context.fill(Path(ellipseIn: CGRect(x: size.width * 0.35, y: eyeY, width: 3, height: 3)),
                        with: .color(.black))
            context.fill(Path(ellipseIn: CGRect(x: size.width * 0.60, y: eyeY, width: 3, height: 3)),
                        with: .color(.black))

            // Sonrisa (curva)
            var smilePath = Path()
            smilePath.move(to: CGPoint(x: size.width * 0.35, y: size.height * 0.45))
            smilePath.addQuadCurve(
                to: CGPoint(x: size.width * 0.65, y: size.height * 0.45),
                control: CGPoint(x: size.width * 0.5, y: size.height * 0.52)
            )
            context.stroke(smilePath, with: .color(.black), lineWidth: 2)

            // Base
            context.fill(
                Path(CGRect(x: size.width * 0.25, y: size.height * 0.8,
                           width: size.width * 0.5, height: size.height * 0.15)),
                with: .color(.white)
            )
            context.stroke(
                Path(CGRect(x: size.width * 0.25, y: size.height * 0.8,
                           width: size.width * 0.5, height: size.height * 0.15)),
                with: .color(.black),
                lineWidth: 2
            )
        }
        .frame(width: 30, height: 30)
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
