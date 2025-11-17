//
//  CrumbFormView.swift
//  BreadcrumbsTimeline
//
//  Complete Crumb form with mood, GPS, images, audio
//

import SwiftUI
import PhotosUI

struct CrumbFormView: View {
    @EnvironmentObject var appState: AppState
    @Environment(\.dismiss) var dismiss

    // Form state
    @State private var timestamp = Date()
    @State private var note = ""
    @State private var location = ""
    @State private var weather = ""
    @State private var selectedMoodIndex: Int?

    // Collapsible sections
    @State private var isMoodExpanded = true
    @State private var isImagesExpanded = false
    @State private var isAudioExpanded = false

    // GPS state
    @State private var isGettingGPS = false
    @State private var currentCoords: Coordinates?
    @State private var showMap = false

    // Images
    @State private var selectedPhotos: [PhotosPickerItem] = []
    @State private var imageDataArray: [String] = []  // Base64 strings

    // Audio
    @State private var isRecording = false
    @State private var audioBase64: String?

    // Services
    private let locationService = LocationService.shared
    private let weatherService = WeatherService.shared
    private let audioService = AudioService.shared

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 0) {
                    macFormContent
                }
                .padding(16)
            }
            .background(Color(hex: "f0f0f0"))
            .navigationTitle(appState.editingEntryId == nil ? "New Breadcrumb" : "Edit Breadcrumb")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        appState.clearFormState()
                        dismiss()
                    }
                }
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Save") {
                        saveEntry()
                    }
                    .disabled(note.isEmpty)
                }
            }
        }
        .onAppear {
            loadEditingEntry()
        }
    }

    // MARK: - Mac Classic Form

    private var macFormContent: some View {
        VStack(spacing: 16) {
            // Date & Time
            macField(label: "📅 Date & Time") {
                DatePicker("", selection: $timestamp, displayedComponents: [.date, .hourAndMinute])
                    .labelsHidden()
                    .font(.custom("Courier", size: 14))
            }

            // Mood (Collapsible)
            macCollapsibleSection(
                label: "😊 Mood",
                isExpanded: $isMoodExpanded
            ) {
                MoodPicker(selectedIndex: $selectedMoodIndex)
            }

            // Note
            macField(label: "Note:") {
                TextEditor(text: $note)
                    .font(.custom("Courier", size: 14))
                    .frame(minHeight: 100)
                    .padding(8)
                    .background(Color.white)
                    .overlay(
                        RoundedRectangle(cornerRadius: 0)
                            .stroke(Color.black, lineWidth: 2)
                    )
            }

            // Location + GPS
            macField(label: "📍 Location:") {
                VStack(spacing: 8) {
                    HStack(spacing: 8) {
                        TextField("Place", text: $location)
                            .font(.custom("Courier", size: 14))
                            .padding(8)
                            .background(Color.white)
                            .overlay(
                                RoundedRectangle(cornerRadius: 0)
                                    .stroke(Color.black, lineWidth: 2)
                            )

                        Button(action: handleGPS) {
                            HStack(spacing: 4) {
                                if isGettingGPS {
                                    ProgressView()
                                        .scaleEffect(0.8)
                                } else {
                                    Image(systemName: "location.fill")
                                }
                                Text("GPS")
                                    .font(.custom("Courier", size: 12))
                            }
                        }
                        .macButtonStyle()
                        .disabled(isGettingGPS)
                    }

                    if showMap, let coords = currentCoords {
                        MiniMapView(coordinates: coords)
                    }
                }
            }

            // Weather
            macField(label: "☁️ Weather:") {
                TextField("Sunny, cloudy...", text: $weather)
                    .font(.custom("Courier", size: 14))
                    .padding(8)
                    .background(Color.white)
                    .overlay(
                        RoundedRectangle(cornerRadius: 0)
                            .stroke(Color.black, lineWidth: 2)
                    )
            }

            // Images (Collapsible)
            macCollapsibleSection(
                label: "🖼️ Images",
                isExpanded: $isImagesExpanded
            ) {
                VStack(spacing: 8) {
                    PhotosPicker(selection: $selectedPhotos, maxSelectionCount: 5, matching: .images) {
                        HStack {
                            Image(systemName: "photo.on.rectangle")
                            Text("Select Photos")
                                .font(.custom("Courier", size: 14))
                        }
                        .frame(maxWidth: .infinity)
                        .padding()
                    }
                    .macButtonStyle()
                    .onChange(of: selectedPhotos) { newItems in
                        loadImages(from: newItems)
                    }

                    if !imageDataArray.isEmpty {
                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 8) {
                                ForEach(0..<imageDataArray.count, id: \.self) { index in
                                    imagePreview(index: index)
                                }
                            }
                        }
                    }
                }
            }

            // Audio (Collapsible)
            macCollapsibleSection(
                label: "🎤 Audio",
                isExpanded: $isAudioExpanded
            ) {
                VStack(spacing: 8) {
                    HStack(spacing: 8) {
                        Button(action: startRecording) {
                            HStack {
                                Image(systemName: isRecording ? "stop.circle.fill" : "mic.circle.fill")
                                    .foregroundColor(isRecording ? .red : .primary)
                                Text(isRecording ? "Recording..." : "Record")
                                    .font(.custom("Courier", size: 14))
                            }
                        }
                        .macButtonStyle()
                        .disabled(isRecording)

                        if isRecording {
                            Button(action: stopRecording) {
                                HStack {
                                    Image(systemName: "stop.fill")
                                    Text("Stop")
                                        .font(.custom("Courier", size: 14))
                                }
                            }
                            .macButtonStyle()
                        }
                    }

                    if audioBase64 != nil {
                        HStack {
                            Image(systemName: "waveform")
                            Text("Audio recorded")
                                .font(.custom("Courier", size: 12))
                                .foregroundColor(.green)
                            Spacer()
                            Button(action: { audioBase64 = nil }) {
                                Image(systemName: "trash")
                            }
                        }
                        .padding(8)
                        .background(Color.white)
                        .overlay(
                            RoundedRectangle(cornerRadius: 0)
                                .stroke(Color.black, lineWidth: 2)
                        )
                    }
                }
            }

            // Delete button (only when editing)
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
    }

    // MARK: - Helper Views

    private func macField<Content: View>(label: String, @ViewBuilder content: () -> Content) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(label)
                .font(.custom("Courier", size: 14))
                .fontWeight(.bold)
            content()
        }
    }

    private func macCollapsibleSection<Content: View>(
        label: String,
        isExpanded: Binding<Bool>,
        @ViewBuilder content: () -> Content
    ) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Button(action: {
                withAnimation(.spring(response: 0.3)) {
                    isExpanded.wrappedValue.toggle()
                }
            }) {
                HStack {
                    Text(label)
                        .font(.custom("Courier", size: 14))
                        .fontWeight(.bold)
                        .foregroundColor(.black)
                    Spacer()
                    Image(systemName: isExpanded.wrappedValue ? "chevron.down" : "chevron.right")
                        .font(.system(size: 12, weight: .bold))
                        .foregroundColor(.black)
                }
            }

            if isExpanded.wrappedValue {
                content()
            }
        }
    }

    private func imagePreview(index: Int) -> some View {
        Group {
            if let data = Data(base64Encoded: imageDataArray[index]),
               let uiImage = UIImage(data: data) {
                ZStack(alignment: .topTrailing) {
                    Image(uiImage: uiImage)
                        .resizable()
                        .scaledToFill()
                        .frame(width: 80, height: 80)
                        .clipped()
                        .overlay(
                            Rectangle()
                                .stroke(Color.black, lineWidth: 2)
                        )

                    Button(action: {
                        imageDataArray.remove(at: index)
                    }) {
                        Image(systemName: "xmark.circle.fill")
                            .foregroundColor(.red)
                            .background(Color.white.clipShape(Circle()))
                    }
                    .offset(x: 8, y: -8)
                }
            }
        }
    }

    // MARK: - Actions

    private func handleGPS() {
        isGettingGPS = true

        locationService.getCurrentLocation { coords, error in
            isGettingGPS = false

            guard let coords = coords else {
                print("GPS error: \(error?.localizedDescription ?? "Unknown")")
                return
            }

            currentCoords = coords
            showMap = true

            // Get place name
            locationService.getPlaceName(from: coords) { placeName in
                if let place = placeName, location.isEmpty {
                    location = place
                }
            }

            // Get weather
            weatherService.getWeather(lat: coords.lat, lon: coords.lon) { weatherString, error in
                if let weatherString = weatherString {
                    weather = weatherString
                }
            }
        }
    }

    private func loadImages(from items: [PhotosPickerItem]) {
        imageDataArray = []

        for item in items {
            item.loadTransferable(type: Data.self) { result in
                if case .success(let data) = result, let imageData = data {
                    let base64 = imageData.base64EncodedString()
                    DispatchQueue.main.async {
                        imageDataArray.append(base64)
                    }
                }
            }
        }
    }

    private func startRecording() {
        audioService.startRecording { base64, error in
            if let error = error {
                print("Recording error: \(error.localizedDescription)")
            }
            // Recording started
        }

        isRecording = true
    }

    private func stopRecording() {
        audioService.stopRecording()
        isRecording = false

        // The audio service will call completion with base64
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
            if let url = audioService.recordingURL {
                audioBase64 = audioService.getBase64Audio(from: url)
            }
        }
    }

    private func loadEditingEntry() {
        guard let entryId = appState.editingEntryId,
              let entry = appState.entries.first(where: { $0.id == entryId }) else {
            return
        }

        timestamp = entry.timestamp
        note = entry.note
        location = entry.location ?? ""
        weather = entry.weather ?? ""
        currentCoords = entry.coords
        showMap = entry.coords != nil
        imageDataArray = entry.images ?? []
        audioBase64 = entry.audio

        if let mood = entry.mood,
           let index = appState.settings.moods.firstIndex(where: { $0.visual == mood.visual }) {
            selectedMoodIndex = index
        }
    }

    private func saveEntry() {
        let mood = selectedMoodIndex.map { appState.settings.moods[$0] }

        let entry = Entry(
            id: appState.editingEntryId ?? Int64(Date().timeIntervalSince1970 * 1000),
            timestamp: timestamp,
            note: note,
            location: location.isEmpty ? nil : location,
            weather: weather.isEmpty ? nil : weather,
            images: imageDataArray.isEmpty ? nil : imageDataArray,
            audio: audioBase64,
            coords: currentCoords,
            mood: mood,
            isTimedActivity: false,
            isQuickTrack: false,
            isSpent: false,
            isRecap: false,
            type: "crumb"
        )

        if appState.editingEntryId != nil {
            appState.updateEntry(entry)
        } else {
            appState.addEntry(entry)
        }

        appState.clearFormState()
        dismiss()
    }

    private func deleteEntry() {
        guard let entryId = appState.editingEntryId else { return }

        appState.removeEntry(id: entryId)
        appState.clearFormState()
        dismiss()
    }
}

// MARK: - Mood Picker Component

struct MoodPicker: View {
    @EnvironmentObject var appState: AppState
    @Binding var selectedIndex: Int?

    var body: some View {
        LazyVGrid(columns: [GridItem(.adaptive(minimum: 60))], spacing: 12) {
            ForEach(0..<appState.settings.moods.count, id: \.self) { index in
                let mood = appState.settings.moods[index]

                Button(action: {
                    selectedIndex = (selectedIndex == index) ? nil : index
                }) {
                    VStack(spacing: 4) {
                        Image(systemName: mood.iconName)
                            .font(.system(size: 24))
                            .foregroundColor(selectedIndex == index ? .white : .black)

                        Text(mood.label)
                            .font(.custom("Courier", size: 10))
                            .foregroundColor(selectedIndex == index ? .white : .black)
                    }
                    .frame(width: 60, height: 60)
                    .background(selectedIndex == index ? Color.blue : Color.white)
                    .overlay(
                        RoundedRectangle(cornerRadius: 0)
                            .stroke(Color.black, lineWidth: selectedIndex == index ? 3 : 2)
                    )
                }
            }
        }
    }
}
