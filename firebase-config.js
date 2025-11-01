// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyAb-MLu8atl5hruOPLDhgftjkjc_1M2038", // (Tu clave)
    authDomain: "breadcrumbs-8b59e.firebaseapp.com",
    projectId: "breadcrumbs-8b59e",
    storageBucket: "breadcrumbs-8b59e.firebasestorage.app",
    messagingSenderId: "912286191427",
    appId: "1:912286191427:web:e78b665df6a6ff6d8529f6",
    measurementId: "G-GZYTDYNSRB"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// CAMBIO: Hecho global para que otros archivos puedan verlo
window.currentUser = null;
window.isOfflineMode = false;

// Auth state observer
auth.onAuthStateChanged((user) => {
    if (user) {
        window.currentUser = user;
        console.log('Usuario autenticado:', user.email, 'UID:', user.uid);
        
        // CAMBIO: No necesitamos comprobar si la función existe
        // si app.js ya está cargado (lo cual está).
        window.showMainApp(); // (Función local de este archivo)
        // updateSyncStatus('online'); // (La función no existe, la comento)
        window.loadDataFromFirebase(); // (Función local de este archivo)
        window.loadSettingsFromFirebase(); // (Función local de este archivo)
        
    }
});

// Sign in with Google
// CAMBIO: Hecho global
window.signInWithGoogle = function() {
    const provider = new firebase.auth.GoogleAuthProvider();
    
    auth.signInWithPopup(provider)
        .then((result) => {
            console.log('Signed in with Google:', result.user.email);
        })
        .catch((error) => {
            console.error('Google sign-in error:', error);
            alert('Sign in error: ' + error.message);
        });
}

// Sign in with Email/Password
// CAMBIO: Hecho global
window.signInWithEmail = function() {
    const email = prompt('Enter your email:');
    const password = prompt('Enter your password:');
    
    if (!email || !password) return;
    
    auth.signInWithEmailAndPassword(email, password)
        .then((result) => {
            console.log('Signed in with email:', result.user.email);
        })
        .catch((error) => {
            // Si el usuario no existe, intentar crearlo
            if (error.code === 'auth/user-not-found') {
                auth.createUserWithEmailAndPassword(email, password)
                    .then((result) => {
                        console.log('New user created:', result.user.email);
                    })
                    .catch((createError) => {
                        console.error('Error creating user:', createError);
                        alert('Error: ' + createError.message);
                    });
            } else {
                console.error('Email sign-in error:', error);
                alert('Sign in error: ' + error.message);
            }
        });
}

// Sign out
// CAMBIO: Hecho global
window.signOutUser = function() {
    if (confirm('Sign out?')) {
        auth.signOut().then(() => {
            location.reload();
        });
    }
}

// Continue offline
// CAMBIO: Hecho global
window.continueOffline = function() {
    window.isOfflineMode = true;
    showMainApp(); // (Función local)
    // updateSyncStatus('offline'); // (La función no existe)
    
    // Asegurarse que app.js esté cargado
    if (typeof window.loadData === 'function') {
        window.loadData();
    }
    if (typeof window.loadSettings === 'function') {
        window.loadSettings();
    }
}

// Show main app
// CAMBIO: Hecho global
window.showMainApp = function() {
    document.getElementById('auth-container').style.display = 'none';
    document.getElementById('main-app').style.display = 'block';
    
    if (window.currentUser) {
        const email = window.currentUser.email;
        // Mostrar solo icono en el avatar
        document.getElementById('user-icon').textContent = '👤';
        // Guardar el email completo en el dropdown
        document.getElementById('user-email-full').textContent = email;
        document.getElementById('user-avatar').style.display = 'block';
    } else {
        document.getElementById('user-avatar').style.display = 'none';
    }
}

// Toggle user menu
// CAMBIO: Hecho global
window.toggleUserMenu = function(e) {
    e.stopPropagation();
    const menu = document.getElementById('logout-menu');
    menu.classList.toggle('show');
}

// Close user menu on outside click
document.addEventListener('click', (e) => {
    const menu = document.getElementById('logout-menu');
    if (menu && !e.target.closest('.user-avatar')) {
        menu.classList.remove('show');
    }
});

// Update sync status (Función no encontrada, la comento)
// function updateSyncStatus(status) { ... }

// Load data from Firebase
// CAMBIO: Hecho global
window.loadDataFromFirebase = async function() {
    if (!window.currentUser) return;
    
    // updateSyncStatus('syncing');
    
    try {
        const snapshot = await db.collection('users')
            .doc(window.currentUser.uid)
            .collection('entries')
            .orderBy('timestamp', 'desc')
            .get();
        
        // *** CAMBIO CRÍTICO ***
        // Usar 'window.entries' (global) en lugar de 'entries' (local)
        if (typeof window.entries !== 'undefined') {
            window.entries = []; // Limpiar el array global
            snapshot.forEach((doc) => {
                window.entries.push({ id: doc.id, ...doc.data() }); // Llenar el array global
            });
            
            console.log(`Cargadas ${window.entries.length} entradas del usuario ${window.currentUser.email}`);
            
            // *** CAMBIO CRÍTICO ***
            // Renderizar el timeline DESPUÉS de cargar los datos
            if (typeof window.renderTimeline === 'function') {
                window.renderTimeline();
            }
        }
        
        // updateSyncStatus('online');
    } catch (error) {
        console.error('Error loading from Firebase:', error);
        // updateSyncStatus('offline');
        if (typeof window.loadData === 'function') {
            window.loadData();
        }
    }
}

// Save data to Firebase
// CAMBIO: Hecho global
window.saveDataToFirebase = async function() {
    if (!window.currentUser || window.isOfflineMode) {
        // if (typeof window.saveData === 'function') {
        //     window.saveData(); // No llamar a saveData() aquí, crearía un bucle
        // }
        return;
    }
    
    // updateSyncStatus('syncing');
    
    try {
        const batch = db.batch();
        
        // *** CAMBIO CRÍTICO ***
        // Usar 'window.entries' (global) en lugar de 'entries' (local)
        if (typeof window.entries !== 'undefined') {
            window.entries.forEach((entry) => {
                const docRef = db.collection('users')
                    .doc(window.currentUser.uid)
                    .collection('entries')
                    .doc(String(entry.id));
                
                // *** CAMBIO CRÍTICO ***
                // Limpiar el objeto antes de enviarlo a Firebase
                // Esto arregla el guardado de Day Recaps (objetos anidados)
                const cleanEntry = JSON.parse(JSON.stringify(entry));
                
                batch.set(docRef, cleanEntry);
            });
            
            await batch.commit();
            console.log(`Guardadas ${window.entries.length} entradas para ${window.currentUser.email}`);
        }
        
        // updateSyncStatus('online');
    } catch (error) {
        console.error('Error saving to Firebase:', error);
        // updateSyncStatus('offline');
        // if (typeof window.saveData === 'function') {
        //     window.saveData(); // No llamar a saveData() aquí
        // }
    }
}

// Load settings from Firebase
// CAMBIO: Hecho global
window.loadSettingsFromFirebase = async function() {
    if (!window.currentUser) return;
    
    try {
        const doc = await db.collection('users')
            .doc(window.currentUser.uid)
            .collection('settings')
            .doc('app-settings')
            .get();
        
        // *** CAMBIO CRÍTICO ***
        // Usar 'window.timeDurations', etc. (globales)
        if (doc.exists && typeof window.timeDurations !== 'undefined') {
            const data = doc.data();
            if (data.timeDurations) window.timeDurations = data.timeDurations;
            if (data.timeActivities) window.timeActivities = data.timeActivities;
            if (data.trackItems) window.trackItems = data.trackItems;
            if (data.moods) window.moods = data.moods;
            
            console.log('Configuración cargada para', window.currentUser.email);
            
            if (typeof window.updateTimerOptions === 'function') {
                window.updateTimerOptions();
            }
            if (typeof window.updateTrackOptions === 'function') {
                window.updateTrackOptions();
            }
            if (typeof window.renderMoodSelector === 'function') {
                window.renderMoodSelector();
            }
        } else {
             if (typeof window.loadSettings === 'function') {
                window.loadSettings(); // Cargar local si no existe en FB
            }
        }
    } catch (error) {
        console.error('Error loading settings from Firebase:', error);
        if (typeof window.loadSettings === 'function') {
            window.loadSettings();
        }
    }
}

// Save settings to Firebase
// CAMBIO: Hecho global
window.saveSettingsToFirebase = async function() {
    if (!window.currentUser || window.isOfflineMode) {
        if (typeof window.saveSettingsToStorage === 'function') {
            window.saveSettingsToStorage();
        }
        return;
    }
    
    try {
        // *** CAMBIO CRÍTICO ***
        // Usar 'window.timeDurations', etc. (globales)
        if (typeof window.timeDurations !== 'undefined') {
            await db.collection('users')
                .doc(window.currentUser.uid)
                .collection('settings')
                .doc('app-settings')
                .set({
                    timeDurations: window.timeDurations,
                    timeActivities: window.timeActivities,
                    trackItems: window.trackItems,
                    moods: window.moods,
                    updatedAt: new Date().toISOString()
                });
            
            console.log('Settings saved to Firebase for', window.currentUser.email);
        }
    } catch (error) {
        console.error('Error saving settings to Firebase:', error);
        if (typeof window.saveSettingsToStorage === 'function') {
            window.saveSettingsToStorage();
        }
    }
}

// Delete entry from Firebase
// CAMBIO: Hecho global
window.deleteEntryFromFirebase = async function(entryId) {
    if (!window.currentUser || window.isOfflineMode) return;
    
    try {
        await db.collection('users')
            .doc(window.currentUser.uid)
            .collection('entries')
            .doc(String(entryId))
            .delete();
        console.log('Entry deleted from Firebase for', window.currentUser.email);
    } catch (error) {
        console.error('Error deleting from Firebase:', error);
    }
}
