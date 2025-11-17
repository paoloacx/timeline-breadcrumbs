//
//  MapView.swift
//  BreadcrumbsTimeline
//
//  Apple Maps view using MapKit (replaces Leaflet)
//

import SwiftUI
import MapKit

struct MapView: View {
    let coordinates: Coordinates
    let isInteractive: Bool

    @State private var region: MKCoordinateRegion

    init(coordinates: Coordinates, isInteractive: Bool = true) {
        self.coordinates = coordinates
        self.isInteractive = isInteractive

        _region = State(initialValue: MKCoordinateRegion(
            center: coordinates.clCoordinate,
            span: MKCoordinateSpan(latitudeDelta: 0.01, longitudeDelta: 0.01)
        ))
    }

    var body: some View {
        Map(coordinateRegion: .constant(region),
            interactionModes: isInteractive ? .all : [],
            annotationItems: [coordinates]) { coord in
            MapMarker(coordinate: coord.clCoordinate, tint: .red)
        }
        .frame(height: 200)
        .overlay(
            Rectangle()
                .stroke(Color.black, lineWidth: 2)
        )
        .disabled(!isInteractive)
    }
}

// Make Coordinates identifiable for Map
extension Coordinates: Identifiable {
    var id: String {
        "\(lat),\(lon)"
    }
}

// MARK: - Mini Map (for forms)

struct MiniMapView: View {
    let coordinates: Coordinates

    var body: some View {
        MapView(coordinates: coordinates, isInteractive: false)
            .frame(height: 150)
    }
}

struct MapView_Previews: PreviewProvider {
    static var previews: some View {
        MapView(
            coordinates: Coordinates(lat: 40.7128, lon: -74.0060),
            isInteractive: true
        )
        .padding()
    }
}
