//
//  AuthView.swift
//  BreadcrumbsTimeline
//
//  Authentication view (equivalent to auth-container in web)
//

import SwiftUI

struct AuthView: View {
    @EnvironmentObject var appState: AppState

    var body: some View {
        VStack(spacing: 20) {
            Spacer()

            // Logo/Title
            VStack(spacing: 8) {
                Image(systemName: "mappin.and.ellipse")
                    .font(.system(size: 60))
                    .foregroundColor(.black)

                Text("Breadcrumbs Timeline")
                    .font(.custom("Courier", size: 24))
                    .fontWeight(.bold)

                Text("Sign in to sync your data")
                    .font(.custom("Courier", size: 12))
                    .foregroundColor(.gray)
            }

            Spacer()

            // Sign in button
            Button(action: {
                // TODO: Implement Google Drive sign in
                print("Google Drive sign in")
            }) {
                HStack {
                    Image(systemName: "lock.fill")
                    Text("Sign in with Google Drive")
                }
                .font(.custom("Courier", size: 16))
                .fontWeight(.bold)
                .foregroundColor(.white)
                .frame(maxWidth: .infinity)
                .padding()
                .background(Color.blue)
                .overlay(
                    RoundedRectangle(cornerRadius: 0)
                        .stroke(Color.black, lineWidth: 3)
                )
            }
            .padding(.horizontal, 40)

            // Or continue offline
            VStack(spacing: 8) {
                Text("Or continue without account")
                    .font(.custom("Courier", size: 11))
                    .foregroundColor(.gray)

                Text("(data saved locally only)")
                    .font(.custom("Courier", size: 10))
                    .foregroundColor(.gray)

                Button(action: {
                    appState.setOfflineMode(true)
                    appState.showAuthPanel = false
                }) {
                    Text("Continue Offline")
                        .font(.custom("Courier", size: 11))
                        .fontWeight(.bold)
                }
                .macButtonStyle()
            }

            Spacer()
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color(hex: "f0f0f0"))
    }
}

struct AuthView_Previews: PreviewProvider {
    static var previews: some View {
        AuthView()
            .environmentObject(AppState.shared)
    }
}
