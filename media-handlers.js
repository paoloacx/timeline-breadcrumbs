// /media-handlers.js
// Handles hardware interactions: GPS, camera, and microphone.

import { setState, getState } from './state-manager.js';
import { getWeather } from './api-services.js';
import { showMiniMap, renderImagePreviews, renderAudioPreview } from './ui-renderer.js';

/**
 * Initiates GPS lookup.
 */
export function getGPS() {
    const btn = document.getElementById('gps-btn');
    const locationInput = document.getElementById('location-input');
    btn.textContent = '⏳ Searching...';
    btn.disabled = true;

    if (!navigator.geolocation) {
        alert('Geolocation not available');
        btn.textContent = '🌍 Use GPS';
        btn.disabled = false;
        return;
    }

    navigator.geolocation.getCurrentPosition(
        async (position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            setState({ currentCoords: { lat, lon } });
            
            locationInput.placeholder = 'Getting location...';
            
            // Show map
            showMiniMap(lat, lon, 'form-map');
            
            // Fetch weather
            const weatherInput = document.getElementById('weather-input');
            weatherInput.value = '⏳ Getting weather...';
            const { weatherString, city } = await getWeather(lat, lon);
            weatherInput.value = weatherString;
            locationInput.value = city;
            
            btn.textContent = '🌍 GPS OK';
            btn.disabled = false;
        },
        (error) => {
            console.error('GPS Error:', error);
            alert('Could not get GPS location.');
            btn.textContent = '🌍 Use GPS';
            btn.disabled = false;
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
}

/**
 * Handles image file selection, resizing, and adding to state.
 * @param {Event} event - The file input change event.
 */
export function handleImages(event) {
    const files = Array.from(event.target.files);
    let { currentImages } = getState();
    
    files.forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                let width = img.width;
                let height = img.height;
                const maxSize = 800;
                
                if (width > height && width > maxSize) {
                    height = (height * maxSize) / width;
                    width = maxSize;
                } else if (height > maxSize) {
                    width = (width * maxSize) / height;
                    height = maxSize;
                }
                
                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);
                
                const resizedImage = canvas.toDataURL('image/jpeg', 0.8);
                
                currentImages.push(resizedImage);
                setState({ currentImages: [...currentImages] });
                renderImagePreviews();
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

/**
 * Starts audio recording.
 */
export async function startRecording() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                sampleRate: 44100
            }
        });
        
        let options = {};
        if (MediaRecorder.isTypeSupported('audio/mp4')) {
            options = { mimeType: 'audio/mp4' };
        } else if (MediaRecorder.isTypeSupported('audio/webm')) {
            options = { mimeType: 'audio/webm' };
        }
        
        const mediaRecorder = new MediaRecorder(stream, options);
        let audioChunks = [];

        mediaRecorder.ondataavailable = (event) => {
            audioChunks.push(event.data);
        };

        mediaRecorder.onstop = () => {
            const mimeType = mediaRecorder.mimeType || 'audio/webm';
            const audioBlob = new Blob(audioChunks, { type: mimeType });
            const reader = new FileReader();
            reader.onloadend = () => {
                setState({ currentAudio: reader.result });
                renderAudioPreview();
            };
            reader.readAsDataURL(audioBlob);
            
            stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorder.start();
        setState({ mediaRecorder, audioChunks });

        document.getElementById('record-btn').disabled = true;
        document.getElementById('stop-record-btn').disabled = false;
        document.querySelector('.audio-recorder').classList.add('recording');

    } catch (error) {
        console.error('Error accessing microphone:', error);
        alert('Could not access microphone.');
    }
}

/**
 * Stops the audio recording.
 */
export function stopRecording() {
    const { mediaRecorder } = getState();
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
        document.getElementById('record-btn').disabled = false;
        document.getElementById('stop-record-btn').disabled = true;
        document.querySelector('.audio-recorder').classList.remove('recording');
    }
}

/**
 * Removes an image from the current state.
 * @param {number} index - The index of the image to remove.
 */
export function removeImage(index) {
    let { currentImages } = getState();
    currentImages.splice(index, 1);
    setState({ currentImages: [...currentImages] });
    renderImagePreviews();
}

/**
 * Removes the current audio from the state.
 */
export function removeAudio() {
    setState({ currentAudio: null });
    renderAudioPreview();
}
