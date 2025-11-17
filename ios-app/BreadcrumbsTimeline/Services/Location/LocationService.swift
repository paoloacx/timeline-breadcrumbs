//
//  LocationService.swift
//  BreadcrumbsTimeline
//
//  GPS and location service using CoreLocation
//

import Foundation
import CoreLocation

class LocationService: NSObject, ObservableObject {
    static let shared = LocationService()

    private let locationManager = CLLocationManager()
    @Published var currentLocation: CLLocation?
    @Published var locationError: String?
    @Published var authorizationStatus: CLAuthorizationStatus = .notDetermined

    // Callback for one-time location fetch
    private var locationCallback: ((Coordinates?, Error?) -> Void)?

    private override init() {
        super.init()
        locationManager.delegate = self
        locationManager.desiredAccuracy = kCLLocationAccuracyBest
    }

    // MARK: - Request Permission

    func requestLocationPermission() {
        authorizationStatus = locationManager.authorizationStatus

        switch authorizationStatus {
        case .notDetermined:
            locationManager.requestWhenInUseAuthorization()
        case .restricted, .denied:
            locationError = "Location access denied. Please enable in Settings."
        case .authorizedWhenInUse, .authorizedAlways:
            // Already authorized
            break
        @unknown default:
            break
        }
    }

    // MARK: - Get Current Location (One-time)

    func getCurrentLocation(completion: @escaping (Coordinates?, Error?) -> Void) {
        requestLocationPermission()

        guard authorizationStatus == .authorizedWhenInUse || authorizationStatus == .authorizedAlways else {
            completion(nil, NSError(domain: "Location", code: 1, userInfo: [NSLocalizedDescriptionKey: "Location permission not granted"]))
            return
        }

        locationCallback = completion
        locationManager.requestLocation()
    }

    // MARK: - Reverse Geocoding (Get Place Name)

    func getPlaceName(from coordinates: Coordinates, completion: @escaping (String?) -> Void) {
        let location = CLLocation(latitude: coordinates.lat, longitude: coordinates.lon)
        let geocoder = CLGeocoder()

        geocoder.reverseGeocodeLocation(location) { placemarks, error in
            if let error = error {
                print("Reverse geocoding error: \(error.localizedDescription)")
                completion(nil)
                return
            }

            guard let placemark = placemarks?.first else {
                completion(nil)
                return
            }

            // Format: "City, Country" or "Name, City"
            var parts: [String] = []
            if let name = placemark.name { parts.append(name) }
            if let locality = placemark.locality { parts.append(locality) }
            if let country = placemark.country { parts.append(country) }

            let place = parts.joined(separator: ", ")
            completion(place.isEmpty ? nil : place)
        }
    }
}

// MARK: - CLLocationManagerDelegate

extension LocationService: CLLocationManagerDelegate {
    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        guard let location = locations.last else { return }

        currentLocation = location
        let coords = Coordinates(lat: location.coordinate.latitude, lon: location.coordinate.longitude)

        // Call the one-time callback if exists
        locationCallback?(coords, nil)
        locationCallback = nil

        // Stop updating to save battery
        locationManager.stopUpdatingLocation()
    }

    func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        locationError = error.localizedDescription
        locationCallback?(nil, error)
        locationCallback = nil
    }

    func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
        authorizationStatus = manager.authorizationStatus
    }
}
