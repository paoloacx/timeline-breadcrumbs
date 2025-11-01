// ===== media-handlers.js (Image & Audio Logic) =====

// Imports
import { setMediaRecorder, getMediaRecorder, setAudioChunks, getAudioChunks, addImage, removeImage as removeImageFromState, setAudio } from './state.js';
import { renderImagePreviews, renderAudioPreview } from './ui-renderer.js';

/**
 * Handles image file input, resizes images, and adds to state.
 * @param {Event} event - The file input change event.
 */
export function handleImageInput(event) {
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
                
                addImage(resizedImage); // Add to state
                renderImagePreviews(); // Re-render previews
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
            audio: { echoCancellation: true, noiseSuppression: true, sampleRate: 44100 } 
        });
        
        let options = {};
        if (MediaRecorder.isTypeSupported('audio/mp4')) options = { mimeType: 'audio/mp4' };
        else if (MediaRecorder.isTypeSupported('audio/webm')) options = { mimeType: 'audio/webm' };
        
        const mediaRecorder = new MediaRecorder(stream, options);
        setMediaRecorder(mediaRecorder);
        setAudioChunks([]); // Clear old chunks

        mediaRecorder.ondataavailable = (event) => {
            getAudioChunks().push(event.data);
        };

        mediaRecorder.onstop = () => {
            const mimeType = getMediaRecorder().mimeType || 'audio/webm';
            const audioBlob = new Blob(getAudioChunks(), { type: mimeType });
            const reader = new FileReader();
            reader.onloadend = () => {
                setAudio(reader.result); // Save audio data to state
                renderAudioPreview(); // Re-render preview
            };
            reader.readAsDataURL(audioBlob);
            
            stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorder.start();
        document.getElementById('btn-record-start').disabled = true;
        document.getElementById('btn-record-stop').disabled = false;
        document.querySelector('.audio-recorder').classList.add('recording');

    } catch (error) {
        console.error('Error accessing microphone:', error);
        alert('Could not access microphone.');
    }
}

/**
 * Stops audio recording.
 */
export function stopRecording() {
    const mediaRecorder = getMediaRecorder();
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
        document.getElementById('btn-record-start').disabled = false;
        document.getElementById('btn-record-stop').disabled = true;
        document.querySelector('.audio-recorder').classList.remove('recording');
    }
}

/**
 * Removes an image from the state and re-renders previews.
 * @param {number} index - The index of the image to remove.
 */
export function removeImage(index) {
    removeImageFromState(index);
    renderImagePreviews();
}

/**
 * Removes the current audio from the state and re-renders preview.
 */
export function removeAudio() {
    setAudio(null);
    renderAudioPreview();
}
