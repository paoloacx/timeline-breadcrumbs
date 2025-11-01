// =================================================================
// MEDIA HANDLERS (media-handlers.js)
// =================================================================
// Gestiona la captura de imágenes, grabación de audio y sus vistas previas.

// --- Image Handling ---

/**
 * Handles image file selection, resizing, and adding to state.
 * @param {Event} event - The file input change event.
 */
window.handleImages = function(event) {
    const files = Array.from(event.target.files);
    
    files.forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = function() {
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
                
                currentImages.push(resizedImage); // currentImages está en state-manager.js
                renderImagePreviews();
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

/**
 * Renders the preview thumbnails for selected images.
 */
function renderImagePreviews() {
    const container = document.getElementById('image-previews');
    // currentImages está en state-manager.js
    container.innerHTML = currentImages.map((img, idx) => `
        <div class="image-preview">
            <img src="${img}" alt="Preview image ${idx+1}">
            <div class="image-remove" onclick="removeImage(${idx})">✕</div>
        </div>
    `).join('');
}

/**
 * Removes an image from the current selection.
 * @param {number} index - The index of the image to remove.
 */
window.removeImage = function(index) {
    currentImages.splice(index, 1); // currentImages está en state-manager.js
    renderImagePreviews();
}

// --- Audio Handling ---

/**
 * Starts audio recording, handling iOS-compatible formats.
 */
window.startRecording = async function() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                sampleRate: 44100
            } 
        });
        
        // Detect compatible format (iOS)
        let options = {};
        if (MediaRecorder.isTypeSupported('audio/mp4')) {
            options = { mimeType: 'audio/mp4' };
        } else if (MediaRecorder.isTypeSupported('audio/webm')) {
            options = { mimeType: 'audio/webm' };
        } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
            options = { mimeType: 'audio/ogg' };
        }
        
        // mediaRecorder y audioChunks están en state-manager.js
        mediaRecorder = new MediaRecorder(stream, options);
        audioChunks = [];

        mediaRecorder.ondataavailable = (event) => {
            audioChunks.push(event.data);
        };

        mediaRecorder.onstop = () => {
            const mimeType = mediaRecorder.mimeType || 'audio/webm';
            const audioBlob = new Blob(audioChunks, { type: mimeType });
            const reader = new FileReader();
            reader.onloadend = () => {
                currentAudio = reader.result; // currentAudio está en state-manager.js
                renderAudioPreview();
            };
            reader.readAsDataURL(audioBlob);
            
            stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorder.start();
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
window.stopRecording = function() {
    // mediaRecorder está en state-manager.js
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
        document.getElementById('record-btn').disabled = false;
        document.getElementById('stop-record-btn').disabled = true;
        document.querySelector('.audio-recorder').classList.remove('recording');
    }
}

/**
 * Renders the audio player preview.
 */
function renderAudioPreview() {
    const container = document.getElementById('audio-preview');
    // currentAudio está en state-manager.js
    if (currentAudio) {
        container.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px; margin-top: 8px;">
                <audio controls style="flex: 1;">
                    <source src="${currentAudio}">
                </audio>
                <button class="mac-button" onclick="removeAudio()" style="padding: 4px 8px;">✕</button>
            </div>
        `;
    } else {
        container.innerHTML = '';
    }
}

/**
 * Removes the current audio recording.
 */
window.removeAudio = function() {
    currentAudio = null; // currentAudio está en state-manager.js
    renderAudioPreview();
}
