function updateFileInputAcceptType() {
    const fileInput = document.getElementById('hashFile');
    const selectedType = document.querySelector('input[name="hashType"]:checked').value;
    
    switch(selectedType) {
        case 'text':
            fileInput.accept = '.txt,.doc,.docx,.pdf';
            break;
        case 'image':
            fileInput.accept = 'image/*';
            break;
        case 'audio':
            fileInput.accept = 'audio/*';
            break;
        case 'video':
            fileInput.accept = 'video/*';
            break;
    }
}

document.querySelectorAll('input[name="hashType"]').forEach(radio => {
    radio.addEventListener('change', () => {
        updateFileInputAcceptType();
        removeFile();
    });
});

function showCustomAlert(message, type = 'error') {
    const alertDiv = document.createElement('div');
    const bgColor = type === 'success' ? 'bg-green-100 border-green-500 text-green-700' : 'bg-red-100 border-red-500 text-red-700';
    const icon = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle';
    
    alertDiv.className = `fixed top-4 right-4 ${bgColor} border-l-4 p-4 rounded shadow-lg`;
    alertDiv.style.zIndex = '1000';
    alertDiv.innerHTML = `
        <div class="flex items-center">
            <i class="fas ${icon} mr-2"></i>
            <p>${message}</p>
        </div>
    `;
    document.body.appendChild(alertDiv);

    setTimeout(() => {
        alertDiv.remove();
    }, 3000);
}

function handleFileSelect(input) {
    const fileInfo = document.getElementById('fileInfo');
    const fileName = document.getElementById('fileName');
    const hashPreview = document.getElementById('hashPreview');
    const hashPreviewImage = document.getElementById('hashPreviewImage');
    const hashPreviewAudio = document.getElementById('hashPreviewAudio');
    const hashPreviewVideo = document.getElementById('hashPreviewVideo');
    const hashPreviewText = document.getElementById('hashPreviewText');
    
    if (input.files && input.files[0]) {
        const file = input.files[0];
        const selectedType = document.querySelector('input[name="hashType"]:checked').value;
        
        let isValidFile = false;
        switch(selectedType) {
            case 'text':
                isValidFile = file.type.includes('text') || 
                            file.type.includes('document') || 
                            file.type.includes('pdf');
                break;
            case 'image':
                isValidFile = file.type.startsWith('image/');
                break;
            case 'audio':
                isValidFile = file.type.startsWith('audio/');
                break;
            case 'video':
                isValidFile = file.type.startsWith('video/');
                break;
        }

        if (!isValidFile) {
            showCustomAlert(`Invalid file type. Please select a ${selectedType} file`);
            input.value = '';
            return;
        }

        fileName.textContent = file.name;
        fileInfo.classList.remove('hidden');
        
        hashPreview.classList.remove('hidden');
        hashPreviewImage.classList.add('hidden');
        hashPreviewAudio.classList.add('hidden');
        hashPreviewVideo.classList.add('hidden');
        
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function(e) {
                hashPreviewImage.src = e.target.result;
                hashPreviewImage.classList.remove('hidden');
            }
            reader.readAsDataURL(file);
        } else if (file.type.startsWith('audio/')) {
            const reader = new FileReader();
            reader.onload = function(e) {
                hashPreviewAudio.src = e.target.result;
                hashPreviewAudio.classList.remove('hidden');
            }
            reader.readAsDataURL(file);
        } else if (file.type.startsWith('video/')) {
            const reader = new FileReader();
            reader.onload = function(e) {
                hashPreviewVideo.src = e.target.result;
                hashPreviewVideo.classList.remove('hidden');
            }
            reader.readAsDataURL(file);
        }
        
        hashPreviewText.textContent = `File size: ${formatFileSize(file.size)}`;
    }
}

function removeFile() {
    const fileInput = document.getElementById('hashFile');
    const fileInfo = document.getElementById('fileInfo');
    const fileName = document.getElementById('fileName');
    const hashPreview = document.getElementById('hashPreview');
    const hashOutput = document.getElementById('hashOutput');
    const originalFileSection = document.getElementById('originalFileSection');
    
    fileInput.value = '';
    fileName.textContent = 'No file selected';
    fileInfo.classList.add('hidden');
    hashPreview.classList.add('hidden');
    hashOutput.classList.add('hidden');
    originalFileSection.classList.add('hidden');
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function generateHash() {
    const fileInput = document.getElementById('hashFile');
    const algorithm = document.getElementById('hashAlgorithm').value;
    const hashOutput = document.getElementById('hashOutput');
    const hashValue = document.getElementById('hashValue');
    const originalFileSection = document.getElementById('originalFileSection');
    
    if (!fileInput.files || !fileInput.files[0]) {
        showCustomAlert('Please select a file first');
        return;
    }

    const button = document.querySelector('button[onclick="generateHash()"]');
    const loadingSpan = button.querySelector('.loading');
    const normalSpan = button.querySelector('.normal');
    loadingSpan.classList.remove('hidden');
    normalSpan.classList.add('hidden');
    button.disabled = true;

    const formData = new FormData();
    formData.append('file', fileInput.files[0]);
    formData.append('algorithm', algorithm);

    fetch('/hash', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        hashValue.textContent = data.hash;
        if (data.download_url) {
            const originalFileLink = document.getElementById('originalFileLink');
            originalFileLink.href = data.download_url;
            originalFileLink.download = fileInput.files[0].name + '.hash';
            originalFileSection.classList.remove('hidden');
        }
        hashOutput.classList.remove('hidden');
        showCustomAlert('Hash generated successfully!', 'success');
    })
    .catch(error => {
        showCustomAlert('Hash generation failed: ' + error.message);
    })
    .finally(() => {
        loadingSpan.classList.add('hidden');
        normalSpan.classList.remove('hidden');
        button.disabled = false;
    });
}

function copyHash() {
    const hashValue = document.getElementById('hashValue').textContent;
    navigator.clipboard.writeText(hashValue)
        .then(() => showCustomAlert('Hash copied to clipboard!', 'success'))
        .catch(() => showCustomAlert('Failed to copy hash'));
}

document.addEventListener('DOMContentLoaded', updateFileInputAcceptType);