// ===== modules/services/gdrive-service.js (REWRITTEN for GIS) =====

// Imports
import { setCurrentUser, clearCurrentUser } from '../../core/state.js';
// Importamos showMainApp para gestionar la UI
import { showMainApp } from '../ui/modal-manager.js';

// --- CONFIGURATION ---
const API_KEY = 'AIzaSyAee9UJ3HD8pkR1Fik2UFsUQD8yyxbwjgo'; // Tu API Key
const CLIENT_ID = '605014519509-37up3noc8pprtodo9to35soge15albil.apps.googleusercontent.com'; // Tu Client ID

// --- CHANGED: Added userinfo scopes ---
// We now ask for file access, email, and profile info
const SCOPES = 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile';

// Module-level variables
let gapi = window.gapi;
let google = window.google;
let tokenClient;
let onSignInCallback = null;
let onSignOutCallback = null;

/**
 * Enables or disables GDrive sign-in buttons
 * @param {boolean} disabled 
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

    const checkGapi = () => {
        if (window.gapi) {
            console.log('gapi loaded.');
            gapi = window.gapi;
            gapi.load('client', initGapiClient); // Load the GAPI client
        } else {
            console.warn('gapi not loaded yet, retrying...');
            setTimeout(checkGapi, 100);
        }
    };
    
    const checkGsi = () => {
        if (window.google) {
            console.log('gsi loaded.');
            google = window.google;
            initGsiClient(); // Initialize the GSI client
        } else {
            console.warn('gsi not loaded yet, retrying...');
            setTimeout(checkGsi, 100);
        }
    };
    
    checkGapi();
    checkGsi();
}

/**
 * (Private) Initializes the GAPI client for Drive API calls.
 */
function initGapiClient() {
    gapi.client.init({
        apiKey: API_KEY,
        discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"]
    })
    .then(() => console.log('GAPI client initialized.'))
    .catch(err => console.error('Error initializing GAPI client:', err));
}

/**
 * (Private) Initializes the GSI client for Auth tokens.
 */
function initGsiClient() {
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: tokenClientCallback, // Function to call after token is received
        error_callback: (error) => {
            console.error('GSI Token Client Error:', error);
        }
    });
    
    // Auth is ready, enable buttons
    setButtonsDisabled(false);
    console.log('GSI client initialized. Sign-in buttons enabled.');
}

/**
 * (Private) Callback for after the user signs in via the GIS popup.
 * @param {object} tokenResponse 
 */
function tokenClientCallback(tokenResponse) {
    if (tokenResponse.error) {
        console.error('Token Error:', tokenResponse.error);
        return;
    }
    
    console.log('GDrive: User has granted token.');
    
    // Set the token for gapi to use
    gapi.client.setToken({ access_token: tokenResponse.access_token });
    
    // Now that we have a token, fetch user's profile info
    gapi.client.request({
        'path': 'https://www.googleapis.com/oauth2/v3/userinfo'
    }).execute((userInfo) => {
        if (userInfo.error) {
            // This is where the 403 error happened
            console.error('Error fetching user info:', userInfo);
            return;
        }
        
        const userProfile = {
            name: userInfo.name,
            email: userInfo.email,
            imageUrl: userInfo.picture
        };
        
        console.log('GDrive: User info fetched:', userProfile.email);
        
        setCurrentUser(userProfile);
        updateUiWithUser(userProfile);
        
        if (onSignInCallback) {
            onSignInCallback(userProfile);
        }
    });
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
    if (tokenClient) {
        // This prompts the user for consent and gets the token
        tokenClient.requestAccessToken();
    } else {
        alert('Google Auth is not ready yet. Please wait a moment.');
    }
}

/**
 * Triggers the Google Sign-Out.
 */
export function handleSignOut() {
    const token = gapi.client.getToken();
    if (token) {
        google.accounts.oauth2.revoke(token.access_token, () => {
            console.log('GDrive: Token revoked.');
        });
        gapi.client.setToken(null);
    }
    
    // Manually trigger the sign-out flow
    clearCurrentUser();
    updateUiWithUser(null);
    if (onSignOutCallback) {
        onSignOutCallback();
    }
}
