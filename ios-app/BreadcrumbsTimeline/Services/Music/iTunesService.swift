//
//  iTunesService.swift
//  BreadcrumbsTimeline
//
//  iTunes API service for searching music (BSO - Banda Sonora del Día)
//

import Foundation

class iTunesService {
    static let shared = iTunesService()

    private let baseURL = "https://itunes.apple.com/search"

    private init() {}

    // MARK: - Search Songs

    func searchSongs(query: String, limit: Int = 10, completion: @escaping ([BSOTrack]?, Error?) -> Void) {
        guard !query.isEmpty else {
            completion([], nil)
            return
        }

        let encodedQuery = query.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? ""
        let urlString = "\(baseURL)?term=\(encodedQuery)&entity=song&limit=\(limit)"

        guard let url = URL(string: urlString) else {
            completion(nil, NSError(domain: "iTunes", code: 1, userInfo: [NSLocalizedDescriptionKey: "Invalid URL"]))
            return
        }

        let task = URLSession.shared.dataTask(with: url) { data, response, error in
            if let error = error {
                DispatchQueue.main.async {
                    completion(nil, error)
                }
                return
            }

            guard let data = data else {
                DispatchQueue.main.async {
                    completion(nil, NSError(domain: "iTunes", code: 2, userInfo: [NSLocalizedDescriptionKey: "No data received"]))
                }
                return
            }

            do {
                let json = try JSONSerialization.jsonObject(with: data) as? [String: Any]
                guard let results = json?["results"] as? [[String: Any]] else {
                    DispatchQueue.main.async {
                        completion([], nil)
                    }
                    return
                }

                let tracks = results.compactMap { result -> BSOTrack? in
                    guard let trackName = result["trackName"] as? String,
                          let artistName = result["artistName"] as? String else {
                        return nil
                    }

                    return BSOTrack(
                        trackName: trackName,
                        artistName: artistName,
                        artworkUrl100: result["artworkUrl100"] as? String,
                        previewUrl: result["previewUrl"] as? String,
                        trackId: result["trackId"] as? Int
                    )
                }

                DispatchQueue.main.async {
                    completion(tracks, nil)
                }

            } catch {
                DispatchQueue.main.async {
                    completion(nil, error)
                }
            }
        }

        task.resume()
    }
}
