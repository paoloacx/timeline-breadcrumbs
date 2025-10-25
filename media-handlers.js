// Este archivo maneja la lógica para capturar,
// procesar y previsualizar imágenes y audio.

// Image handling
function handleImages(event) {
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
                
                currentImages.push(resizedImage);
                renderImagePreviews();
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

// Audio recording - iOS compatible
async function startRecording() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                sampleRate: 44100
            } 
        });
        
        // Detectar formato compatible con iOS
        let options = {};
        if (MediaRecorder.isTypeSupported('audio/mp4')) {
            options = { mimeType: 'audio/mp4' };
        } else if (MediaRecorder.isTypeSupported('audio/webm')) {
            options = { mimeType: 'audio/webm' };
        } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
            options = { mimeType: 'audio/ogg' };
        }
        
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
                currentAudio = reader.result;
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

function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
        document.getElementById('record-btn').disabled = false;
        document.getElementById('stop-record-btn').disabled = true;
        document.querySelector('.audio-recorder').classList.remove('recording');
    }
}

function renderImagePreviews() {
    const container = document.getElementById('image-previews');
    container.innerHTML = currentImages.map((img, idx) => `
        <div class="image-preview">
            <img src="${img}" alt="">
            <div class="image-remove" onclick="removeImage(${idx})">✕</div>
        </div>
    `).join('');
}

function renderAudioPreview() {
    const container = document.getElementById('audio-preview');
    if (currentAudio) {
        container.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px; margin-top: 8px;">
                <audio controls style="flex: 1;">
                    <source src="${currentAudio}" type="audio/webm">
                </audio>
                <button class="mac-button" onclick="removeAudio()" style="padding: 4px 8px;">✕</button>
            </div>
        `;
    } else {
        container.innerHTML = '';
    }
}

function removeImage(index) {
    currentImages.splice(index, 1);
    renderImagePreviews();
}

function removeAudio() {
    currentAudio = null;
    renderAudioPreview();
}
