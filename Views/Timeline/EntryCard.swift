//
//  EntryCard.swift
//  BreadcrumbsTimeline
//
//  Entry card component (equivalent to timeline entry cards in web)
//

import SwiftUI

struct EntryCard: View {
    @EnvironmentObject var appState: AppState
    let entry: Entry

    var body: some View {
        Button(action: {
            appState.previewEntry = entry
            appState.showPreviewModal = true
        }) {
            VStack(alignment: .leading, spacing: 8) {
                // Header: Time + Type Badge
                HStack {
                    Text(formattedTime(entry.timestamp))
                        .font(.custom("Courier", size: 14))
                        .fontWeight(.bold)

                    Spacer()

                    TypeBadge(type: entry.entryType)

                    Button(action: {
                        handleEdit()
                    }) {
                        Image(systemName: "pencil")
                            .font(.system(size: 12))
                    }
                    .buttonStyle(PlainButtonStyle())
                    .padding(4)
                }

                // Content based on type
                switch entry.entryType {
                case .crumb:
                    CrumbContent(entry: entry)
                case .time:
                    TimeContent(entry: entry)
                case .track:
                    TrackContent(entry: entry)
                case .spent:
                    SpentContent(entry: entry)
                case .recap:
                    RecapContent(entry: entry)
                }
            }
            .padding(12)
            .background(Color.white)
            .overlay(
                Rectangle()
                    .stroke(Color(hex: "999999"), lineWidth: 3)
            )
            .shadow(color: Color.black.opacity(0.3), radius: 0, x: 5, y: 5)
        }
        .buttonStyle(PlainButtonStyle())
    }

    private func handleEdit() {
        appState.editingEntryId = entry.id

        switch entry.entryType {
        case .crumb:
            appState.showCrumbModal = true
        case .time:
            appState.showTimeModal = true
        case .track:
            appState.showTrackModal = true
        case .spent:
            appState.showSpentModal = true
        case .recap:
            appState.showRecapModal = true
        }
    }

    private func formattedTime(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "HH:mm"
        return formatter.string(from: date)
    }
}

// MARK: - Type Badge

struct TypeBadge: View {
    let type: EntryType

    var body: some View {
        Text(type.rawValue.uppercased())
            .font(.custom("Courier", size: 10))
            .fontWeight(.bold)
            .foregroundColor(.white)
            .padding(.horizontal, 6)
            .padding(.vertical, 3)
            .background(badgeColor)
    }

    private var badgeColor: Color {
        switch type {
        case .crumb: return Color.blue
        case .time: return Color.purple
        case .track: return Color.green
        case .spent: return Color.orange
        case .recap: return Color.pink
        }
    }
}

// MARK: - Content Components

struct CrumbContent: View {
    let entry: Entry

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            // Mood
            if let mood = entry.mood {
                HStack(spacing: 4) {
                    Image(systemName: mood.iconName)
                        .font(.system(size: 14))
                    Text(mood.label)
                        .font(.custom("Courier", size: 12))
                }
            }

            // Note
            Text(entry.note)
                .font(.custom("Courier", size: 14))
                .lineLimit(3)

            // Location
            if let location = entry.location, !location.isEmpty {
                HStack(spacing: 4) {
                    Image(systemName: "mappin.and.ellipse")
                        .font(.system(size: 12))
                    Text(location)
                        .font(.custom("Courier", size: 12))
                }
            }

            // Weather
            if let weather = entry.weather, !weather.isEmpty {
                Text(weather)
                    .font(.custom("Courier", size: 12))
                    .foregroundColor(.gray)
            }

            // Images preview
            if let images = entry.images, !images.isEmpty {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        ForEach(0..<min(images.count, 3), id: \.self) { index in
                            if let imageData = Data(base64Encoded: images[index]),
                               let uiImage = UIImage(data: imageData) {
                                Image(uiImage: uiImage)
                                    .resizable()
                                    .scaledToFill()
                                    .frame(width: 60, height: 60)
                                    .clipped()
                                    .overlay(
                                        Rectangle()
                                            .stroke(Color.black, lineWidth: 2)
                                    )
                            }
                        }
                    }
                }
            }
        }
    }
}

struct TimeContent: View {
    let entry: Entry

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack {
                Image(systemName: "clock.fill")
                    .font(.system(size: 14))
                Text("\(entry.activity ?? "Activity") - \(entry.duration ?? 0) min")
                    .font(.custom("Courier", size: 14))
                    .fontWeight(.bold)
            }

            if let note = entry.optionalNote, !note.isEmpty {
                Text(note)
                    .font(.custom("Courier", size: 12))
                    .foregroundColor(.gray)
            }
        }
    }
}

struct TrackContent: View {
    let entry: Entry

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(entry.note)
                .font(.custom("Courier", size: 14))
                .fontWeight(.bold)

            if let note = entry.optionalNote, !note.isEmpty {
                Text(note)
                    .font(.custom("Courier", size: 12))
                    .foregroundColor(.gray)
            }
        }
    }
}

struct SpentContent: View {
    let entry: Entry

    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                if let desc = entry.spentDescription {
                    Text(desc)
                        .font(.custom("Courier", size: 14))
                }
            }

            Spacer()

            if let amount = entry.amount {
                Text(String(format: "%.2f€", amount))
                    .font(.custom("Courier", size: 16))
                    .fontWeight(.bold)
                    .foregroundColor(.orange)
            }
        }
    }
}

struct RecapContent: View {
    let entry: Entry

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            // Rating
            if let rating = entry.rating {
                HStack(spacing: 4) {
                    ForEach(0..<rating, id: \.self) { _ in
                        Image(systemName: "star.fill")
                            .font(.system(size: 12))
                            .foregroundColor(.yellow)
                    }
                    Text("\(rating)/10")
                        .font(.custom("Courier", size: 14))
                        .fontWeight(.bold)
                }
            }

            // Reflection preview
            if let reflection = entry.reflection, !reflection.isEmpty {
                Text(reflection)
                    .font(.custom("Courier", size: 12))
                    .lineLimit(2)
                    .foregroundColor(.gray)
            }

            // BSO
            if let bso = entry.bso {
                HStack(spacing: 8) {
                    if let artworkUrl = bso.artworkUrl100,
                       let url = URL(string: artworkUrl) {
                        AsyncImage(url: url) { image in
                            image.resizable()
                        } placeholder: {
                            Rectangle().fill(Color.gray)
                        }
                        .frame(width: 40, height: 40)
                        .overlay(
                            Rectangle()
                                .stroke(Color.black, lineWidth: 1)
                        )
                    }

                    VStack(alignment: .leading, spacing: 2) {
                        Text(bso.trackName)
                            .font(.custom("Courier", size: 11))
                            .fontWeight(.bold)
                            .lineLimit(1)
                        Text(bso.artistName)
                            .font(.custom("Courier", size: 10))
                            .foregroundColor(.gray)
                            .lineLimit(1)
                    }
                }
            }
        }
    }
}
