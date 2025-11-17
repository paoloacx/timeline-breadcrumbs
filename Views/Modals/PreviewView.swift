import SwiftUI
import MapKit
import AVFoundation

struct PreviewView: View {
    let entry: Entry
    @EnvironmentObject var appState: AppState
    @Environment(\.dismiss) var dismiss

    @State private var audioPlayer: AVAudioPlayer?
    @State private var isPlayingAudio = false
    @State private var selectedImageIndex: Int? = nil

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {

                    // Time
                    macSection(label: "Time") {
                        Text(formatDateTime(entry.timestamp))
                            .font(.custom("Courier", size: 14))
                    }

                    // Mood
                    if let mood = entry.mood {
                        macSection(label: "Mood") {
                            HStack(spacing: 8) {
                                Image(systemName: mood.iconName)
                                    .font(.system(size: 20))
                                Text(mood.label)
                                    .font(.custom("Courier", size: 14))
                            }
                        }
                    }

                    // Note (for non-Time Events)
                    if !entry.isTimedActivity && !entry.note.isEmpty {
                        macSection(label: "Note") {
                            Text(entry.note)
                                .font(.custom("Courier", size: 14))
                                .frame(maxWidth: .infinity, alignment: .leading)
                        }
                    }

                    // Location
                    if let location = entry.location, !location.isEmpty {
                        macSection(label: "Location") {
                            Text(location)
                                .font(.custom("Courier", size: 14))
                        }
                    }

                    // Weather
                    if let weather = entry.weather, !weather.isEmpty {
                        macSection(label: "Weather") {
                            Text(weather)
                                .font(.custom("Courier", size: 14))
                        }
                    }

                    // Map
                    if let coords = entry.coords {
                        macSection(label: "Map") {
                            MapView(
                                coordinate: CLLocationCoordinate2D(
                                    latitude: coords.lat,
                                    longitude: coords.lon
                                ),
                                isMiniMap: false,
                                isInteractive: false
                            )
                            .frame(height: 300)
                            .overlay(
                                Rectangle()
                                    .stroke(Color.black, lineWidth: 2)
                            )
                        }
                    }

                    // Audio
                    if let audioBase64 = entry.audio, !audioBase64.isEmpty {
                        macSection(label: "Audio") {
                            HStack(spacing: 12) {
                                Button(action: toggleAudio) {
                                    Image(systemName: isPlayingAudio ? "pause.circle.fill" : "play.circle.fill")
                                        .font(.system(size: 40))
                                        .foregroundColor(.black)
                                }

                                Text(isPlayingAudio ? "Playing..." : "Tap to play")
                                    .font(.custom("Courier", size: 14))

                                Spacer()
                            }
                            .padding(12)
                            .overlay(
                                Rectangle()
                                    .stroke(Color.black, lineWidth: 2)
                            )
                        }
                        .onAppear {
                            setupAudioPlayer(base64String: audioBase64)
                        }
                        .onDisappear {
                            stopAudio()
                        }
                    }

                    // Images
                    if let images = entry.images, !images.isEmpty {
                        macSection(label: "Images") {
                            ScrollView(.horizontal, showsIndicators: false) {
                                HStack(spacing: 12) {
                                    ForEach(images.indices, id: \.self) { index in
                                        if let imageData = Data(base64Encoded: images[index]),
                                           let uiImage = UIImage(data: imageData) {
                                            Image(uiImage: uiImage)
                                                .resizable()
                                                .scaledToFit()
                                                .frame(height: 200)
                                                .overlay(
                                                    Rectangle()
                                                        .stroke(Color.black, lineWidth: 2)
                                                )
                                                .onTapGesture {
                                                    selectedImageIndex = index
                                                }
                                        }
                                    }
                                }
                            }
                        }
                    }

                    // Activity & Duration (Time Event)
                    if entry.isTimedActivity {
                        macSection(label: "Activity") {
                            if let activity = entry.activity, let duration = entry.duration {
                                Text("\(activity) (\(duration) minutes)")
                                    .font(.custom("Courier", size: 14))
                            }
                        }

                        // Optional Note for Time Event
                        if let optionalNote = entry.note, !optionalNote.isEmpty {
                            macSection(label: "Note") {
                                Text(optionalNote)
                                    .font(.custom("Courier", size: 14))
                                    .frame(maxWidth: .infinity, alignment: .leading)
                            }
                        }
                    }

                    // Quick Track Note
                    if entry.isQuickTrack && !entry.note.isEmpty {
                        macSection(label: "Tracked Items") {
                            Text(entry.note)
                                .font(.custom("Courier", size: 14))
                        }
                    }

                    // Spent Amount
                    if entry.isSpent {
                        macSection(label: "Amount Spent") {
                            if let amount = entry.amount {
                                Text("€\(String(format: "%.2f", amount))")
                                    .font(.custom("Courier", size: 14))
                            }
                        }
                    }

                    // Day Recap
                    if entry.isRecap {
                        if let reflection = entry.reflection, !reflection.isEmpty {
                            macSection(label: "Reflection") {
                                Text(reflection)
                                    .font(.custom("Courier", size: 14))
                                    .frame(maxWidth: .infinity, alignment: .leading)
                            }
                        }

                        if let rating = entry.rating {
                            macSection(label: "Rating") {
                                Text("\(rating)/10")
                                    .font(.custom("Courier", size: 16, weight: .bold))
                            }
                        }

                        if let highlights = entry.highlights?.filter({ !$0.isEmpty }), !highlights.isEmpty {
                            macSection(label: "Highlights") {
                                VStack(alignment: .leading, spacing: 4) {
                                    ForEach(highlights, id: \.self) { highlight in
                                        HStack(alignment: .top, spacing: 4) {
                                            Text("•")
                                            Text(highlight)
                                        }
                                        .font(.custom("Courier", size: 14))
                                    }
                                }
                            }
                        }

                        if let bso = entry.bso {
                            macSection(label: "BSO") {
                                HStack(spacing: 12) {
                                    if let artworkURL = URL(string: bso.artworkUrl) {
                                        AsyncImage(url: artworkURL) { image in
                                            image
                                                .resizable()
                                                .scaledToFit()
                                        } placeholder: {
                                            Rectangle()
                                                .fill(Color.gray.opacity(0.3))
                                        }
                                        .frame(width: 60, height: 60)
                                        .overlay(
                                            Rectangle()
                                                .stroke(Color.black, lineWidth: 2)
                                        )
                                    }

                                    VStack(alignment: .leading, spacing: 4) {
                                        Text(bso.name)
                                            .font(.custom("Courier", size: 14, weight: .bold))
                                        Text(bso.artist)
                                            .font(.custom("Courier", size: 12))
                                            .foregroundColor(.gray)
                                    }

                                    Spacer()
                                }
                                .padding(12)
                                .overlay(
                                    Rectangle()
                                        .stroke(Color.black, lineWidth: 2)
                                )
                            }
                        }
                    }
                }
                .padding()
            }
            .navigationTitle("Entry Details")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Close") {
                        dismiss()
                    }
                    .font(.custom("Courier", size: 16))
                    .foregroundColor(.black)
                }

                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Edit") {
                        handleEdit()
                    }
                    .font(.custom("Courier", size: 16))
                    .foregroundColor(.black)
                }
            }
        }
        .sheet(item: $selectedImageIndex) { index in
            ImagePreviewView(images: entry.images ?? [], selectedIndex: index)
        }
    }

    // MARK: - Helper Views

    @ViewBuilder
    private func macSection<Content: View>(label: String, @ViewBuilder content: () -> Content) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(label + ":")
                .font(.custom("Courier", size: 14, weight: .bold))
                .foregroundColor(.black)

            content()
        }
    }

    // MARK: - Helper Functions

    private func formatDateTime(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "MMM d, yyyy 'at' HH:mm"
        return formatter.string(from: date)
    }

    private func handleEdit() {
        // Set editing state in AppState
        appState.editingEntryId = entry.id

        // Close preview
        dismiss()
        appState.showPreviewModal = false

        // Open appropriate form
        if entry.isTimedActivity {
            appState.showTimeModal = true
        } else if entry.isQuickTrack {
            appState.showTrackModal = true
        } else if entry.isSpent {
            appState.showSpentModal = true
        } else if entry.isRecap {
            appState.showRecapModal = true
        } else {
            appState.showCrumbModal = true
        }
    }

    // MARK: - Audio Functions

    private func setupAudioPlayer(base64String: String) {
        guard let audioData = Data(base64Encoded: base64String) else {
            print("Failed to decode audio base64")
            return
        }

        do {
            audioPlayer = try AVAudioPlayer(data: audioData)
            audioPlayer?.prepareToPlay()
            audioPlayer?.delegate = AudioPlayerDelegate(onFinish: {
                isPlayingAudio = false
            })
        } catch {
            print("Failed to setup audio player: \(error.localizedDescription)")
        }
    }

    private func toggleAudio() {
        guard let player = audioPlayer else { return }

        if player.isPlaying {
            player.pause()
            isPlayingAudio = false
        } else {
            player.play()
            isPlayingAudio = true
        }
    }

    private func stopAudio() {
        audioPlayer?.stop()
        isPlayingAudio = false
    }
}

// MARK: - Image Preview View

struct ImagePreviewView: View {
    let images: [String]
    @State var selectedIndex: Int
    @Environment(\.dismiss) var dismiss

    var body: some View {
        NavigationView {
            ZStack {
                Color.black.ignoresSafeArea()

                TabView(selection: $selectedIndex) {
                    ForEach(images.indices, id: \.self) { index in
                        if let imageData = Data(base64Encoded: images[index]),
                           let uiImage = UIImage(data: imageData) {
                            Image(uiImage: uiImage)
                                .resizable()
                                .scaledToFit()
                                .tag(index)
                        }
                    }
                }
                .tabViewStyle(.page(indexDisplayMode: .always))
                .indexViewStyle(.page(backgroundDisplayMode: .always))
            }
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Close") {
                        dismiss()
                    }
                    .foregroundColor(.white)
                }
            }
        }
    }
}

// MARK: - Audio Player Delegate

class AudioPlayerDelegate: NSObject, AVAudioPlayerDelegate {
    let onFinish: () -> Void

    init(onFinish: @escaping () -> Void) {
        self.onFinish = onFinish
    }

    func audioPlayerDidFinishPlaying(_ player: AVAudioPlayer, successfully flag: Bool) {
        onFinish()
    }
}

// MARK: - Int Extension for Sheet

extension Int: Identifiable {
    public var id: Int { self }
}
