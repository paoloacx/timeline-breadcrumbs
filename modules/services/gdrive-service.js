// ===== modules/services/gdrive-service.js (REWRITTEN for GIS) =====

// Imports
// CAMBIO: Importar el state completo y funciones de storage/UI
import { getState, setCurrentUser, clearCurrentUser, setEntries, setSettings } from '../../core/state.js';
import { saveData } from '../../core/storage.js';
import * as settingsManager from '../settings/settings-manager.js';
import { renderTimeline } from '../timeline/timeline.js';
import { showMainApp } from '../ui/modal-manager.js';

// --- CONFIGURATION ---
const API_KEY = 'AIzaSyAee9UJ3HD8pkR1Fik2UFsUQD8yyxbwjgo'; // Tu API Key
const CLIENT_ID = '605014519509-37up3noc8pprtodo9to35soge15albil.apps.googleusercontent.com'; // Tu Client ID

// --- CHANGED: Added userinfo scopes ---
// We now ask for file access, email, and profile info
const SCOPES = 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile';

// --- NEW: Constants for Drive file ---
const BACKUP_FILE_NAME = 'breadcrumbs_backup.json';
const DRIVE_FOLDER_NAME = 'Breadcrumbs App Data'; // Opcional, pero recomendado
let backupFileId = null; // Almacenará el ID del archivo de backup

// Module-level variables
let gapi = window.gapi;
let google = window.google;
let tokenClient;
let onSignInCallback = null;
let onSignOutCallback = null;

// --- Auth Functions (Existentes) ---

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
async function tokenClientCallback(tokenResponse) { // --- CHANGED: Made async ---
    if (tokenResponse.error) {
        console.error('Token Error:', tokenResponse.error);
        return;
    }
    
    console.log('GDrive: User has granted token.');
    
    // Set the token for gapi to use in future Drive calls
    gapi.client.setToken({ access_token: tokenResponse.access_token });
    
    // --- CHANGED: Use 'fetch' to get user info WITH the token ---
    try {
        const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: {
                'Authorization': `Bearer ${tokenResponse.access_token}`
            }
        });

        if (!response.ok) {
            // Manually throw an error if the response was bad
            throw new Error(`Failed to fetch user info: ${response.status} ${response.statusText}`);
        }

        const userInfo = await response.json();

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
        
    } catch (error) {
        console.error('Error fetching user info:', error);
        alert('Error getting user profile. Please try again.');
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


// --- NEW: GDrive File Operations ---

/**
 * Finds the 'breadcrumbs_backup.json' file in the user's Drive.
 * We use 'drive.file' scope, so we can only see files this app created.
 * @returns {Promise<string|null>} The file ID or null if not found.
 */
async function findBackupFile() {
    if (!gapi.client) return null;
    
    try {
        const response = await gapi.client.drive.files.list({
            // 'appDataFolder' space is hidden from user, 'drive' space is visible.
            // Since we use 'drive.file' scope, it's better to use 'drive' space.
            spaces: 'drive', 
            // q: `name='${BACKUP_FILE_NAME}' and trashed=false`, // This query seems to fail with drive.file scope
            q: `name='${BACKUP_FILE_NAME}' and trashed=false`,
            fields: 'files(id, name, modifiedTime)'
        });
        
        const files = response.result.files;
        if (files && files.length > 0) {
            console.log(`Found backup file: ${files[0].name} (ID: ${files[0].id})`);
            backupFileId = files[0].id; // Cache the ID
            return files[0].id;
        } else {
            console.log('No backup file found.');
            return null;
        }
    } catch (error) {
        console.error('Error finding backup file:', error);
        return null;
    }
}

/**
 * (Private) Uploads the backup data to Google Drive.
 * Creates a new file or updates an existing one.
 * @param {string} data - The stringified JSON data.
 * @param {string|null} fileId - The ID of the file to update, or null to create new.
 */
async function uploadToDrive(data, fileId) {
    const metadata = {
        'name': BACKUP_FILE_NAME,
        'mimeType': 'application/json'
    };
    
    const blob = new Blob([data], { type: 'application/json' });
    
    let request;
    if (fileId) {
        // Update existing file
        console.log(`Updating existing file (ID: ${fileId})...`);
        request = gapi.client.request({
            path: `/upload/drive/v3/files/${fileId}`,
            method: 'PATCH',
            params: { uploadType: 'media' },
            body: blob
        });
    } else {
        // Create new file
        console.log('Creating new backup file...');
        metadata.parents = ['root']; // 'root' or a specific folder ID
        
        const form = new FormData();
        form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
        form.append('file', blob);

        request = gapi.client.request({
            path: '/upload/drive/v3/files',
            method: 'POST',
            params: { uploadType: 'multipart' },
            body: form
        });
    }

    try {
        const response = await request;
        console.log('Upload successful:', response.result);
        backupFileId = response.result.id; // Cache the new/updated ID
        return true;
    } catch (error) {
        console.error('Error uploading file:', error);
        return false;
    }
}

/**
 * (Private) Downloads the backup file content from Google Drive.
 * @param {string} fileId - The ID of the file to download.
 * @returns {Promise<object|null>} The parsed JSON data or null on failure.
 */
async function downloadFromDrive(fileId) {
    if (!fileId) return null;
    try {
        const response = await gapi.client.drive.files.get({
            fileId: fileId,
            alt: 'media'
        });
        
        console.log('Download successful.');
        return response.result; // This is already parsed JSON
    } catch (error) {
        console.error('Error downloading file:', error);
        return null;
    }
}

// --- NEW: Public Sync Functions ---

/**
 * Called on login. Checks Drive for a backup and asks user to restore if found.
 */
export async function syncOnLogin() {
    console.log('Sync-on-login started...');
    const fileId = await findBackupFile();
    
    if (!fileId) {
        console.log('No remote backup found. Doing initial backup.');
        await manualBackupToDrive(true); // 'true' for silent backup
        return;
    }
    
    const remoteData = await downloadFromDrive(fileId);
    if (!remoteData) {
        alert('Found a backup file, but could not read it.');
        return;
    }

    // Compare local and remote data
    const localEntries = getState().entries;
    
    // Simple check: if local is empty and remote has data, restore.
    if (localEntries.length === 0 && remoteData.entries.length > 0) {
        if (confirm(`Found a backup in Google Drive with ${remoteData.entries.length} entries. Restore it now?`)) {
            await manualRestoreFromDrive(true); // 'true' for silent restore
        }
        return;
    }
    
    // TODO: Implement more complex merge logic later if needed.
    // For now, if both have data, we assume local is "master" until user restores.
    console.log('Local and remote data both exist. No automatic action taken.');
}

/**
 * Public function for "Manual Backup" button.
 * Gets local state and uploads it to Drive.
 * @param {boolean} [silent=false] - If true, suppresses the success alert.
 */
export async function manualBackupToDrive(silent = false) {
    const { entries, settings } = getState();
    const backupData = {
        version: '1.0.0',
        createdAt: new Date().toISOString(),
        settings: settings,
        entries: entries
    };
    
    const fileId = backupFileId || await findBackupFile();
    const success = await uploadToDrive(JSON.stringify(backupData), fileId);
    
    if (success && !silent) {
        alert('✅ Manual backup to Google Drive complete!');
    } else if (!success && !silent) {
        alert('❌ Backup failed. Check console for errors.');
    }
}

/**
 * Public function for "Restore" button.
 * Downloads from Drive and overwrites local state.
 * @param {boolean} [force=false] - If true, skips the confirmation prompt.
 */
export async function manualRestoreFromDrive(force = false) {
    if (!force) {
        if (!confirm('This will overwrite all local data with the backup from Google Drive. Are you sure?')) {
            return;
        }
    }
    
    const fileId = backupFileId || await findBackupFile();
    if (!fileId) {
        alert('No backup file found in Google Drive.');
        return;
    }
    
    const remoteData = await downloadFromDrive(fileId);
    if (!remoteData || !remoteData.entries || !remoteData.settings) {
        alert('❌ Restore failed. The backup file is empty or corrupted.');
        return;
    }
    
    // --- Restore Data ---
    // 1. Update state
    setEntries(remoteData.entries);
    setSettings(remoteData.settings);
    
    // 2. Save to local storage
    saveData(); // This saves the new entries
    settingsManager.saveSettingsToStorage(); // This saves the new settings
    
    // 3. Re-render UI
    renderTimeline();
    settingsManager.updateTimerOptions();
    settingsManager.updateTrackOptions();
    settingsManager.renderMoodSelector();
    
    if (!force) {
        alert(`✅ Restore complete! ${remoteData.entries.length} entries loaded.`);
    }
}
