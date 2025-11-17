//
//  AudioService.swift
//  BreadcrumbsTimeline
//
//  Audio recording service using AVFoundation
//

import Foundation
import AVFoundation

class AudioService: NSObject, ObservableObject {
    static let shared = AudioService()

    @Published var isRecording = false
    @Published var recordingError: String?

    private var audioRecorder: AVAudioRecorder?
    private var recordingSession: AVAudioSession?
    var recordingURL: URL?  // Made public for access in forms

    // Callback for recording completion
    private var recordingCompletion: ((String?, Error?) -> Void)?

    private override init() {
        super.init()
        setupAudioSession()
    }

    // MARK: - Setup

    private func setupAudioSession() {
        recordingSession = AVAudioSession.sharedInstance()

        do {
            try recordingSession?.setCategory(.playAndRecord, mode: .default)
            try recordingSession?.setActive(true)
        } catch {
            print("Failed to setup audio session: \(error.localizedDescription)")
        }
    }

    // MARK: - Request Permission

    func requestMicrophonePermission(completion: @escaping (Bool) -> Void) {
        AVAudioSession.sharedInstance().requestRecordPermission { granted in
            DispatchQueue.main.async {
                completion(granted)
            }
        }
    }

    // MARK: - Start Recording

    func startRecording(completion: @escaping (String?, Error?) -> Void) {
        // Check permission first
        requestMicrophonePermission { [weak self] granted in
            guard granted else {
                completion(nil, NSError(domain: "Audio", code: 1, userInfo: [NSLocalizedDescriptionKey: "Microphone permission denied"]))
                return
            }

            self?.beginRecording(completion: completion)
        }
    }

    private func beginRecording(completion: @escaping (String?, Error?) -> Void) {
        recordingCompletion = completion

        // Create unique file URL
        let fileName = "recording_\(Date().timeIntervalSince1970).m4a"
        let documentPath = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
        recordingURL = documentPath.appendingPathComponent(fileName)

        guard let url = recordingURL else {
            completion(nil, NSError(domain: "Audio", code: 2, userInfo: [NSLocalizedDescriptionKey: "Failed to create recording URL"]))
            return
        }

        let settings: [String: Any] = [
            AVFormatIDKey: Int(kAudioFormatMPEG4AAC),
            AVSampleRateKey: 44100,
            AVNumberOfChannelsKey: 2,
            AVEncoderAudioQualityKey: AVAudioQuality.high.rawValue
        ]

        do {
            audioRecorder = try AVAudioRecorder(url: url, settings: settings)
            audioRecorder?.delegate = self
            audioRecorder?.record()

            DispatchQueue.main.async {
                self.isRecording = true
            }

        } catch {
            DispatchQueue.main.async {
                self.recordingError = error.localizedDescription
                completion(nil, error)
            }
        }
    }

    // MARK: - Stop Recording

    func stopRecording() {
        audioRecorder?.stop()

        DispatchQueue.main.async {
            self.isRecording = false
        }
    }

    // MARK: - Get Base64 from URL

    func getBase64Audio(from url: URL) -> String? {
        guard let data = try? Data(contentsOf: url) else { return nil }
        return data.base64EncodedString()
    }
}

// MARK: - AVAudioRecorderDelegate

extension AudioService: AVAudioRecorderDelegate {
    func audioRecorderDidFinishRecording(_ recorder: AVAudioRecorder, successfully flag: Bool) {
        if flag, let url = recordingURL {
            // Convert to base64
            let base64 = getBase64Audio(from: url)
            recordingCompletion?(base64, nil)
        } else {
            recordingCompletion?(nil, NSError(domain: "Audio", code: 3, userInfo: [NSLocalizedDescriptionKey: "Recording failed"]))
        }

        recordingCompletion = nil
    }

    func audioRecorderEncodeErrorDidOccur(_ recorder: AVAudioRecorder, error: Error?) {
        DispatchQueue.main.async {
            self.isRecording = false
            self.recordingError = error?.localizedDescription
        }

        recordingCompletion?(nil, error)
        recordingCompletion = nil
    }
}
