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
firebase.initializeApp(firebaseConfig);

// Definir y "exportar" las variables para que otros scripts las usen
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

