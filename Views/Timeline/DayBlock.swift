//
//  DayBlock.swift
//  BreadcrumbsTimeline
//
//  Day block component with collapsible entries
//

import SwiftUI

struct DayBlock: View {
    let day: String
    let entries: [Entry]
    let isExpanded: Bool
    let toggleAction: () -> Void

    var body: some View {
        ZStack(alignment: .topLeading) {
            VStack(alignment: .leading, spacing: 0) {
                // Day Header (fondo negro, texto blanco)
                Button(action: toggleAction) {
                    HStack {
                        Text(formattedDayTitle(day))
                            .font(.system(size: 16, weight: .bold, design: .monospaced))
                            .foregroundColor(.white)

                        Spacer()

                        Image(systemName: isExpanded ? "chevron.up" : "chevron.down")
                            .font(.system(size: 14, weight: .bold))
                            .foregroundColor(.white)
                    }
                    .padding(.horizontal, 16)
                    .padding(.vertical, 12)
                    .frame(maxWidth: .infinity, alignment: .leading)
                }
                .buttonStyle(PlainButtonStyle())
                .background(Color.black)
                .overlay(
                    Rectangle()
                        .strokeBorder(Color.black, lineWidth: 3)
                )

                // Entries (Collapsible)
                if isExpanded {
                    VStack(spacing: 5) {
                        ForEach(entries) { entry in
                            EntryCard(entry: entry)
                        }
                    }
                    .padding(10)
                    .background(Color.white)
                }
            }
            .background(Color.white)
            .overlay(
                Rectangle()
                    .stroke(Color.black, lineWidth: 3)
            )
            .shadow(color: Color.black.opacity(0.3), radius: 0, x: 5, y: 5)

            // Bolita circular en el header (a la izquierda)
            Circle()
                .fill(Color.black)
                .frame(width: 11, height: 11)
                .overlay(
                    Circle()
                        .stroke(Color.white, lineWidth: 3)
                )
                .background(
                    Circle()
                        .stroke(Color.black, lineWidth: 3)
                        .frame(width: 17, height: 17)
                )
                .offset(x: -31.5, y: 20)
        }
        .padding(.leading, 21)
        .padding(.trailing, -10)
        .padding(.bottom, 20)
    }

    private func formattedDayTitle(_ dayString: String) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        guard let date = formatter.date(from: dayString) else { return dayString }

        let calendar = Calendar.current
        if calendar.isDateInToday(date) {
            return "Today"
        } else if calendar.isDateInYesterday(date) {
            return "Yesterday"
        } else {
            let outputFormatter = DateFormatter()
            outputFormatter.dateFormat = "EEEE, MMM d"
            return outputFormatter.string(from: date)
        }
    }

    private func formattedDaySubtitle(_ dayString: String) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        guard let date = formatter.date(from: dayString) else { return "" }

        let outputFormatter = DateFormatter()
        outputFormatter.dateFormat = "yyyy"
        return outputFormatter.string(from: date)
    }
}
