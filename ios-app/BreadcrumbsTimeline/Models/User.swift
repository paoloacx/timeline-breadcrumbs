//
//  User.swift
//  BreadcrumbsTimeline
//
//  User model for Google Drive authentication
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
}
