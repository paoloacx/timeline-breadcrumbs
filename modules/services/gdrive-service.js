// ===== modules/services/gdrive-service.js (NEW FILE) =====

// Imports
import { setCurrentUser } from '../../core/state.js';
import { showMainApp } from '../ui/modal-manager.js';

// --- CONFIGURATION ---
// !! DEBES RELLENAR ESTO con tus credenciales de Google Cloud Console !!
const API_KEY = 'AIzaSyAee9UJ3HD8pkR1Fik2UFsUQD8yyxbwjgo';
const CLIENT_ID = '605014519509-37up3noc8pprtodo9to35soge15albil.apps.googleusercontent.com';

// Scopes: Ver y administrar archivos creados por esta app.
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

let gapi = window.gapi;
let googleAuthInstance = null;
let onSignInCallback = null;
let onSignOutCallback = null;

/**
 * Initializes the Google API client and Auth instance.
 * @param {function} onSignIn - Callback when user signs in.
 * @param {function} onSignOut - Callback when user signs out.
 */
export function initGoogleAuth(onSignIn, onSignOut) {
    onSignInCallback = onSignIn;
    onSignOutCallback = onSignOut;
    
    // 1. Load the gapi client
    gapi.load('client:oauth2', initClient);
}

/**
 * (Private) Initializes the API client and sets up the listener.
 */
function initClient() {
    gapi.client.init({
        apiKey: API_KEY,
        clientId: CLIENT_ID,
        scope: SCOPES,
        discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"]
    }).then(() => {
        console.log('Google API Client initialized.');
        googleAuthInstance = gapi.auth2.getAuthInstance();
        
        // Listen for sign-in state changes
        googleAuthInstance.isSignedIn.listen(updateSigninStatus);
        
        // Handle the initial sign-in state
        updateSigninStatus(googleAuthInstance.isSignedIn.get());
    }).catch(error => {
        console.error('Error initializing Google Client:', error);
        alert('Could not initialize Google Drive sync. Please check API keys.');
    });
}

/**
 * (Private) Called when sign-in status changes.
 * @param {boolean} isSignedIn 
 */
function updateSigninStatus(isSignedIn) {
    if (isSignedIn) {
        const user = googleAuthInstance.currentUser.get().getBasicProfile();
        const userProfile = {
            name: user.getName(),
            email: user.getEmail(),
            imageUrl: user.getImageUrl()
        };
        
        updateUiWithUser(userProfile);
        
        if (onSignInCallback) {
            onSignInCallback(userProfile);
        }
    } else {
        if (onSignOutCallback) {
            onSignOutCallback();
        }
    }
}

/**
 * (Private) Updates the UI elements with user info.
 * @param {object} userProfile - Google User Profile object
 */
function updateUiWithUser(userProfile) {
    document.getElementById('gdrive-user-avatar').style.display = 'flex';
    document.getElementById('gdrive-user-email').textContent = userProfile.email;
    document.getElementById('gdrive-user-icon').textContent = ''; // Clear emoji
    const img = document.createElement('img');
    img.src = userProfile.imageUrl;
    img.style.width = '24px';
    img.style.height = '24px';
    img.style.borderRadius = '50%';
    document.getElementById('gdrive-user-icon').appendChild(img);

    // Hide auth panel, show app
    document.getElementById('auth-container').style.display = 'none';
}

/**
 * Triggers the Google Sign-In popup.
 */
export function handleSignIn() {
    if (googleAuthInstance) {
        googleAuthInstance.signIn();
    }
}

/**
 * Triggers the Google Sign-Out.
 */
export function handleSignOut() {
    if (googleAuthInstance) {
        googleAuthInstance.signOut();
    }
}
