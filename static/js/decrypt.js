function updateFileInputAcceptType() {
    const fileInput = document.getElementById('decryptFile');
    const selectedType = document.querySelector('input[name="decryptType"]:checked').value;
    
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

document.querySelectorAll('input[name="decryptType"]').forEach(radio => {
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
    const decryptPreview = document.getElementById('decryptPreview');
    const decryptPreviewImage = document.getElementById('decryptPreviewImage');
    const decryptPreviewAudio = document.getElementById('decryptPreviewAudio');
    const decryptPreviewVideo = document.getElementById('decryptPreviewVideo');
    const decryptPreviewText = document.getElementById('decryptPreviewText');
    
    if (input.files && input.files[0]) {
        const file = input.files[0];
        const selectedType = document.querySelector('input[name="decryptType"]:checked').value;
        
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
        
        decryptPreview.classList.remove('hidden');
        decryptPreviewImage.classList.add('hidden');
        decryptPreviewAudio.classList.add('hidden');
        decryptPreviewVideo.classList.add('hidden');
        
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function(e) {
                decryptPreviewImage.src = e.target.result;
                decryptPreviewImage.classList.remove('hidden');
            }
            reader.readAsDataURL(file);
        } else if (file.type.startsWith('audio/')) {
            const reader = new FileReader();
            reader.onload = function(e) {
                decryptPreviewAudio.src = e.target.result;
                decryptPreviewAudio.classList.remove('hidden');
            }
            reader.readAsDataURL(file);
        } else if (file.type.startsWith('video/')) {
            const reader = new FileReader();
            reader.onload = function(e) {
                decryptPreviewVideo.src = e.target.result;
                decryptPreviewVideo.classList.remove('hidden');
            }
            reader.readAsDataURL(file);
        }
        
        decryptPreviewText.textContent = `File size: ${formatFileSize(file.size)}`;
    }
}

function removeFile() {
    const fileInput = document.getElementById('decryptFile');
    const fileInfo = document.getElementById('fileInfo');
    const fileName = document.getElementById('fileName');
    const decryptPreview = document.getElementById('decryptPreview');
    
    fileInput.value = '';
    fileName.textContent = 'No file selected';
    fileInfo.classList.add('hidden');
    decryptPreview.classList.add('hidden');
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function copyDecryptedText() {
    const textArea = document.getElementById('decryptedTextOutput');
    const copyButton = document.getElementById('copyButton');
    const originalText = copyButton.innerHTML;

    navigator.clipboard.writeText(textArea.value).then(() => {
        copyButton.innerHTML = '<i class="fas fa-check mr-2"></i><span>Copied!</span>';
        copyButton.classList.remove('bg-blue-500', 'hover:bg-blue-600');
        copyButton.classList.add('bg-green-500', 'hover:bg-green-600');

        setTimeout(() => {
            copyButton.innerHTML = originalText;
            copyButton.classList.remove('bg-green-500', 'hover:bg-green-600');
            copyButton.classList.add('bg-blue-500', 'hover:bg-blue-600');
        }, 2000);
    }).catch(() => {
        copyButton.innerHTML = '<i class="fas fa-times mr-2"></i><span>Failed to copy</span>';
        copyButton.classList.remove('bg-blue-500', 'hover:bg-blue-600');
        copyButton.classList.add('bg-red-500', 'hover:bg-red-600');

        setTimeout(() => {
            copyButton.innerHTML = originalText;
            copyButton.classList.remove('bg-red-500', 'hover:bg-red-600');
            copyButton.classList.add('bg-blue-500', 'hover:bg-blue-600');
        }, 2000);
    });
}

function handleDecryptSuccess(data) {
    const outputSection = document.getElementById('decryptOutput');
    const textOutputArea = document.getElementById('textOutputArea');
    const fileInfoOutput = document.getElementById('fileInfoOutput');
    const outputFileName = document.getElementById('outputFileName');
    const fileTypeIcon = document.getElementById('fileTypeIcon');
    const downloadLink = document.getElementById('decryptedFileLink');

    outputSection.classList.remove('hidden');

    if (data.decrypted_text) {
        textOutputArea.classList.remove('hidden');
        fileInfoOutput.classList.add('hidden');
        document.getElementById('decryptedTextOutput').value = data.decrypted_text;
    } else {
        textOutputArea.classList.add('hidden');
        fileInfoOutput.classList.remove('hidden');
        outputFileName.textContent = data.filename;
        updateFileTypeIcon(fileTypeIcon, data.filename);
    }

    if (downloadLink) {
        downloadLink.href = data.download_url;
    }
    showCustomAlert('Decryption successful!', 'success');
}

function updateFileTypeIcon(iconElement, filename) {
    const extension = filename.split('.').pop().toLowerCase();
    const iconClass = {
        'txt': 'fa-file-text',
        'doc': 'fa-file-word',
        'docx': 'fa-file-word',
        'pdf': 'fa-file-pdf',
        'jpg': 'fa-file-image',
        'jpeg': 'fa-file-image',
        'png': 'fa-file-image',
        'gif': 'fa-file-image',
        'mp3': 'fa-file-audio',
        'wav': 'fa-file-audio',
        'mp4': 'fa-file-video',
        'avi': 'fa-file-video',
    }[extension] || 'fa-file';

    iconElement.className = `fas ${iconClass} mr-2 text-red-500`;
}

document.addEventListener('DOMContentLoaded', updateFileInputAcceptType);

function decryptFile() {
    const fileInput = document.getElementById('decryptFile');
    const textInput = document.getElementById('decryptText');
    const keyInput = document.getElementById('decryptKey');
    
    if (!fileInput.files[0] && !textInput.value.trim()) {
        showCustomAlert('Please either select a file or enter encrypted text');
        return;
    }
    
    if (!keyInput.value.trim()) {
        showCustomAlert('Please enter the decryption key');
        return;
    }

    const button = document.querySelector('button[onclick="decryptFile()"]');
    const loadingSpan = button.querySelector('.loading');
    const normalSpan = button.querySelector('.normal');
    loadingSpan.classList.remove('hidden');
    normalSpan.classList.add('hidden');
    button.disabled = true;

    const formData = new FormData();
    if (fileInput.files[0]) {
        formData.append('file', fileInput.files[0]);
    } else {
        const textBlob = new Blob([textInput.value], { type: 'text/plain' });
        formData.append('file', textBlob, 'encrypted.txt');
    }
    formData.append('key', keyInput.value);

    fetch('/decrypt', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            throw new Error(data.error);
        }
        handleDecryptSuccess(data);
    })
    .catch(error => {
        showCustomAlert('Decryption failed: ' + error.message);
    })
    .finally(() => {
        loadingSpan.classList.add('hidden');
        normalSpan.classList.remove('hidden');
        button.disabled = false;
    });
}