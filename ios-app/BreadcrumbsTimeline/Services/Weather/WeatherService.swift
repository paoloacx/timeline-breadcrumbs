//
//  WeatherService.swift
//  BreadcrumbsTimeline
//
//  Weather service using OpenWeatherMap API
//

import Foundation

class WeatherService {
    static let shared = WeatherService()

    private let apiKey = "317f7bcb07cf05e2c6265176c502a4bb"
    private let baseURL = "https://api.openweathermap.org/data/2.5/weather"

    private init() {}

    // MARK: - Get Weather by Coordinates

    func getWeather(lat: Double, lon: Double, completion: @escaping (String?, Error?) -> Void) {
        let urlString = "\(baseURL)?lat=\(lat)&lon=\(lon)&appid=\(apiKey)&units=metric&lang=en"

        guard let url = URL(string: urlString) else {
            completion(nil, NSError(domain: "Weather", code: 1, userInfo: [NSLocalizedDescriptionKey: "Invalid URL"]))
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
                    completion(nil, NSError(domain: "Weather", code: 2, userInfo: [NSLocalizedDescriptionKey: "No data received"]))
                }
                return
            }

            do {
                let json = try JSONSerialization.jsonObject(with: data) as? [String: Any]

                guard let weather = json?["weather"] as? [[String: Any]],
                      let firstWeather = weather.first,
                      let description = firstWeather["description"] as? String,
                      let id = firstWeather["id"] as? Int,
                      let main = json?["main"] as? [String: Any],
                      let temp = main["temp"] as? Double,
                      let name = json?["name"] as? String else {
                    DispatchQueue.main.async {
                        completion(nil, NSError(domain: "Weather", code: 3, userInfo: [NSLocalizedDescriptionKey: "Failed to parse weather data"]))
                    }
                    return
                }

                let emoji = self.getWeatherEmoji(id: id)
                let tempRounded = Int(temp.rounded())
                let weatherString = "\(emoji) \(description), \(tempRounded)°C in \(name)"

                DispatchQueue.main.async {
                    completion(weatherString, nil)
                }

            } catch {
                DispatchQueue.main.async {
                    completion(nil, error)
                }
            }
        }

        task.resume()
    }

    // MARK: - Weather Emoji Mapping

    private func getWeatherEmoji(id: Int) -> String {
        // OpenWeatherMap weather condition codes
        // https://openweathermap.org/weather-conditions
        switch id {
        case 200...232: return "⛈" // Thunderstorm
        case 300...321: return "🌦" // Drizzle
        case 500...531: return "🌧" // Rain
        case 600...622: return "❄️" // Snow
        case 701...781: return "🌫" // Atmosphere (fog, mist, etc.)
        case 800: return "☀️" // Clear
        case 801: return "🌤" // Few clouds
        case 802: return "⛅️" // Scattered clouds
        case 803...804: return "☁️" // Broken/overcast clouds
        default: return "🌍"
        }
    }
}
