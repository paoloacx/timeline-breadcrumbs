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
const DRIVE_FOLDER_NAME = 'Breadcrumbs App Data'; // Nombre de la carpeta
let backupFileId = null; // Almacenará el ID del archivo de backup
let appFolderId = null; // Almacenará el ID de la carpeta

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
 * NEW: Finds or creates the app's dedicated folder in GDrive.
 * @returns {Promise<string|null>} The Folder ID or null on failure.
 */
async function findOrCreateAppFolder() {
    if (appFolderId) return appFolderId; // Return cached ID

    if (!gapi.client) return null;
    
    try {
        // 1. Search for the folder
        const query = `mimeType='application/vnd.google-apps.folder' and name='${DRIVE_FOLDER_NAME}' and trashed=false`;
        const response = await gapi.client.drive.files.list({
            q: query,
            fields: 'files(id, name)'
        });
        
        const files = response.result.files;
        if (files && files.length > 0) {
            console.log(`Found app folder: ${files[0].name} (ID: ${files[0].id})`);
            appFolderId = files[0].id; // Cache the ID
            return appFolderId;
        } else {
            // 2. Not found, create it
            console.log(`No app folder found. Creating '${DRIVE_FOLDER_NAME}'...`);
            const folderMetadata = {
                'name': DRIVE_FOLDER_NAME,
                'mimeType': 'application/vnd.google-apps.folder',
            };
            // Use 'fields' to request the 'id' of the new folder
            const createResponse = await gapi.client.drive.files.create({
                resource: folderMetadata,
                fields: 'id'
            });
            
            console.log('Folder created with ID:', createResponse.result.id);
            appFolderId = createResponse.result.id; // Cache the new ID
            return appFolderId;
        }
    } catch (error) {
        console.error('Error finding or creating app folder:', error);
        return null;
    }
}


/**
 * Finds the 'breadcrumbs_backup.json' file *inside* the app folder.
 * @param {string} folderId - The ID of the app folder.
 * @returns {Promise<string|null>} The file ID or null if not found.
 */
async function findBackupFile(folderId) {
    if (!gapi.client || !folderId) return null;
    
    try {
        // CHANGED: Query now searches *inside* the folderId
        const query = `name='${BACKUP_FILE_NAME}' and '${folderId}' in parents and trashed=false`;
        const response = await gapi.client.drive.files.list({
            q: query,
            fields: 'files(id, name, modifiedTime)'
        });
        
        const files = response.result.files;
        if (files && files.length > 0) {
            console.log(`Found backup file: ${files[0].name} (ID: ${files[0].id})`);
            backupFileId = files[0].id; // Cache the ID
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

/**
 * (Private) Uploads the backup data to Google Drive.
 * Creates a new file or updates an existing one *inside* the app folder.
 * @param {string} data - The stringified JSON data.
 *axp
 * @param {string|null} fileId - The ID of the file to update.
 * @param {string} folderId - The ID of the parent folder.
 */
async function uploadToDrive(data, fileId, folderId) {
    const blob = new Blob([data], { type: 'application/json' });
    
    try {
        if (fileId) {
            // --- Option 1: Update existing file (PATCH) ---
            console.log(`Updating existing file (ID: ${fileId})...`);
            const request = gapi.client.request({
                path: `/upload/drive/v3/files/${fileId}`,
                method: 'PATCH',
                params: { uploadType: 'media' },
                body: blob
            });
            const response = await request;
            console.log('Upload (PATCH) successful:', response.result);
            backupFileId = response.result.id; // Cache the ID
        
        } else {
            // --- Option 2: Create new file (Multipart Upload) ---
            // This method creates and uploads in one go.
            console.log('Creating new backup file...');
            
            const metadata = {
                'name': BACKUP_FILE_NAME,
                'mimeType': 'application/json',
                'parents': [folderId] // <-- Puts it in the correct folder
            };
            
            const form = new FormData();
            form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
            form.append('file', blob);

            const request = gapi.client.request({
                path: '/upload/drive/v3/files',
                method: 'POST',
                params: { uploadType: 'multipart' },
                // We MUST use the FormData object as the body
                body: form
            });
            
            const response = await request;
            console.log('Upload (Multipart Create) successful:', response.result);
            backupFileId = response.result.id; // Cache the ID
        }
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
        // GAPI v3 with alt=media returns the content directly
        // It might be an object (if parsed) or string. We check.
        const result = (typeof response.result === 'object') 
            ? response.result 
            : JSON.parse(response.result);
            
        return result;
    } catch (error) {
        console.error('Error downloading file:', error);
        // Handle case where file is empty (GAPI returns empty string)
        if (error.result && error.result.error.code === 404) {
             console.log('Backup file is empty.');
             return { entries: [], settings: {} }; // Return valid empty structure
        }
        return null;
    }
}

// --- NEW: Public Sync Functions ---

/**
 * Called on login. Checks Drive for a backup and asks user to restore if found.
 */
export async function syncOnLogin() {
    console.log('Sync-on-login started...');
    // 1. Find or create the app folder
    const folderId = await findOrCreateAppFolder();
    if (!folderId) {
        alert('Could not access Google Drive folder. Sync failed.');
        return;
    }

    // 2. Find the backup file inside that folder
    const fileId = await findBackupFile(folderId);
    
    if (!fileId) {
        console.log('No remote backup found. Doing initial backup.');
        // Pass folderId to avoid finding it again
        await manualBackupToDrive(true, folderId); 
        return;
    }
    
    // 3. File exists, download it
    const remoteData = await downloadFromDrive(fileId);
    if (!remoteData) {
        alert('Found a backup file, but could not read it.');
        return;
    }

    // 4. Compare local and remote data
    const localEntries = getState().entries;
    
    // Simple check: if local is empty and remote has data, restore.
    if (localEntries.length === 0 && remoteData.entries && remoteData.entries.length > 0) {
        if (confirm(`Found a backup in Google Drive with ${remoteData.entries.length} entries. Restore it now?`)) {
            // Pass remoteData to avoid downloading again
            await manualRestoreFromDrive(true, remoteData); 
        }
        return;
    }
    
    // TODO: Implement more complex merge logic later (e.g., check modified time)
    console.log('Local and remote data both exist. No automatic action taken.');
}

/**
 * Public function for "Manual Backup" button.
 * Gets local state and uploads it to Drive.
 * @param {boolean} [silent=false] - If true, suppresses the success alert.
 * @param {string|null} [folderId=null] - Optional folderId to skip find/create.
 */
export async function manualBackupToDrive(silent = false, folderId = null) {
    // 1. Get folder ID (use cache, or find/create it)
    const driveFolderId = folderId || appFolderId || await findOrCreateAppFolder();
    if (!driveFolderId) {
        alert('❌ Backup failed. Could not access Google Drive folder.');
        return;
    }
    
    // 2. Get local data
    const { entries, settings } = getState();
    const backupData = {
        version: '1.0.0',
        createdAt: new Date().toISOString(),
        settings: settings,
        entries: entries
    };
    
    // 3. Find existing file ID (use cache, or find it)
    const fileId = backupFileId || await findBackupFile(driveFolderId);
    
    // 4. Upload
    const success = await uploadToDrive(JSON.stringify(backupData), fileId, driveFolderId);
    
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
 * @param {object|null} [remoteData=null] - Optional data to skip download.
 */
export async function manualRestoreFromDrive(force = false, remoteData = null) {
    if (!force) {
        if (!confirm('This will overwrite all local data with the backup from Google Drive. Are you sure?')) {
            return;
        }
    }
    
    // 1. Get data (if not already provided)
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

    // 2. Validate data
    if (!remoteData || !remoteData.entries || !remoteData.settings) {
        alert('❌ Restore failed. The backup file is empty or corrupted.');
        return;
    }
    
    // --- 3. Restore Data ---
    // Update state
    setEntries(remoteData.entries || []);
    setSettings(remoteData.settings || {});
    
    // Save to local storage
    saveData(); // This saves the new entries
    settingsManager.saveSettingsToStorage(); // This saves the new settings
    
    // Re-render all UI components
    renderTimeline();
    settingsManager.updateTimerOptions();
    settingsManager.updateTrackOptions();
    // Re-render mood selector in the (closed) form
    const moodSelector = document.getElementById('mood-selector');
    if (moodSelector) settingsManager.renderMoodSelector();
    
    if (!force) {
        alert(`✅ Restore complete! ${remoteData.entries.length} entries loaded.`);
    }
}
