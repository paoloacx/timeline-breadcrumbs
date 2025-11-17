//
//  RecapFormView.swift
//  BreadcrumbsTimeline
//
//  Day Recap form (reflection, rating, highlights, BSO)
//

import SwiftUI

struct RecapFormView: View {
    @EnvironmentObject var appState: AppState
    @Environment(\.dismiss) var dismiss

    @State private var timestamp = Date()
    @State private var reflection = ""
    @State private var rating: Double = 5
    @State private var highlight1 = ""
    @State private var highlight2 = ""
    @State private var highlight3 = ""
    @State private var bsoQuery = ""
    @State private var bsoResults: [BSOTrack] = []
    @State private var selectedBSO: BSOTrack?
    @State private var isSearching = false

    private let musicService = iTunesService.shared

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 16) {
                    // Date & Time
                    macField(label: "📅 Date & Time") {
                        DatePicker("", selection: $timestamp, displayedComponents: [.date, .hourAndMinute])
                            .labelsHidden()
                            .font(.custom("Courier", size: 14))
                    }

                    // Reflection
                    macField(label: "Reflexión del día") {
                        TextEditor(text: $reflection)
                            .font(.custom("Courier", size: 14))
                            .frame(minHeight: 100)
                            .padding(8)
                            .background(Color.white)
                            .overlay(
                                RoundedRectangle(cornerRadius: 0)
                                    .stroke(Color.black, lineWidth: 2)
                            )
                    }

                    // Rating
                    macField(label: "Valoración del día (1-10)") {
                        HStack(spacing: 12) {
                            Slider(value: $rating, in: 1...10, step: 1)
                                .accentColor(.blue)

                            Text("\(Int(rating))")
                                .font(.custom("Courier", size: 24))
                                .fontWeight(.bold)
                                .frame(width: 50)
                        }
                    }

                    // Highlights
                    macField(label: "3 cosas destacadas del día") {
                        VStack(spacing: 8) {
                            TextField("1. Lo mejor del día", text: $highlight1)
                                .font(.custom("Courier", size: 14))
                                .padding(8)
                                .background(Color.white)
                                .overlay(
                                    RoundedRectangle(cornerRadius: 0)
                                        .stroke(Color.black, lineWidth: 2)
                                )

                            TextField("2. Algo que aprendiste", text: $highlight2)
                                .font(.custom("Courier", size: 14))
                                .padding(8)
                                .background(Color.white)
                                .overlay(
                                    RoundedRectangle(cornerRadius: 0)
                                        .stroke(Color.black, lineWidth: 2)
                                )

                            TextField("3. Momento favorito", text: $highlight3)
                                .font(.custom("Courier", size: 14))
                                .padding(8)
                                .background(Color.white)
                                .overlay(
                                    RoundedRectangle(cornerRadius: 0)
                                        .stroke(Color.black, lineWidth: 2)
                                )
                        }
                    }

                    // BSO Search
                    macField(label: "Banda Sonora del Día (BSO)") {
                        VStack(spacing: 8) {
                            HStack(spacing: 8) {
                                TextField("Buscar canción...", text: $bsoQuery)
                                    .font(.custom("Courier", size: 14))
                                    .padding(8)
                                    .background(Color.white)
                                    .overlay(
                                        RoundedRectangle(cornerRadius: 0)
                                            .stroke(Color.black, lineWidth: 2)
                                    )

                                Button(action: searchBSO) {
                                    HStack {
                                        if isSearching {
                                            ProgressView()
                                                .scaleEffect(0.8)
                                        } else {
                                            Image(systemName: "magnifyingglass")
                                        }
                                        Text("Buscar")
                                            .font(.custom("Courier", size: 12))
                                    }
                                }
                                .macButtonStyle()
                                .disabled(bsoQuery.isEmpty || isSearching)
                            }

                            // Selected BSO
                            if let bso = selectedBSO {
                                HStack(spacing: 8) {
                                    if let artworkUrl = bso.artworkUrl100,
                                       let url = URL(string: artworkUrl) {
                                        AsyncImage(url: url) { image in
                                            image.resizable()
                                        } placeholder: {
                                            Rectangle().fill(Color.gray)
                                        }
                                        .frame(width: 50, height: 50)
                                        .overlay(
                                            Rectangle()
                                                .stroke(Color.black, lineWidth: 2)
                                        )
                                    }

                                    VStack(alignment: .leading, spacing: 2) {
                                        Text(bso.trackName)
                                            .font(.custom("Courier", size: 12))
                                            .fontWeight(.bold)
                                        Text(bso.artistName)
                                            .font(.custom("Courier", size: 11))
                                            .foregroundColor(.gray)
                                    }

                                    Spacer()

                                    Button(action: { selectedBSO = nil }) {
                                        Image(systemName: "xmark.circle.fill")
                                            .foregroundColor(.red)
                                    }
                                }
                                .padding(8)
                                .background(Color.white)
                                .overlay(
                                    RoundedRectangle(cornerRadius: 0)
                                        .stroke(Color.black, lineWidth: 2)
                                )
                            }

                            // Search Results
                            if !bsoResults.isEmpty && selectedBSO == nil {
                                VStack(spacing: 0) {
                                    ForEach(bsoResults) { track in
                                        Button(action: {
                                            selectedBSO = track
                                            bsoResults = []
                                        }) {
                                            HStack(spacing: 8) {
                                                if let artworkUrl = track.artworkUrl100,
                                                   let url = URL(string: artworkUrl) {
                                                    AsyncImage(url: url) { image in
                                                        image.resizable()
                                                    } placeholder: {
                                                        Rectangle().fill(Color.gray)
                                                    }
                                                    .frame(width: 40, height: 40)
                                                }

                                                VStack(alignment: .leading, spacing: 2) {
                                                    Text(track.trackName)
                                                        .font(.custom("Courier", size: 11))
                                                        .fontWeight(.bold)
                                                        .foregroundColor(.black)
                                                    Text(track.artistName)
                                                        .font(.custom("Courier", size: 10))
                                                        .foregroundColor(.gray)
                                                }

                                                Spacer()
                                            }
                                            .padding(8)
                                            .background(Color.white)
                                        }
                                        .buttonStyle(PlainButtonStyle())

                                        if track.id != bsoResults.last?.id {
                                            Rectangle()
                                                .fill(Color.black)
                                                .frame(height: 1)
                                        }
                                    }
                                }
                                .overlay(
                                    RoundedRectangle(cornerRadius: 0)
                                        .stroke(Color.black, lineWidth: 2)
                                )
                                .frame(maxHeight: 200)
                            }
                        }
                    }

                    // Delete button (when editing)
                    if appState.editingEntryId != nil {
                        Button(action: deleteEntry) {
                            HStack {
                                Image(systemName: "trash.fill")
                                Text("Delete")
                                    .font(.custom("Courier", size: 14))
                                    .fontWeight(.bold)
                            }
                            .foregroundColor(.white)
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color.red)
                            .overlay(
                                RoundedRectangle(cornerRadius: 0)
                                    .stroke(Color.black, lineWidth: 3)
                            )
                        }
                    }
                }
                .padding(16)
            }
            .background(Color(hex: "f0f0f0"))
            .navigationTitle(appState.editingEntryId == nil ? "Day Recap" : "Edit Recap")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        appState.clearRecapState()
                        dismiss()
                    }
                }
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Save") {
                        saveEntry()
                    }
                    .disabled(reflection.isEmpty)
                }
            }
        }
        .onAppear {
            loadEditingEntry()
        }
    }

    private func macField<Content: View>(label: String, @ViewBuilder content: () -> Content) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(label)
                .font(.custom("Courier", size: 14))
                .fontWeight(.bold)
            content()
        }
    }

    private func searchBSO() {
        isSearching = true

        musicService.searchSongs(query: bsoQuery, limit: 10) { results, error in
            isSearching = false

            if let error = error {
                print("BSO search error: \(error.localizedDescription)")
                return
            }

            bsoResults = results ?? []
        }
    }

    private func loadEditingEntry() {
        guard let entryId = appState.editingEntryId,
              let entry = appState.entries.first(where: { $0.id == entryId }) else {
            return
        }

        timestamp = entry.timestamp
        reflection = entry.reflection ?? ""
        rating = Double(entry.rating ?? 5)

        if let highlights = entry.highlights {
            highlight1 = highlights.count > 0 ? highlights[0] : ""
            highlight2 = highlights.count > 1 ? highlights[1] : ""
            highlight3 = highlights.count > 2 ? highlights[2] : ""
        }

        selectedBSO = entry.bso
    }

    private func saveEntry() {
        var highlights: [String] = []
        if !highlight1.isEmpty { highlights.append(highlight1) }
        if !highlight2.isEmpty { highlights.append(highlight2) }
        if !highlight3.isEmpty { highlights.append(highlight3) }

        let entry = Entry(
            id: appState.editingEntryId ?? Int64(Date().timeIntervalSince1970 * 1000),
            timestamp: timestamp,
            note: reflection,
            reflection: reflection,
            rating: Int(rating),
            highlights: highlights.isEmpty ? nil : highlights,
            bso: selectedBSO,
            isTimedActivity: false,
            isQuickTrack: false,
            isSpent: false,
            isRecap: true,
            type: "recap"
        )

        if appState.editingEntryId != nil {
            appState.updateEntry(entry)
        } else {
            appState.addEntry(entry)
        }

        appState.clearRecapState()
        dismiss()
    }

    private func deleteEntry() {
        guard let entryId = appState.editingEntryId else { return }
        appState.removeEntry(id: entryId)
        appState.clearRecapState()
        dismiss()
    }
}

// Make BSOTrack identifiable for ForEach
extension BSOTrack: Identifiable {
    var id: Int { trackId ?? 0 }
}
