function updateFileInputAcceptType() {
    const fileInput = document.getElementById('encryptHashFile');
    const selectedType = document.querySelector('input[name="encryptHashType"]:checked').value;
    
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

document.querySelectorAll('input[name="encryptHashType"]').forEach(radio => {
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
    const preview = document.getElementById('encryptHashPreview');
    const previewImage = document.getElementById('encryptHashPreviewImage');
    const previewAudio = document.getElementById('encryptHashPreviewAudio');
    const previewVideo = document.getElementById('encryptHashPreviewVideo');
    const previewText = document.getElementById('encryptHashPreviewText');
    
    if (input.files && input.files[0]) {
        const file = input.files[0];
        const selectedType = document.querySelector('input[name="encryptHashType"]:checked').value;
        
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
        
        preview.classList.remove('hidden');
        previewImage.classList.add('hidden');
        previewAudio.classList.add('hidden');
        previewVideo.classList.add('hidden');
        
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function(e) {
                previewImage.src = e.target.result;
                previewImage.classList.remove('hidden');
            }
            reader.readAsDataURL(file);
        } else if (file.type.startsWith('audio/')) {
            const reader = new FileReader();
            reader.onload = function(e) {
                previewAudio.src = e.target.result;
                previewAudio.classList.remove('hidden');
            }
            reader.readAsDataURL(file);
        } else if (file.type.startsWith('video/')) {
            const reader = new FileReader();
            reader.onload = function(e) {
                previewVideo.src = e.target.result;
                previewVideo.classList.remove('hidden');
            }
            reader.readAsDataURL(file);
        }
        
        previewText.textContent = `File size: ${formatFileSize(file.size)}`;
    }
}

function removeFile() {
    const fileInput = document.getElementById('encryptHashFile');
    const fileInfo = document.getElementById('fileInfo');
    const fileName = document.getElementById('fileName');
    const preview = document.getElementById('encryptHashPreview');
    const output = document.getElementById('encryptHashOutput');
    
    fileInput.value = '';
    fileName.textContent = 'No file selected';
    fileInfo.classList.add('hidden');
    preview.classList.add('hidden');
    output.classList.add('hidden');
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function encryptAndHash() {
    const fileInput = document.getElementById('encryptHashFile');
    const keyInput = document.getElementById('encryptHashKey');
    const encryptAlgorithm = document.getElementById('encryptAlgorithm').value;
    const hashAlgorithm = document.getElementById('hashAlgorithm').value;
    const output = document.getElementById('encryptHashOutput');
    const encryptedFileSection = document.getElementById('encryptedFileSection');
    const hashResult = document.getElementById('hashResult');
    const hashValue = document.getElementById('hashValue');
    
    if (!fileInput.files || !fileInput.files[0]) {
        showCustomAlert('Please select a file first');
        return;
    }
    
    if (!keyInput.value.trim()) {
        showCustomAlert('Please enter an encryption key');
        return;
    }

    const button = document.querySelector('button[onclick="encryptAndHash()"]');
    const loadingSpan = button.querySelector('.loading');
    const normalSpan = button.querySelector('.normal');
    loadingSpan.classList.remove('hidden');
    normalSpan.classList.add('hidden');
    button.disabled = true;

    const formData = new FormData();
    formData.append('file', fileInput.files[0]);
    formData.append('key', keyInput.value);
    formData.append('encryptAlgorithm', encryptAlgorithm);
    formData.append('hashAlgorithm', hashAlgorithm);

    fetch('/encrypt-hash', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        // Set up encrypted file download
        const encryptedFileLink = document.getElementById('encryptedFileLink');
        encryptedFileLink.href = data.encryptedFileUrl;
        encryptedFileLink.download = fileInput.files[0].name + '.encrypted';
        encryptedFileSection.classList.remove('hidden');

        // Display hash value
        hashValue.textContent = data.hash;
        hashResult.classList.remove('hidden');
        
        output.classList.remove('hidden');
        showCustomAlert('File encrypted and hashed successfully!', 'success');
    })
    .catch(error => {
        showCustomAlert('Operation failed: ' + error.message);
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