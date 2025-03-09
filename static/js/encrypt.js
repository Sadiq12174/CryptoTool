function handleFileSelect(input) {
    const fileInfo = document.getElementById('fileInfo');
    const fileName = document.getElementById('fileName');
    
    if (input.files && input.files[0]) {
        fileName.textContent = input.files[0].name;
        fileInfo.classList.remove('hidden');
    }
}

function removeFile() {
    const fileInput = document.getElementById('encryptFile');
    const fileInfo = document.getElementById('fileInfo');
    const fileName = document.getElementById('fileName');
    
    fileInput.value = '';
    fileName.textContent = 'No file selected';
    fileInfo.classList.add('hidden');
}

function encryptFile() {
    const fileInput = document.getElementById('encryptFile');
    const textInput = document.getElementById('encryptText');
    const keyInput = document.getElementById('encryptKey');
    const algorithm = document.getElementById('encryptAlgorithm').value;
    const selectedType = document.querySelector('input[name="encryptType"]:checked').value;
    const outputContainer = document.getElementById('encryptOutput');
    
    if (!fileInput.files[0] && !textInput.value.trim()) {
        showCustomAlert('Please either select a file or enter text to encrypt');
        return;
    }
    
    if (!keyInput.value.trim()) {
        showCustomAlert('Please enter an encryption key');
        return;
    }

    const button = document.querySelector('button[onclick="encryptFile()"]');
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
        formData.append('file', textBlob, 'text.txt');
    }
    formData.append('key', keyInput.value);
    formData.append('type', selectedType);

    fetch('/encrypt', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            throw new Error(data.error);
        }
        handleEncryptSuccess(data);
    })
    .catch(error => {
        showCustomAlert('Encryption failed: ' + error.message);
    })
    .finally(() => {
        loadingSpan.classList.add('hidden');
        normalSpan.classList.remove('hidden');
        button.disabled = false;
    });
}

function handleEncryptSuccess(data) {
    const outputSection = document.getElementById('encryptOutput');
    const textOutputArea = document.getElementById('textOutputArea');
    const fileInfoOutput = document.getElementById('fileInfoOutput');
    const outputFileName = document.getElementById('outputFileName');
    const fileTypeIcon = document.getElementById('fileTypeIcon');
    const downloadLink = document.getElementById('encryptedFileLink');

    outputSection.classList.remove('hidden');

    if (data.encrypted_text) {
        textOutputArea.classList.remove('hidden');
        fileInfoOutput.classList.add('hidden');
        document.getElementById('encryptedTextOutput').value = data.encrypted_text;
    } else {
        textOutputArea.classList.add('hidden');
        fileInfoOutput.classList.remove('hidden');
        outputFileName.textContent = data.filename;
        updateFileTypeIcon(fileTypeIcon, data.filename);
    }

    if (downloadLink) {
        downloadLink.href = data.download_url;
    }
    showCustomAlert('Encryption successful!', 'success');
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

    iconElement.className = `fas ${iconClass} mr-2 text-blue-500`;
}

function copyEncryptedText() {
    const textArea = document.getElementById('encryptedTextOutput');
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