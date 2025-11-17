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
        VStack(alignment: .leading, spacing: 0) {
            // Day Header
            Button(action: toggleAction) {
                HStack {
                    VStack(alignment: .leading, spacing: 4) {
                        Text(formattedDayTitle(day))
                            .font(.custom("Courier", size: 16))
                            .fontWeight(.bold)

                        Text(formattedDaySubtitle(day))
                            .font(.custom("Courier", size: 12))
                            .foregroundColor(.gray)
                    }

                    Spacer()

                    // Entry count badge
                    Text("\(entries.count)")
                        .font(.custom("Courier", size: 12))
                        .fontWeight(.bold)
                        .foregroundColor(.white)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(Color.black)

                    Image(systemName: isExpanded ? "chevron.up" : "chevron.down")
                        .font(.system(size: 14, weight: .bold))
                }
                .padding(12)
                .frame(maxWidth: .infinity, alignment: .leading)
            }
            .buttonStyle(PlainButtonStyle())
            .background(Color(hex: "e0e0e0"))
            .overlay(
                Rectangle()
                    .stroke(Color.black, lineWidth: 3)
            )

            // Entries (Collapsible)
            if isExpanded {
                VStack(spacing: 0) {
                    ForEach(entries) { entry in
                        EntryCard(entry: entry)
                            .padding(.top, 8)
                    }
                }
                .padding(12)
                .background(Color.white)
                .overlay(
                    Rectangle()
                        .strokeBorder(Color.black, lineWidth: 3)
                )
            }
        }
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
