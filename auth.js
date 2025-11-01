// /auth.js
// Handles all Firebase authentication logic.

import { auth, provider } from './firebase-config.js';
import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { setState } from './state-manager.js';
import { loadDataFromFirebase, loadSettingsFromFirebase } from './api-services.js';
import { loadData } from './crud-handlers.js';
import { loadSettings } from './settings-manager.js';
import { renderAuthUI, showLoading, hideLoading } from './ui-renderer.js';

/**
 * Initializes the authentication listener.
 * This runs on app startup.
 */
export function initAuthListener() {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            // User is signed in
            setState({ currentUser: user, isOfflineMode: false });
            showLoading("Syncing data...");
            
            // Load cloud data
            Promise.all([
                loadDataFromFirebase(),
                loadSettingsFromFirebase()
            ]).then(() => {
                hideLoading();
                alert('✅ Synced with cloud!');
            }).catch((error) => {
                console.error("Error syncing from Firebase:", error);
                hideLoading();
                alert('🚨 Error syncing data. Check console.');
            });

        } else {
            // User is signed out
            setState({ currentUser: null, isOfflineMode: true });
            
            // Load local data
            loadSettings();
            loadData();
            console.log("User is signed out. Running in offline mode.");
        }
        // Update the UI to show/hide login/logout buttons
        renderAuthUI(user);
    });
}

/**
 * Starts the Google Sign-In popup flow.
 */
export function signInWithGoogle() {
    signInWithPopup(auth, provider)
        .then((result) => {
            // This will be handled by the onAuthStateChanged listener,
            // but we can log success here.
            console.log("Sign-in successful", result.user.displayName);
        }).catch((error) => {
            console.error("Google Sign-In Error:", error);
            alert(`Error signing in: ${error.message}`);
        });
}

/**
 * Signs the current user out.
 */
export function signOutUser() {
    if (confirm("Sign out and go to offline mode?")) {
        signOut(auth).then(() => {
            // This will be handled by the onAuthStateChanged listener.
            console.log("Sign-out successful.");
            // We force a reload to clear all state and go to local
            location.reload();
        }).catch((error) => {
            console.error("Sign-Out Error:", error);
        });
    }
}
