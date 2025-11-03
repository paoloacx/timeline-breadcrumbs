// ===== modules/services/gdrive-service.js (NEW FILE) =====

// Imports
import { setCurrentUser, clearCurrentUser } from '../../core/state.js';
// Importamos showMainApp para gestionar la UI
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
 * Enables or disables GDrive sign-in buttons
 * @param {boolean} enable 
 */
function setButtonsDisabled(disabled) {
    const btn1 = document.getElementById('btn-signin-gdrive');
    const btn2 = document.getElementById('btn-tools-signin');
    if (btn1) btn1.disabled = disabled;
    if (btn2) btn2.disabled = disabled;
}

/**
 * Initializes the Google API client and Auth instance.
 * @param {function} onSignIn - Callback when user signs in.
 * @param {function} onSignOut - Callback when user signs out.
 */
export function initGoogleAuth(onSignIn, onSignOut) {
    onSignInCallback = onSignIn;
    onSignOutCallback = onSignOut;
    
    // 1. Load the gapi client
    // Usamos un 'listener' para asegurarnos que gapi está cargado
    const checkGapi = () => {
        if (window.gapi) {
            console.log('gapi loaded.');
            gapi = window.gapi;
            gapi.load('client:auth2', initClient);
        } else {
            console.warn('gapi not loaded yet, retrying...');
            setTimeout(checkGapi, 100);
        }
    };
    checkGapi();
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
        
        // --- NEW: Enable buttons now that auth is ready ---
        setButtonsDisabled(false);
        console.log('Sign-in buttons enabled.');
        
        // Listen for sign-in state changes
        googleAuthInstance.isSignedIn.listen(updateSigninStatus);
        
        // Handle the initial sign-in state
        updateSigninStatus(googleAuthInstance.isSignedIn.get());
    }).catch(error => {
        console.error('Error initializing Google Client:', JSON.stringify(error, null, 2));
        alert('Could not initialize Google Drive sync. (API_KEY or CLIENT_ID might be wrong)');
    });
}

/**
 * (Private) Called when sign-in status changes.
 * @param {boolean} isSignedIn 
 */
function updateSigninStatus(isSignedIn) {
    if (isSignedIn) {
        console.log('GDrive: User is signed in.');
        const user = googleAuthInstance.currentUser.get().getBasicProfile();
        const userProfile = {
            name: user.getName(),
            email: user.getEmail(),
            imageUrl: user.getImageUrl()
        };
        
        setCurrentUser(userProfile);
        updateUiWithUser(userProfile);
        
        if (onSignInCallback) {
            onSignInCallback(userProfile);
        }
    } else {
        console.log('GDrive: User is signed out.');
        clearCurrentUser();
        updateUiWithUser(null); // Limpia la UI
        
        if (onSignOutCallback) {
            onSignOutCallback();
        }
    }
}

/**
 * (Private) Updates the UI elements with user info.
 * @param {object | null} userProfile - Google User Profile object or null
 */
function updateUiWithUser(userProfile) {
    const avatar = document.getElementById('gdrive-user-avatar');
    const icon = document.getElementById('gdrive-user-icon');
    const emailDisplay = document.getElementById('gdrive-user-email');

    if (userProfile) {
        avatar.style.display = 'flex';
        emailDisplay.textContent = userProfile.email;
        icon.innerHTML = ''; // Limpia el emoji '👤'
        const img = document.createElement('img');
        img.src = userProfile.imageUrl;
        img.style.width = '24px';
        img.style.height = '24px';
        img.style.borderRadius = '50%';
        icon.appendChild(img);

        // Oculta el panel de autenticación y muestra la app
        document.getElementById('auth-container').style.display = 'none';
        showMainApp(userProfile); // Esta función ya la teníamos
    } else {
        // Oculta el avatar
        avatar.style.display = 'none';
        emailDisplay.textContent = '';
        icon.innerHTML = '👤'; // Restaura el emoji por defecto
    }
}

/**
 * Triggers the Google Sign-In popup.
 */
export function handleSignIn() {
    if (googleAuthInstance) {
        googleAuthInstance.signIn();
    } else {
        alert('Google Auth is not ready yet. Please wait a moment.');
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
