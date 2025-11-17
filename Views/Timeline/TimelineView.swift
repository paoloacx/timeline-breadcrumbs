//
//  TimelineView.swift
//  BreadcrumbsTimeline
//
//  Timeline view grouped by days (equivalent to modules/timeline/timeline.js)
//

import SwiftUI

struct TimelineView: View {
    @EnvironmentObject var appState: AppState
    @State private var daysToShow: Int = 30
    @State private var expandedDays: Set<String> = []

    var body: some View {
        let entries = appState.getFilteredEntries()

        if entries.isEmpty {
            EmptyStateView()
        } else {
            let grouped = groupByDay(entries: entries)
            let sortedDays = grouped.keys.sorted(by: >)
            let limitedDays = Array(sortedDays.prefix(daysToShow))

            ZStack(alignment: .topLeading) {
                // Línea vertical negra (timeline)
                Rectangle()
                    .fill(Color.black)
                    .frame(width: 4)
                    .offset(x: -7, y: -45)
                    .zIndex(1)

                // Línea horizontal superior
                Rectangle()
                    .fill(Color.black)
                    .frame(height: 4)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .offset(x: -3, y: -45)
                    .zIndex(0)

                VStack(spacing: 0) {
                    ForEach(limitedDays, id: \.self) { day in
                        DayBlock(
                            day: day,
                            entries: grouped[day] ?? [],
                            isExpanded: expandedDays.contains(day)
                        ) {
                            toggleDay(day)
                        }
                    }

                    // Load More button
                    if sortedDays.count > daysToShow {
                        Button(action: {
                            daysToShow += 30
                        }) {
                            HStack {
                                Image(systemName: "arrow.down")
                                Text("Load More")
                                    .font(.system(size: 16, weight: .bold, design: .monospaced))
                            }
                            .frame(maxWidth: .infinity)
                            .padding(16)
                        }
                        .buttonStyle(PlainButtonStyle())
                        .background(Color(hex: "ddd"))
                        .overlay(
                            Rectangle()
                                .strokeBorder(Color.white, lineWidth: 3, antialiased: false)
                                .background(
                                    Rectangle()
                                        .stroke(Color.black, lineWidth: 3)
                                        .offset(x: 3, y: 3)
                                )
                        )
                        .padding(.top, 30)
                        .padding(.horizontal, -5)
                        .padding(.bottom, 40)
                    }
                }
                .padding(.top, 45)
                .zIndex(2)
            }
        }
    }

    private func groupByDay(entries: [Entry]) -> [String: [Entry]] {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"

        var grouped: [String: [Entry]] = [:]
        for entry in entries {
            let day = formatter.string(from: entry.timestamp)
            if grouped[day] == nil {
                grouped[day] = []
            }
            grouped[day]?.append(entry)
        }

        // Sort entries within each day
        for day in grouped.keys {
            grouped[day]?.sort { $0.timestamp > $1.timestamp }
        }

        return grouped
    }

    private func toggleDay(_ day: String) {
        if expandedDays.contains(day) {
            expandedDays.remove(day)
        } else {
            expandedDays.insert(day)
        }
    }
}

// MARK: - Empty State

struct EmptyStateView: View {
    var body: some View {
        VStack(spacing: 16) {
            Image(systemName: "mappin.and.ellipse")
                .font(.system(size: 48))
                .foregroundColor(.gray)

            Text("No entries yet")
                .font(.custom("Courier", size: 18))
                .fontWeight(.bold)

            Text("Create your first breadcrumb")
                .font(.custom("Courier", size: 14))
                .foregroundColor(.gray)
        }
        .padding(40)
        .frame(maxWidth: .infinity)
        .background(Color.white)
        .overlay(
            Rectangle()
                .stroke(Color.black, lineWidth: 3)
        )
    }
}

struct TimelineView_Previews: PreviewProvider {
    static var previews: some View {
        TimelineView()
            .environmentObject(AppState.shared)
    }
}
