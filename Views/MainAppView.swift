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
        HStack(alignment: .center, spacing: 0) {
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
        .frame(minHeight: 40, maxHeight: 40)
        .padding(.leading, 16)
        .padding(.trailing, 5)
        .padding(.vertical, 0) // padding: 0 vertical
        .background(
            // Fondo negro con patrón de puntos (2px x 2px)
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

// MARK: - Happy Mac SVG (EXACTO del HTML original)

struct HappyMacIcon: View {
    var body: some View {
        // viewBox="12 7 76 86" -> width=76, height=86, offset x=12, y=7
        Canvas { context, size in
            let scaleX = size.width / 76
            let scaleY = size.height / 86
            let offsetX: CGFloat = -12 * scaleX
            let offsetY: CGFloat = -7 * scaleY

            func scale(_ x: CGFloat, _ y: CGFloat) -> CGPoint {
                CGPoint(x: x * scaleX + offsetX, y: y * scaleY + offsetY)
            }

            // rect x="15" y="10" width="70" height="70" rx="5" fill="white" stroke="black"
            context.fill(
                Path(roundedRect: CGRect(
                    x: 15 * scaleX + offsetX,
                    y: 10 * scaleY + offsetY,
                    width: 70 * scaleX,
                    height: 70 * scaleY
                ), cornerRadius: 5),
                with: .color(.white)
            )
            context.stroke(
                Path(roundedRect: CGRect(
                    x: 15 * scaleX + offsetX,
                    y: 10 * scaleY + offsetY,
                    width: 70 * scaleX,
                    height: 70 * scaleY
                ), cornerRadius: 5),
                with: .color(.black),
                lineWidth: 1.5
            )

            // rect x="25" y="20" width="50" height="40" fill="white" stroke="black" (pantalla)
            let screenRect = CGRect(
                x: 25 * scaleX + offsetX,
                y: 20 * scaleY + offsetY,
                width: 50 * scaleX,
                height: 40 * scaleY
            )
            context.fill(Path(screenRect), with: .color(.white))
            context.stroke(Path(screenRect), with: .color(.black), lineWidth: 1.5)

            // circle cx="40" cy="35" r="1" fill="black" (ojo izquierdo)
            context.fill(
                Path(ellipseIn: CGRect(
                    x: (40 - 1) * scaleX + offsetX,
                    y: (35 - 1) * scaleY + offsetY,
                    width: 2 * scaleX,
                    height: 2 * scaleY
                )),
                with: .color(.black)
            )

            // circle cx="60" cy="35" r="1" fill="black" (ojo derecho)
            context.fill(
                Path(ellipseIn: CGRect(
                    x: (60 - 1) * scaleX + offsetX,
                    y: (35 - 1) * scaleY + offsetY,
                    width: 2 * scaleX,
                    height: 2 * scaleY
                )),
                with: .color(.black)
            )

            // path d="M40 48 Q50 53 60 48" (sonrisa)
            var smilePath = Path()
            smilePath.move(to: scale(40, 48))
            smilePath.addQuadCurve(
                to: scale(60, 48),
                control: scale(50, 53)
            )
            context.stroke(smilePath, with: .color(.black), lineWidth: 1)

            // rect x="20" y="80" width="60" height="10" fill="white" stroke="black" (base)
            let baseRect = CGRect(
                x: 20 * scaleX + offsetX,
                y: 80 * scaleY + offsetY,
                width: 60 * scaleX,
                height: 10 * scaleY
            )
            context.fill(Path(baseRect), with: .color(.white))
            context.stroke(Path(baseRect), with: .color(.black), lineWidth: 1.5)

            // rect x="28" y="75" width="5" height="2" fill="black"
            context.fill(
                Path(CGRect(
                    x: 28 * scaleX + offsetX,
                    y: 75 * scaleY + offsetY,
                    width: 5 * scaleX,
                    height: 2 * scaleY
                )),
                with: .color(.black)
            )

            // rect x="55" y="70" width="20" height="0.1" fill="black"
            context.fill(
                Path(CGRect(
                    x: 55 * scaleX + offsetX,
                    y: 70 * scaleY + offsetY,
                    width: 20 * scaleX,
                    height: 0.5 * scaleY
                )),
                with: .color(.black)
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
