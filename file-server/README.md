# File Server API Documentation

## Overview
This is a Node.js file server with Express, Multer, and Sharp for file uploading, image compression, and management. The server allows clients to upload, download, view, and delete files.

## Features
- File upload with automatic compression for images
- File listing
- File download
- File deletion
- CORS enabled for cross-origin requests

## Installation & Setup

### Prerequisites
- Node.js installed

### Steps
1. Clone the repository:
   ```sh
   git clone <repository-url>
   cd <project-folder>
   ```
2. Install dependencies:
   ```sh
   npm install
   ```
3. Start the server:
   ```sh
   node server.js
   ```
4. The server will run on `http://localhost:8082`

## API Endpoints

### 1. Upload File
- **Endpoint:** `POST /upload`
- **Request:** Multipart/form-data with a field named `file`
- **Response:**
  ```json
  {
    "message": "File uploaded and compressed successfully",
    "filename": "compressed-<uuid>-<originalname>"
  }
  ```
- **Example Curl Request:**
  ```sh
  curl -X POST -F "file=@path/to/your/file.jpg" http://localhost:8082/upload
  ```

### 2. Get File List
- **Endpoint:** `GET /files`
- **Response:**
  ```json
  ["file1.jpg", "file2.png"]
  ```

### 3. Download File
- **Endpoint:** `GET /download/:filename`
- **Example:**
  ```sh
  curl -O http://localhost:8082/download/compressed-file.jpg
  ```

### 4. Delete File
- **Endpoint:** `DELETE /delete/:filename`
- **Response:**
  ```json
  {
    "message": "File deleted successfully"
  }
  ```
- **Example:**
  ```sh
  curl -X DELETE http://localhost:8082/delete/compressed-file.jpg
  ```

## Client Integration Guide

### JavaScript (Axios Example)

#### Upload File
```js
const formData = new FormData();
formData.append('file', fileInput.files[0]);
fetch('http://localhost:8082/upload', {
  method: 'POST',
  body: formData
})
  .then(response => response.json())
  .then(data => console.log(data));
```

#### List Files
```js
fetch('http://localhost:8082/files')
  .then(response => response.json())
  .then(files => console.log(files));
```

#### Download File
```js
window.location.href = 'http://localhost:8082/download/compressed-file.jpg';
```

#### Delete File
```js
fetch('http://localhost:8082/delete/compressed-file.jpg', { method: 'DELETE' })
  .then(response => response.json())
  .then(data => console.log(data));
```

## Notes
- Only image files (JPEG, PNG, WEBP) are compressed.
- Other file types are stored as is.
- Ensure the `/uploads` directory has proper read/write permissions.

## License
This project is open-source and free to use.

