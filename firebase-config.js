// /firebase-config.js
// This file is now ONLY for initialization and exporting instances.
// All logic (auth, db reads/writes) has been moved to auth.js and api-services.js.

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, enableNetwork, disableNetwork } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAb-MLu8atl5hruOPLDhgftjkjc_1M2038", // IMPORTANT: Add your actual API key
    authDomain: "breadcrumbs-8b59e.firebaseapp.com",
    projectId: "breadcrumbs-8b59e",
    storageBucket: "breadcrumbs-8b59e.firebasestorage.app",
    messagingSenderId: "912286191427", // IMPORTANT: Add your actual Sender ID
    appId: "1:912286191427:web:e78b665df6a6ff6d8529f6" // IMPORTANT: Add your actual App ID
    measurementId: "G-GZYTDYNSRB"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export service instances for other modules to use
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const provider = new GoogleAuthProvider();

// --- Network Controls (kept here as they control the FB instance) ---

/**
 * Disables Firebase network access (Offline Mode).
 */
export function goOffline() {
    disableNetwork(db);
    console.log("Firebase network disabled (Offline Mode).");
}

/**
 * Enables Firebase network access (Online Mode).
 */
export function goOnline() {
    enableNetwork(db);
    console.log("Firebase network enabled (Online Mode).");
}
