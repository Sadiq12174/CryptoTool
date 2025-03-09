import os
import hashlib
import base64
from flask import Flask, render_template, request, jsonify, send_from_directory, url_for, send_file
from cryptography.fernet import Fernet
from werkzeug.utils import secure_filename
from datetime import datetime
import shutil

app = Flask(__name__)
# Configure upload folders
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads")
ENCRYPTED_FOLDER = os.path.join(UPLOAD_FOLDER, "encrypted")
DECRYPTED_FOLDER = os.path.join(UPLOAD_FOLDER, "decrypted")
TEMP_FOLDER = os.path.join(UPLOAD_FOLDER, "temp")

# Create necessary directories
for folder in [UPLOAD_FOLDER, ENCRYPTED_FOLDER, DECRYPTED_FOLDER, TEMP_FOLDER]:
    os.makedirs(folder, exist_ok=True)

# File configuration
ALLOWED_EXTENSIONS = {
    'text': {'txt', 'doc', 'docx', 'pdf'},
    'image': {'png', 'jpg', 'jpeg', 'gif'},
    'audio': {'mp3', 'wav', 'ogg'},
    'video': {'mp4', 'avi', 'mkv'}
}
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

def allowed_file(filename, file_type):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS.get(file_type, set())

def derive_key(user_key):
    return base64.urlsafe_b64encode(hashlib.sha256(user_key.encode()).digest())

def generate_hash(file_path, algorithm):
    BLOCK_SIZE = 65536
    hash_func = getattr(hashlib, algorithm.lower())()
    
    with open(file_path, 'rb') as f:
        for block in iter(lambda: f.read(BLOCK_SIZE), b''):
            hash_func.update(block)
    return hash_func.hexdigest()

def encrypt_file(input_path, output_path, key):
    f = Fernet(derive_key(key))
    with open(input_path, 'rb') as file:
        file_data = file.read()
    encrypted_data = f.encrypt(file_data)
    with open(output_path, 'wb') as file:
        file.write(encrypted_data)

def decrypt_file(input_path, output_path, key):
    f = Fernet(derive_key(key))
    with open(input_path, 'rb') as file:
        encrypted_data = file.read()
    try:
        decrypted_data = f.decrypt(encrypted_data)
        with open(output_path, 'wb') as file:
            file.write(decrypted_data)
        return True
    except Exception as e:
        print(f"Decryption error: {e}")
        return False
# Add these functions after the existing helper functions
def encrypt_text(text, key):
    f = Fernet(derive_key(key))
    encrypted_data = f.encrypt(text.encode())
    return encrypted_data.decode()

def decrypt_text(encrypted_text, key):
    try:
        f = Fernet(derive_key(key))
        decrypted_data = f.decrypt(encrypted_text.encode())
        return decrypted_data.decode()
    except Exception as e:
        print(f"Text decryption error: {e}")
        return None

# Update the encrypt route
@app.route('/encrypt', methods=['POST'])
def encrypt():
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    key = request.form.get('key')
    file_type = request.form.get('type', 'text')
    
    if not file or not key:
        return jsonify({'error': 'Missing file or key'}), 400

    try:
        # Check if it's a text input
        if file.filename == 'text.txt':
            text_content = file.read().decode()
            encrypted_text = encrypt_text(text_content, key)
            return jsonify({
                'message': 'Text encrypted successfully',
                'encrypted_text': encrypted_text
            })
        
        # Handle file encryption
        if not allowed_file(file.filename, file_type):
            return jsonify({'error': 'File type not allowed'}), 400

        filename = secure_filename(file.filename)
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        temp_path = os.path.join(TEMP_FOLDER, filename)
        encrypted_filename = f'encrypted_{timestamp}_{filename}'
        encrypted_path = os.path.join(ENCRYPTED_FOLDER, encrypted_filename)
        
        file.save(temp_path)
        encrypt_file(temp_path, encrypted_path, key)
        os.remove(temp_path)
        
        return jsonify({
            'message': 'File encrypted successfully',
            'filename': encrypted_filename,
            'download_url': url_for('download_file', folder='encrypted', filename=encrypted_filename)
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500
# Add these routes after your existing routes and before if __name__ == "__main__":

@app.route('/encrypt')
def encrypt_page():
    return render_template('encrypt.html')

@app.route('/decrypt')
def decrypt_page():
    return render_template('decrypt.html')

@app.route('/hash')
def hash_page():
    return render_template('hash.html')

@app.route('/encrypt-hash')
def encrypt_hash_page():
    return render_template('encrypt-hash.html')

@app.route('/')
def index():
    return render_template('index.html')
# Update the decrypt route
@app.route('/decrypt', methods=['POST'])
def decrypt():
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    key = request.form.get('key')
    
    if not file or not key:
        return jsonify({'error': 'Missing file or key'}), 400

    try:
        # Check if it's a text input
        if file.filename == 'encrypted.txt':
            encrypted_text = file.read().decode()
            decrypted_text = decrypt_text(encrypted_text, key)
            if decrypted_text is None:
                return jsonify({'error': 'Invalid key or corrupted text'}), 400
            
            return jsonify({
                'message': 'Text decrypted successfully',
                'decrypted_text': decrypted_text
            })
        
        # Handle file decryption
        filename = secure_filename(file.filename)
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        temp_path = os.path.join(TEMP_FOLDER, filename)
        decrypted_filename = f'decrypted_{timestamp}_{filename.replace("encrypted_", "", 1)}'
        decrypted_path = os.path.join(DECRYPTED_FOLDER, decrypted_filename)
        
        file.save(temp_path)
        if not decrypt_file(temp_path, decrypted_path, key):
            os.remove(temp_path)
            return jsonify({'error': 'Invalid key or corrupted file'}), 400
        
        os.remove(temp_path)
        return jsonify({
            'message': 'File decrypted successfully',
            'filename': decrypted_filename,
            'download_url': url_for('download_file', folder='decrypted', filename=decrypted_filename)
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/hash', methods=['POST'])
def hash_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    algorithm = request.form.get('algorithm', 'sha256')
    file_type = request.form.get('type', 'text')
    
    if not file:
        return jsonify({'error': 'No file provided'}), 400
    
    if not allowed_file(file.filename, file_type):
        return jsonify({'error': 'File type not allowed'}), 400

    try:
        filename = secure_filename(file.filename)
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        temp_path = os.path.join(TEMP_FOLDER, filename)
        hashed_filename = f'hashed_{timestamp}_{filename}'
        hashed_path = os.path.join(UPLOAD_FOLDER, hashed_filename)
        
        file.save(temp_path)
        file_hash = generate_hash(temp_path, algorithm)
        
        # Save original file with hash in a text file
        with open(hashed_path, 'w') as f:
            f.write(f"Original file: {filename}\n")
            f.write(f"Algorithm: {algorithm}\n")
            f.write(f"Hash: {file_hash}\n")
            f.write(f"Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        
        os.remove(temp_path)
        
        return jsonify({
            'message': 'Hash generated successfully',
            'hash': file_hash,
            'download_url': url_for('download_file', folder='uploads', filename=hashed_filename)
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/encrypt-hash', methods=['POST'])
def encrypt_and_hash():
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    key = request.form.get('key')
    encrypt_algorithm = request.form.get('encryptAlgorithm', 'aes')
    hash_algorithm = request.form.get('hashAlgorithm', 'sha256')
    file_type = request.form.get('type', 'text')
    
    if not file or not key:
        return jsonify({'error': 'Missing file or key'}), 400
    
    if not allowed_file(file.filename, file_type):
        return jsonify({'error': 'File type not allowed'}), 400

    try:
        filename = secure_filename(file.filename)
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        temp_path = os.path.join(TEMP_FOLDER, filename)
        encrypted_filename = f'encrypted_{timestamp}_{filename}'
        encrypted_path = os.path.join(ENCRYPTED_FOLDER, encrypted_filename)
        
        file.save(temp_path)
        # Generate hash before encryption
        file_hash = generate_hash(temp_path, hash_algorithm)
        # Encrypt the file
        encrypt_file(temp_path, encrypted_path, key)
        os.remove(temp_path)
        
        return jsonify({
            'message': 'File encrypted and hashed successfully',
            'filename': encrypted_filename,
            'hash': file_hash,
            'download_url': url_for('download_file', folder='encrypted', filename=encrypted_filename)
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/download/<folder>/<filename>')
def download_file(folder, filename):
    if folder == 'encrypted':
        directory = ENCRYPTED_FOLDER
    elif folder == 'decrypted':
        directory = DECRYPTED_FOLDER
    elif folder == 'uploads':
        directory = UPLOAD_FOLDER
    else:
        return jsonify({'error': 'Invalid folder'}), 400
        
    return send_file(os.path.join(directory, filename), as_attachment=True)

@app.errorhandler(413)
def too_large(e):
    return jsonify({'error': 'File is too large. Maximum size is 16MB'}), 413

if __name__ == "__main__":
    app.run(debug=True)
