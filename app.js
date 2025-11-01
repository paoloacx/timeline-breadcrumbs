// /app.js
// Main entry point for the application.

import { initAuthListener } from './auth.js';
import { initEventListeners } from './event-listeners.js';
import { loadSettings } from './settings-manager.js';

/**
 * Initializes the application on DOM content loaded.
 */
document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Load settings from localStorage first.
    // This populates the state with user preferences (moods, activities)
    // before any rendering happens.
    loadSettings(); 
    
    // 2. Start the authentication listener.
    // This will check if the user is logged in and
    // trigger the appropriate data load (local or cloud).
    initAuthListener(); 
    
    // 3. Attach all UI event listeners.
    // This connects all buttons and inputs to their handler functions.
    initEventListeners();
    
    console.log("Breadcrumb App Initialized.");
});
