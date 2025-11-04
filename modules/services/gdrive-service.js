// ===== modules/services/gdrive-service.js (REWRITTEN for REDIRECT) =====

// Imports
import { getState, setCurrentUser, clearCurrentUser, setEntries, setSettings } from '../../core/state.js';
import { saveData } from '../../core/storage.js';
import * as settingsManager from '../settings/settings-manager.js';
import { renderTimeline } from '../timeline/timeline.js';
import { showMainApp } from '../ui/modal-manager.js';

// --- CONFIGURATION ---
const API_KEY = 'AIzaSyAee9UJ3HD8pkR1Fik2UFsUQD8yyxbwjgo'; // Tu API Key
const CLIENT_ID = '605014519509-37up3noc8pprtodo9to35soge15albil.apps.googleusercontent.com'; // Tu Client ID
const SCOPES = 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile';
// --- NEW: Redirect URI must match Google Console EXACTLY ---
const REDIRECT_URI = 'https://paoloacx.github.io/timeline-breadcrumbs/'; 

// --- NEW: Constants for Drive file ---
const BACKUP_FILE_NAME = 'breadcrumbs_backup.json';
const DRIVE_FOLDER_NAME = 'Breadcrumbs App Data';
let backupFileId = null;
let appFolderId = null;

// Module-level variables
let gapi = window.gapi;
let google = window.google;
// --- CHANGED: We now use a 'Code' client ---
let codeClient; 
let onSignInCallback = null;
let gapiClientReady = null;

// --- Token Persistence ---
const TOKEN_STORAGE_KEY = 'gdrive_access_token';
const TOKEN_EXPIRY_KEY = 'gdrive_token_expiry';

function saveToken(token, expiresIn) {
    const expiryTime = Date.now() + (expiresIn * 1000);
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
    localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
    console.log('Token saved to localStorage');
}

function loadToken() {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
    
    if (!token || !expiry) {
        return null;
    }
    
    if (Date.now() > parseInt(expiry)) {
        console.log('Stored token expired');
        clearToken();
        return null;
    }
    
    console.log('Valid token found in localStorage');
    return token;
}

function clearToken() {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
    console.log('Token cleared from localStorage');
} 

// --- NEW: Function definition was missing ---
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
 */
export function initGoogleAuth(onSignIn) {
    onSignInCallback = onSignIn;

    // 1. Load GAPI (for Drive API)
    const checkGapi = () => {
        if (window.gapi) {
            console.log('gapi loaded.');
            gapi = window.gapi;
            gapiClientReady = gapi.load('client', initGapiClient); 
        } else {
            console.warn('gapi not loaded yet, retrying...');
            setTimeout(checkGapi, 100);
        }
    };
    
    // 2. Load GSI (for Auth)
    const checkGsi = () => {
        if (window.google) {
            console.log('gsi loaded.');
            google = window.google;
            initGsiClient();
        } else {
            console.warn('gsi not loaded yet, retrying...');
            setTimeout(checkGsi, 100);
        }
    };
    
    checkGapi();
    checkGsi();
}

/**
 * NEW: Attempts to restore session from saved token.
 * @returns {Promise<boolean>} True if session restored successfully
 */
export async function tryRestoreSession() {
    const savedToken = loadToken();
    if (!savedToken) {
        console.log('No saved token found');
        return false;
    }
    
    console.log('Attempting to restore session from saved token...');
    
    try {
        // Wait for GAPI to be ready
        await gapiClientReady;
        
        // Set the token
        gapi.client.setToken({ access_token: savedToken });
        
        // Verify token by fetching user info
        const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { 'Authorization': `Bearer ${savedToken}` }
        });
        
        if (!response.ok) {
            console.log('Saved token is invalid');
            clearToken();
            return false;
        }
        
        const userInfo = await response.json();
        const userProfile = {
            name: userInfo.name,
            email: userInfo.email,
            imageUrl: userInfo.picture
        };
        
        console.log('Session restored successfully:', userProfile.email);
        setCurrentUser(userProfile);
        updateUiWithUser(userProfile);
        
        if (onSignInCallback) {
            onSignInCallback(userProfile);
        }
        
        return true;
    } catch (error) {
        console.error('Error restoring session:', error);
        clearToken();
        return false;
    }
}

/**
 * (Private) Initializes the GAPI client for Drive API calls.
 */
function initGapiClient() {
    return gapi.client.init({
        apiKey: API_KEY,
        discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"]
    })
    .then(() => gapi.client.load('drive', 'v3'))
    .then(() => console.log('GAPI client *and* Drive API v3 loaded.'))
    .catch(err => console.error('Error initializing GAPI client or Drive API:', err));
}

/**
 * (Private) Initializes the GSI client for Auth tokens.
 */
function initGsiClient() {
    // --- CHANGED: Using initCodeClient for redirect flow ---
    codeClient = google.accounts.oauth2.initCodeClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        ux_mode: 'redirect', // <-- This is the key change
        redirect_uri: REDIRECT_URI,
        callback: (response) => {
            // This callback is NOT used in redirect flow.
            // The response is handled by app.js on page load.
        },
        error_callback: (error) => {
            console.error('GSI Code Client Error:', error);
        }
    });
    
    console.log('GSI (redirect) client initialized.');
    setButtonsDisabled(false); // Enable buttons
}

/**
 * NEW: Handles the auth code returned from the redirect.
 * This is called by app.js if a code is in the URL.
 * @param {string} code - The authorization code from Google.
 */
export async function handleRedirectResult(code) {
    console.log('GDrive: Handling redirect result...');
    
    // Wait for google to be ready
    const waitForGoogle = () => {
        return new Promise((resolve) => {
            const checkGoogle = () => {
                if (window.google && window.google.accounts) {
                    google = window.google;
                    resolve();
                } else {
                    setTimeout(checkGoogle, 100);
                }
            };
            checkGoogle();
        });
    };
    
    try {
        await waitForGoogle();
        console.log('GDrive: Google SDK ready for token exchange.');
        
        // 1. Exchange the code for an access token
        const tokenResponse = await new Promise((resolve, reject) => {
            const client = google.accounts.oauth2.initTokenClient({
                client_id: CLIENT_ID,
                scope: SCOPES,
                redirect_uri: REDIRECT_URI,
                callback: (token) => token.error ? reject(token) : resolve(token),
            });
            client.requestAccessToken({ code: code });
        });

        console.log('GDrive: Access token received.');
        
        // Save token with expiry (default 3600 seconds = 1 hour)
        const expiresIn = tokenResponse.expires_in || 3600;
        saveToken(tokenResponse.access_token, expiresIn);
        
        // Wait for GAPI to be ready
        await gapiClientReady;
        gapi.client.setToken({ access_token: tokenResponse.access_token });
        
        // 2. Fetch user info
        const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { 'Authorization': `Bearer ${tokenResponse.access_token}` }
        });
        if (!response.ok) throw new Error('Failed to fetch user info');
        
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
        console.error('Error handling auth redirect:', error);
        alert('Error signing in. Please try again.');
        window.history.replaceState({}, document.title, window.location.pathname);
        document.getElementById('auth-container').style.display = 'block';
    }
}


/**
 * (Private) Updates the UI elements with user info.
 * @param {object | null} userProfile - Google User Profile object or null
 */
function updateUiWithUser(userProfile) {
    // (This function remains the same as before)
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
        document.getElementById('auth-container').style.display = 'none';
        showMainApp(userProfile);
    } else {
        avatar.style.display = 'none';
        emailDisplay.textContent = '';
        icon.innerHTML = '👤';
    }
}

/**
 * Triggers the Google Sign-In redirect.
 */
export function handleSignIn() {
    if (codeClient) {
        // This navigates the user *away* to Google
        codeClient.requestCode();
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
    
    clearToken();
    clearCurrentUser();
    updateUiWithUser(null);
    window.location.reload();
}


// --- GDrive File Operations (Funciones corregidas) ---

async function findOrCreateAppFolder() {
    await gapiClientReady;
    if (appFolderId) return appFolderId;
    if (!gapi.client || !gapi.client.drive) {
         console.error('GAPI client or drive service not loaded.');
         return null;
    }
    try {
        const query = `mimeType='application/vnd.google-apps.folder' and name='${DRIVE_FOLDER_NAME}' and trashed=false`;
        const response = await gapi.client.drive.files.list({
            q: query,
            fields: 'files(id, name)'
        });
        const files = response.result.files;
        if (files && files.length > 0) {
            console.log(`Found app folder: ${files[0].name} (ID: ${files[0].id})`);
            appFolderId = files[0].id;
            return appFolderId;
        } else {
            console.log(`No app folder found. Creating '${DRIVE_FOLDER_NAME}'...`);
            const folderMetadata = {
                'name': DRIVE_FOLDER_NAME,
                'mimeType': 'application/vnd.google-apps.folder',
            };
            const createResponse = await gapi.client.drive.files.create({
                resource: folderMetadata,
                fields: 'id'
            });
            console.log('Folder created with ID:', createResponse.result.id);
            appFolderId = createResponse.result.id;
            return appFolderId;
        }
    } catch (error) {
        console.error('Error finding or creating app folder:', error);
        return null;
    }
}

async function findBackupFile(folderId) {
    await gapiClientReady;
    if (!gapi.client || !folderId) return null;
    try {
        const query = `name='${BACKUP_FILE_NAME}' and '${folderId}' in parents and trashed=false`;
        const response = await gapi.client.drive.files.list({
            q: query,
            fields: 'files(id, name, modifiedTime)'
        });
        const files = response.result.files;
        if (files && files.length > 0) {
            console.log(`Found backup file: ${files[0].name} (ID: ${files[0].id})`);
            backupFileId = files[0].id;
            return files[0].id;
        } else {
            console.log('No backup file found in app folder.');
            return null;
        }
    } catch (error) {
        console.error('Error finding backup file:', error);
        return null;
    }
}

async function uploadToDrive(data, fileId, folderId) {
    await gapiClientReady;
    
    try {
        let targetFileId = fileId;
        
        if (!targetFileId) {
            console.log(`Creating new file: '${BACKUP_FILE_NAME}'...`);
            const metadata = {
                'name': BACKUP_FILE_NAME,
                'mimeType': 'application/json',
                'parents': [folderId]
            };
            
            // Create file with content in one request using multipart upload
            const boundary = '-------314159265358979323846';
            const delimiter = "\r\n--" + boundary + "\r\n";
            const close_delim = "\r\n--" + boundary + "--";
            
            const multipartRequestBody =
                delimiter +
                'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
                JSON.stringify(metadata) +
                delimiter +
                'Content-Type: application/json\r\n\r\n' +
                data +
                close_delim;
            
            const request = gapi.client.request({
                path: '/upload/drive/v3/files',
                method: 'POST',
                params: { uploadType: 'multipart' },
                headers: {
                    'Content-Type': 'multipart/related; boundary="' + boundary + '"'
                },
                body: multipartRequestBody
            });
            
            const response = await request;
            targetFileId = response.result.id;
            backupFileId = targetFileId;
            console.log(`File created with ID: ${targetFileId}`);
        } else {
            console.log(`Updating existing file (ID: ${targetFileId})...`);
            
            // Update existing file content
            const boundary = '-------314159265358979323846';
            const delimiter = "\r\n--" + boundary + "\r\n";
            const close_delim = "\r\n--" + boundary + "--";
            
            const multipartRequestBody =
                delimiter +
                'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
                '{}' +
                delimiter +
                'Content-Type: application/json\r\n\r\n' +
                data +
                close_delim;
            
            const request = gapi.client.request({
                path: `/upload/drive/v3/files/${targetFileId}`,
                method: 'PATCH',
                params: { uploadType: 'multipart' },
                headers: {
                    'Content-Type': 'multipart/related; boundary="' + boundary + '"'
                },
                body: multipartRequestBody
            });
            
            await request;
        }
        
        console.log('Upload successful!');
        return true;
    } catch (error) {
        console.error('Error uploading file:', error);
        return false;
    }
}

async function downloadFromDrive(fileId) {
    await gapiClientReady;
    if (!fileId) return null;
    try {
        const response = await gapi.client.drive.files.get({
            fileId: fileId,
            alt: 'media'
        });
        console.log('Download successful.');
        const result = (typeof response.result === 'object') 
            ? response.result 
            : JSON.parse(response.result);
        return result;
    } catch (error) {
        console.error('Error downloading file:', error);
        if (!error.result) {
             console.log('Backup file is empty.');
             return { entries: [], settings: {} };
        }
        return null;
    }
}

export async function syncOnLogin() {
    console.log('Sync-on-login started...');
    const folderId = await findOrCreateAppFolder();
    if (!folderId) {
        alert('Could not access Google Drive folder. Sync failed.');
        return;
    }
    const fileId = await findBackupFile(folderId);
    if (!fileId) {
        console.log('No remote backup found. Doing initial backup.');
        await manualBackupToDrive(true, folderId); 
        return;
    }
    const remoteData = await downloadFromDrive(fileId);
    if (!remoteData) {
        alert('Found a backup file, but could not read it.');
        return;
    }
    const localEntries = getState().entries;
    if (localEntries.length === 0 && remoteData.entries && remoteData.entries.length > 0) {
        if (confirm(`Found a backup in Google Drive with ${remoteData.entries.length} entries. Restore it now?`)) {
            await manualRestoreFromDrive(true, remoteData); 
        }
        return;
    }
    console.log('Local and remote data both exist. No automatic action taken.');
}

export async function manualBackupToDrive(silent = false, folderId = null) {
    const driveFolderId = folderId || appFolderId || await findOrCreateAppFolder();
    if (!driveFolderId) {
        alert('❌ Backup failed. Could not access Google Drive folder.');
        return;
    }
    const { entries, settings } = getState();
    const backupData = {
        version: '1.0.0',
        createdAt: new Date().toISOString(),
        settings: settings,
        entries: entries
    };
    const fileId = backupFileId || await findBackupFile(driveFolderId);
    const success = await uploadToDrive(JSON.stringify(backupData), fileId, driveFolderId);
    if (success && !silent) {
        alert('✅ Manual backup to Google Drive complete!');
    } else if (!success && !silent) {
        alert('❌ Backup failed. Check console for errors.');
    }
}

export async function manualRestoreFromDrive(force = false, remoteData = null) {
    if (!force) {
        if (!confirm('This will overwrite all local data with the backup from Google Drive. Are you sure?')) {
            return;
        }
    }
    if (!remoteData) {
        const folderId = appFolderId || await findOrCreateAppFolder();
        if (!folderId) {
             alert('❌ Restore failed. Could not access Google Drive folder.');
             return;
        }
        const fileId = backupFileId || await findBackupFile(folderId);
        if (!fileId) {
            alert('No backup file found in Google Drive.');
            return;
        }
        remoteData = await downloadFromDrive(fileId);
    }
    if (!remoteData || !remoteData.entries || !remoteData.settings) {
        alert('❌ Restore failed. The backup file is empty or corrupted.');
        return;
    }
    setEntries(remoteData.entries || []);
    setSettings(remoteData.settings || {});
    saveData(); 
    settingsManager.saveSettingsToStorage(); 
    renderTimeline();
    settingsManager.updateTimerOptions();
    settingsManager.updateTrackOptions();
    const moodSelector = document.getElementById('mood-selector');
    if (moodSelector) settingsManager.renderMoodSelector(); 
    if (!force) {
        alert(`✅ Restore complete! ${remoteData.entries.length} entries loaded.`);
    }
}
