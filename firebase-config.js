// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyAb-MLu8atl5hruOPLDhgftjkjc_1M2038",
    authDomain: "breadcrumbs-8b59e.firebaseapp.com",
    projectId: "breadcrumbs-8b59e",
    storageBucket: "breadcrumbs-8b59e.firebasestorage.app",
    messagingSenderId: "912286191427",
    appId: "1:912286191427:web:e78b665df6a6ff6d8529f6",
    measurementId: "G-GZYTDYNSRB"
};

// Initialize Firebase
try {
    firebase.initializeApp(firebaseConfig);

    // CAMBIO: Adjuntar a 'window' para hacerlas globales
    // Esto arregla el error "auth is not defined" en app.js
    window.auth = firebase.auth();
    window.db = firebase.firestore();
    window.storage = firebase.storage();
    
    console.log("Firebase initialized and services attached to window.");

} catch (error) {
    console.error("Error initializing Firebase:", error);
    // Si Firebase falla, informamos y preparamos para modo offline
    window.auth = null;
    window.db = null;
    window.storage = null;
}

