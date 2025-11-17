//
//  User.swift
//  BreadcrumbsTimeline
//
//  User model for iCloud authentication (uses Apple ID)
//

import Foundation

struct User: Codable, Equatable {
    let name: String
    let email: String
    let imageUrl: String?

    init(name: String, email: String, imageUrl: String? = nil) {
        self.name = name
        self.email = email
        self.imageUrl = imageUrl
    }

    // Create user from iCloud (Apple ID)
    static func fromiCloud(name: String?, email: String?) -> User {
        return User(
            name: name ?? "iCloud User",
            email: email ?? "Signed in with iCloud",
            imageUrl: nil
        )
    }
}
