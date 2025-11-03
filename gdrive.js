/*
 * gdrive.js (v5.1 - FIXED)
 * Módulo para backup y restore en Google Drive
 * BUGS ARREGLADOS: persistencia de token, manejo de errores
 */

// --- Configuración ---
const CLIENT_ID = '360961314777-27a79o8blr5usg3qpqblrv5jckq5278v.apps.googleusercontent.com';
const SCOPES = 'https://www.googleapis.com/auth/drive.file';
const DISCOVERY_DOCS = ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'];

const BACKUP_FILENAME = 'ephemerides_backup.json';
const BACKUP_FOLDER_NAME = 'Ephemerides';

// --- Estado ---
let isGapiLoaded = false;
let isGisLoaded = false;
let tokenClient = null;
let accessToken = null;
let tokenRefreshTimer = null;

// --- Inicialización ---

/**
 * Carga los scripts de Google API
 */
export async function initGoogleDrive() {
    if (isGapiLoaded && isGisLoaded) {
        console.log('Google Drive API ya inicializada');
        
        // Recuperar token guardado si existe
        const savedToken = localStorage.getItem('ephem_gdrive_token');
        const tokenExpiry = localStorage.getItem('ephem_gdrive_token_expiry');
        
        if (savedToken && tokenExpiry && Date.now() < parseInt(tokenExpiry)) {
            accessToken = savedToken;
            if (typeof gapi !== 'undefined' && gapi.client) {
                gapi.client.setToken({ access_token: savedToken });
                console.log('Token recuperado de localStorage');
                _scheduleTokenRefresh();
            }
        }
        
        return true;
    }

    try {
        // Cargar GAPI
        console.log('Cargando GAPI...');
        await loadScript('https://apis.google.com/js/api.js');
        
        await new Promise((resolve) => {
            gapi.load('client', resolve);
        });
        
        await gapi.client.init({
            discoveryDocs: DISCOVERY_DOCS,
        });
        
        isGapiLoaded = true;
        console.log('GAPI cargado');

        // Cargar GIS (Google Identity Services)
        console.log('Cargando GIS...');
        await loadScript('https://accounts.google.com/gsi/client');
        
        tokenClient = google.accounts.oauth2.initTokenClient({
            client_id: CLIENT_ID,
            scope: SCOPES,
            callback: '', // Se define en cada uso
        });
        
        isGisLoaded = true;
        console.log('GIS cargado');
        
        // Recuperar token guardado si existe
        const savedToken = localStorage.getItem('ephem_gdrive_token');
        const tokenExpiry = localStorage.getItem('ephem_gdrive_token_expiry');
        
        if (savedToken && tokenExpiry && Date.now() < parseInt(tokenExpiry)) {
            accessToken = savedToken;
            gapi.client.setToken({ access_token: savedToken });
            console.log('Token recuperado de localStorage');
            _scheduleTokenRefresh();
        }
        
        return true;
    } catch (error) {
        console.error('Error inicializando Google Drive API:', error);
        return false;
    }
}

/**
 * Helper para cargar scripts dinámicamente
 */
function loadScript(src) {
    return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) {
            resolve();
            return;
        }
        
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

// --- Autenticación ---

/**
 * Programa el refresh automático del token
 */
function _scheduleTokenRefresh() {
    if (tokenRefreshTimer) {
        clearTimeout(tokenRefreshTimer);
    }
    
    // Refrescar 5 minutos antes de que expire (45 min)
    const refreshIn = 45 * 60 * 1000;
    
    tokenRefreshTimer = setTimeout(async () => {
        console.log('Refrescando token automáticamente...');
        try {
            await authorize();
            console.log('Token refrescado exitosamente');
        } catch (err) {
            console.error('Error al refrescar token:', err);
        }
    }, refreshIn);
}

/**
 * Solicita autorización y obtiene token de acceso
 */
export async function authorize() {
    if (!isGapiLoaded || !isGisLoaded) {
        const initialized = await initGoogleDrive();
        if (!initialized) {
            throw new Error('No se pudo inicializar Google Drive API');
        }
    }

    return new Promise((resolve, reject) => {
        try {
            tokenClient.callback = async (response) => {
                if (response.error !== undefined) {
                    console.error('Error en callback de autorización:', response);
                    reject(new Error(response.error));
                    return;
                }
                
                accessToken = response.access_token;
                gapi.client.setToken({ access_token: accessToken });
                
                // Guardar token en localStorage para persistencia (50 min para tener margen)
                localStorage.setItem('ephem_gdrive_token', accessToken);
                localStorage.setItem('ephem_gdrive_token_expiry', Date.now() + 3000000); // 50 minutos
                
                // Programar refresh del token antes de que expire
                _scheduleTokenRefresh();
                
                console.log('Google Drive autorizado');
                resolve(accessToken);
            };

            tokenClient.error_callback = (error) => {
                console.error('Error en autorización:', error);
                reject(new Error('Error de autorización: ' + JSON.stringify(error)));
            };

            // Verificar si ya hay token válido
            const savedToken = localStorage.getItem('ephem_gdrive_token');
            const tokenExpiry = localStorage.getItem('ephem_gdrive_token_expiry');
            
            if (savedToken && tokenExpiry && Date.now() < parseInt(tokenExpiry)) {
                // Token guardado aún válido
                gapi.client.setToken({ access_token: savedToken });
                accessToken = savedToken;
                console.log('Token recuperado de localStorage');
                _scheduleTokenRefresh();
                resolve(savedToken);
            } else {
                // Solicitar nuevo token
                console.log('Solicitando nuevo token...');
                tokenClient.requestAccessToken({ prompt: 'consent' });
            }
        } catch (error) {
            console.error('Error en authorize:', error);
            reject(error);
        }
    });
}

/**
 * Cierra sesión de Google Drive
 */
export function signOut() {
    const token = gapi.client.getToken();
    if (token !== null) {
        google.accounts.oauth2.revoke(token.access_token);
        gapi.client.setToken(null);
        accessToken = null;
        
        // Limpiar localStorage
        localStorage.removeItem('ephem_gdrive_token');
        localStorage.removeItem('ephem_gdrive_token_expiry');
        
        // Cancelar refresh automático
        if (tokenRefreshTimer) {
            clearTimeout(tokenRefreshTimer);
            tokenRefreshTimer = null;
        }
        
        console.log('Google Drive sesión cerrada');
    }
}

/**
 * Verifica si hay token de acceso válido
 */
export function isAuthorized() {
    // Verificar token en memoria
    if (gapi && gapi.client && gapi.client.getToken() !== null) {
        return true;
    }
    
    // Verificar token guardado
    const savedToken = localStorage.getItem('ephem_gdrive_token');
    const tokenExpiry = localStorage.getItem('ephem_gdrive_token_expiry');
    
    if (savedToken && tokenExpiry && Date.now() < parseInt(tokenExpiry)) {
        // Restaurar token
        if (gapi && gapi.client) {
            gapi.client.setToken({ access_token: savedToken });
            accessToken = savedToken;
        }
        return true;
    }
    
    return false;
}

// --- Backup ---

/**
 * Crea o encuentra la carpeta de Ephemerides
 */
async function getOrCreateFolder() {
    try {
        // Buscar carpeta existente
        const response = await gapi.client.drive.files.list({
            q: `name='${BACKUP_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
            fields: 'files(id, name)',
            spaces: 'drive'
        });

        if (response.result.files && response.result.files.length > 0) {
            console.log('Carpeta encontrada:', response.result.files[0].id);
            return response.result.files[0].id;
        }

        // Crear carpeta
        console.log('Creando carpeta Ephemerides...');
        const createResponse = await gapi.client.drive.files.create({
            resource: {
                name: BACKUP_FOLDER_NAME,
                mimeType: 'application/vnd.google-apps.folder'
            },
            fields: 'id'
        });

        console.log('Carpeta Ephemerides creada:', createResponse.result.id);
        return createResponse.result.id;
    } catch (error) {
        console.error('Error obteniendo/creando carpeta:', error);
        throw new Error('No se pudo crear la carpeta en Drive: ' + error.message);
    }
}

/**
 * Hace backup de todos los datos a Google Drive
 */
export async function backupToDrive(onProgress) {
    console.log('Iniciando backup a Drive...');
    
    if (!isAuthorized()) {
        console.log('No autorizado, solicitando autorización...');
        await authorize();
    }

    try {
        onProgress?.('Preparando backup...');

        // Recopilar todos los datos de localStorage
        const backupData = {
            version: '5.0',
            timestamp: new Date().toISOString(),
            data: {
                days: localStorage.getItem('ephem_days'),
                memories: localStorage.getItem('ephem_memories'),
                viewMode: localStorage.getItem('ephem_viewMode'),
                first_run: localStorage.getItem('ephem_first_run'),
                welcome_shown: localStorage.getItem('ephem_welcome_shown')
            }
        };

        console.log('Datos preparados, tamaño:', JSON.stringify(backupData).length);

        onProgress?.('Conectando con Google Drive...');

        // Obtener ID de carpeta
        const folderId = await getOrCreateFolder();
        console.log('ID de carpeta obtenido:', folderId);

        onProgress?.('Subiendo backup...');

        // Buscar backup existente
        const searchResponse = await gapi.client.drive.files.list({
            q: `name='${BACKUP_FILENAME}' and '${folderId}' in parents and trashed=false`,
            fields: 'files(id, name)',
            spaces: 'drive'
        });

        const file = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
        const metadata = {
            name: BACKUP_FILENAME,
            mimeType: 'application/json',
            parents: [folderId]
        };

        let response;
        const token = gapi.client.getToken().access_token;

        if (searchResponse.result.files && searchResponse.result.files.length > 0) {
            // Actualizar archivo existente
            const fileId = searchResponse.result.files[0].id;
            console.log('Actualizando archivo existente:', fileId);
            
            // NO incluir parents al actualizar (error 403)
            const updateMetadata = {
                name: BACKUP_FILENAME,
                mimeType: 'application/json'
            };
            
            const form = new FormData();
            form.append('metadata', new Blob([JSON.stringify(updateMetadata)], { type: 'application/json' }));
            form.append('file', file);

            response = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart`, {
                method: 'PATCH',
                headers: new Headers({ 'Authorization': 'Bearer ' + token }),
                body: form
            });
        } else {
            // Crear nuevo archivo
            console.log('Creando nuevo archivo de backup');
            
            const form = new FormData();
            form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
            form.append('file', file);

            response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
                method: 'POST',
                headers: new Headers({ 'Authorization': 'Bearer ' + token }),
                body: form
            });
        }

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error en respuesta de Drive:', response.status, errorText);
            throw new Error('Error subiendo backup a Drive: ' + response.status);
        }

        const result = await response.json();
        console.log('Backup completado, fileId:', result.id);

        onProgress?.('Backup completado');
        
        // Guardar timestamp del último backup
        localStorage.setItem('ephem_last_backup', new Date().toISOString());
        
        console.log('Backup completado exitosamente');
        return true;
    } catch (error) {
        console.error('Error en backup:', error);
        throw new Error('Error en backup: ' + error.message);
    }
}

/**
 * Restaura datos desde Google Drive
 */
export async function restoreFromDrive(onProgress) {
    if (!isAuthorized()) {
        await authorize();
    }

    try {
        onProgress?.('Buscando backup...');

        // Obtener ID de carpeta
        const folderId = await getOrCreateFolder();

        // Buscar archivo de backup
        const searchResponse = await gapi.client.drive.files.list({
            q: `name='${BACKUP_FILENAME}' and '${folderId}' in parents and trashed=false`,
            fields: 'files(id, name, modifiedTime)',
            spaces: 'drive'
        });

        if (!searchResponse.result.files || searchResponse.result.files.length === 0) {
            throw new Error('No se encontró ningún backup en Google Drive');
        }

        const fileId = searchResponse.result.files[0].id;
        const modifiedTime = searchResponse.result.files[0].modifiedTime;

        onProgress?.('Descargando backup...');

        // Descargar archivo
        const response = await gapi.client.drive.files.get({
            fileId: fileId,
            alt: 'media'
        });

        const backupData = response.result;

        onProgress?.('Restaurando datos...');

        // Validar versión
        if (!backupData.version || !backupData.data) {
            throw new Error('Formato de backup inválido');
        }

        // Restaurar datos
        if (backupData.data.days) {
            localStorage.setItem('ephem_days', backupData.data.days);
        }
        if (backupData.data.memories) {
            localStorage.setItem('ephem_memories', backupData.data.memories);
        }
        if (backupData.data.viewMode) {
            localStorage.setItem('ephem_viewMode', backupData.data.viewMode);
        }
        if (backupData.data.first_run) {
            localStorage.setItem('ephem_first_run', backupData.data.first_run);
        }
        if (backupData.data.welcome_shown) {
            localStorage.setItem('ephem_welcome_shown', backupData.data.welcome_shown);
        }

        onProgress?.('Restore completado');
        
        console.log(`Restore completado. Backup del ${new Date(modifiedTime).toLocaleString()}`);
        return {
            success: true,
            timestamp: modifiedTime
        };
    } catch (error) {
        console.error('Error en restore:', error);
        throw error;
    }
}

/**
 * Obtiene información del último backup
 */
export async function getBackupInfo() {
    if (!isAuthorized()) {
        return null;
    }

    try {
        const folderId = await getOrCreateFolder();

        const searchResponse = await gapi.client.drive.files.list({
            q: `name='${BACKUP_FILENAME}' and '${folderId}' in parents and trashed=false`,
            fields: 'files(id, name, modifiedTime, size)',
            spaces: 'drive'
        });

        if (!searchResponse.result.files || searchResponse.result.files.length === 0) {
            return null;
        }

        const file = searchResponse.result.files[0];
        return {
            exists: true,
            modifiedTime: file.modifiedTime,
            size: file.size
        };
    } catch (error) {
        console.error('Error obteniendo info de backup:', error);
        return null;
    }
}

/**
 * Obtiene el timestamp del último backup local
 */
export function getLastBackupTimestamp() {
    const timestamp = localStorage.getItem('ephem_last_backup');
    return timestamp ? new Date(timestamp) : null;
}
