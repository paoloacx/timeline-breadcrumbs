// ===== MEDIA HANDLING FUNCTIONS =====

/**
 * Handles image file input, resizes images, and adds to 'currentImages'.
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
                
                currentImages.push(resizedImage); // global var from app.js
                window.renderImagePreviews(); // global function in ui-renderer.js
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

/**
 * Starts audio recording.
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
        
        // Detect compatible format (for iOS)
        let options = {};
        if (MediaRecorder.isTypeSupported('audio/mp4')) {
            options = { mimeType: 'audio/mp4' };
        } else if (MediaRecorder.isTypeSupported('audio/webm')) {
            options = { mimeType: 'audio/webm' };
        } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
            options = { mimeType: 'audio/ogg' };
        }
        
        mediaRecorder = new MediaRecorder(stream, options); // global var from app.js
        audioChunks = []; // global var from app.js

        mediaRecorder.ondataavailable = (event) => {
            audioChunks.push(event.data);
        };

        mediaRecorder.onstop = () => {
            const mimeType = mediaRecorder.mimeType || 'audio/webm';
            const audioBlob = new Blob(audioChunks, { type: mimeType });
            const reader = new FileReader();
            reader.onloadend = () => {
                currentAudio = reader.result; // global var from app.js
                window.renderAudioPreview(); // global function in ui-renderer.js
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
 * Stops audio recording.
 */
window.stopRecording = function() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') { // global var from app.js
        mediaRecorder.stop();
        document.getElementById('record-btn').disabled = false;
        document.getElementById('stop-record-btn').disabled = true;
        document.querySelector('.audio-recorder').classList.remove('recording');
    }
}

/**
 * Removes an image from the 'currentImages' array.
 * @param {number} index - The index of the image to remove.
 */
window.removeImage = function(index) {
    currentImages.splice(index, 1); // global var from app.js
    window.renderImagePreviews(); // global function in ui-renderer.js
}

/**
 * Removes the current audio recording.
 */
window.removeAudio = function() {
    currentAudio = null; // global var from app.js
    window.renderAudioPreview(); // global function in ui-renderer.js
}
