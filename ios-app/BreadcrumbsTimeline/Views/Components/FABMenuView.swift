//
//  FABMenuView.swift
//  BreadcrumbsTimeline
//
//  Floating Action Button menu (equivalent to FAB in web)
//

import SwiftUI

struct FABMenuView: View {
    @EnvironmentObject var appState: AppState
    @State private var isOpen = false

    var body: some View {
        VStack(alignment: .trailing, spacing: 12) {
            // Action buttons (shown when open)
            if isOpen {
                FABActionButton(
                    label: "Day Recap",
                    icon: "star.fill",
                    color: .pink
                ) {
                    appState.showRecapModal = true
                    isOpen = false
                }

                FABActionButton(
                    label: "Spent",
                    icon: "dollarsign.circle.fill",
                    color: .orange
                ) {
                    appState.showSpentModal = true
                    isOpen = false
                }

                FABActionButton(
                    label: "Quick Track",
                    icon: "chart.bar.fill",
                    color: .green
                ) {
                    appState.showTrackModal = true
                    isOpen = false
                }

                FABActionButton(
                    label: "Time Event",
                    icon: "clock.fill",
                    color: .purple
                ) {
                    appState.showTimeModal = true
                    isOpen = false
                }

                FABActionButton(
                    label: "Breadcrumb",
                    icon: "mappin.circle.fill",
                    color: .blue
                ) {
                    appState.showCrumbModal = true
                    isOpen = false
                }
            }

            // Main FAB button
            Button(action: {
                withAnimation(.spring(response: 0.3, dampingFraction: 0.7)) {
                    isOpen.toggle()
                }
            }) {
                Image(systemName: isOpen ? "xmark" : "plus")
                    .font(.system(size: 24, weight: .bold))
                    .foregroundColor(.white)
                    .frame(width: 60, height: 60)
                    .background(Color.black)
                    .clipShape(Circle())
                    .overlay(
                        Circle()
                            .stroke(Color.white, lineWidth: 2)
                    )
                    .shadow(color: Color.black.opacity(0.3), radius: 8, x: 0, y: 4)
                    .rotationEffect(.degrees(isOpen ? 135 : 0))
            }
        }
    }
}

struct FABActionButton: View {
    let label: String
    let icon: String
    let color: Color
    let action: () -> Void

    var body: some View {
        HStack(spacing: 12) {
            Text(label)
                .font(.custom("Courier", size: 12))
                .fontWeight(.bold)
                .foregroundColor(.black)
                .padding(.horizontal, 12)
                .padding(.vertical, 6)
                .background(Color.white)
                .overlay(
                    RoundedRectangle(cornerRadius: 0)
                        .stroke(Color.black, lineWidth: 2)
                )

            Button(action: action) {
                Image(systemName: icon)
                    .font(.system(size: 18))
                    .foregroundColor(.white)
                    .frame(width: 50, height: 50)
                    .background(color)
                    .clipShape(Circle())
                    .overlay(
                        Circle()
                            .stroke(Color.white, lineWidth: 2)
                    )
                    .shadow(color: Color.black.opacity(0.2), radius: 4, x: 0, y: 2)
            }
        }
        .transition(.move(edge: .trailing).combined(with: .opacity))
    }
}

struct FABMenuView_Previews: PreviewProvider {
    static var previews: some View {
        ZStack {
            Color(hex: "f0f0f0").ignoresSafeArea()

            FABMenuView()
                .environmentObject(AppState.shared)
                .padding()
        }
    }
}
