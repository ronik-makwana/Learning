# Single File Upload

A simple file upload application using **React, Node.js, Express, and Multer**.

The application allows a user to select a single image file from the browser and upload it to a Node.js server, where the file is stored on the server's local filesystem.

---

## Project Structure

```text
01-single-file/
│
├── client/
│   ├── src/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
├── server/
│   ├── uploads/
│   ├── server.js
│   └── package.json
│
└── README.md
```

---

## Tech Stack

### Frontend

* React
* Vite
* Axios
* FormData API

### Backend

* Node.js
* Express
* Multer
* ES Modules

### Storage

Local filesystem.

Uploaded files are stored inside:

```text
server/uploads/
```

---

# Architecture

```text
┌──────────────┐
│    React     │
│   Frontend   │
└──────┬───────┘
       │
       │ multipart/form-data
       ▼
┌──────────────┐
│   Express    │
│    Server    │
└──────┬───────┘
       │
       │ Multer
       ▼
┌──────────────┐
│  Local Disk  │
│   uploads/   │
└──────────────┘
```

---

# How Upload Works

The complete flow is:

```text
User selects a file
        ↓
React receives File object
        ↓
Create FormData
        ↓
Send POST request
        ↓
Express receives request
        ↓
Multer processes multipart/form-data
        ↓
Multer saves file to uploads/
        ↓
Server sends response
```

---

# Frontend

The user selects a file using:

```jsx
<input
    type="file"
    accept="image/jpeg,image/png"
    onChange={handleFileChange}
/>
```

The selected file is available through:

```js
const selectedFile = event.target.files[0];
```

The browser provides a `File` object containing information such as:

```text
name
size
type
lastModified
```

---

## Creating FormData

The selected file is added to `FormData`:

```js
const formData = new FormData();

formData.append("file", file);
```

The field name is:

```text
file
```

The request is then sent to the backend:

```js
await axios.post(
    "http://localhost:5000/api/upload",
    formData
);
```

The browser automatically sends the request as:

```text
multipart/form-data
```

---

# Backend

The backend uses Express and Multer.

The upload route is:

```js
app.post(
    "/api/upload",
    upload.single("file"),
    (req, res) => {
        // ...
    }
);
```

The important part is:

```js
upload.single("file")
```

This tells Multer:

> Expect exactly one uploaded file with the field name `file`.

The frontend and backend field names must match:

```text
Frontend                         Backend

formData.append("file", file)
             │
             └──────────────→ upload.single("file")
```

---

# Multer

Multer is middleware used to handle:

```text
multipart/form-data
```

It processes the incoming file and makes the uploaded file available through:

```js
req.file
```

For example:

```js
console.log(req.file);
```

may produce information similar to:

```js
{
    fieldname: "file",
    originalname: "profile.jpg",
    encoding: "7bit",
    mimetype: "image/jpeg",
    destination: ".../uploads",
    filename: "1726312345678-profile.jpg",
    path: ".../uploads/1726312345678-profile.jpg",
    size: 245678
}
```

---

# Multer Disk Storage

This project uses:

```js
multer.diskStorage()
```

Example:

```js
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },

    filename: (req, file, cb) => {
        const uniqueName =
            `${Date.now()}-${file.originalname}`;

        cb(null, uniqueName);
    }
});
```

There are two important functions.

### Destination

```js
destination: (req, file, cb) => {
    cb(null, uploadDir);
}
```

This specifies where the file should be stored.

In this project:

```text
server/uploads/
```

### Filename

```js
filename: (req, file, cb) => {
    const uniqueName =
        `${Date.now()}-${file.originalname}`;

    cb(null, uniqueName);
}
```

This generates a unique filename using the current timestamp.

For example:

```text
profile.jpg
```

becomes:

```text
1726312345678-profile.jpg
```

---

# File Validation

Only JPEG and PNG files are allowed.

```js
const allowedTypes = [
    "image/jpeg",
    "image/png"
];
```

Multer checks the MIME type:

```js
fileFilter: (req, file, cb) => {
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error("Only JPG and PNG files are allowed"));
    }
}
```

If the file type is not allowed, the upload is rejected.

---

# File Size Limit

The maximum file size is:

```text
5 MB
```

Configured using:

```js
limits: {
    fileSize: 5 * 1024 * 1024
}
```

This prevents users from uploading files larger than the configured limit.

---

# API

## Upload File

### Endpoint

```http
POST /api/upload
```

### Content Type

```text
multipart/form-data
```

### Field

```text
file
```

### Example Response

```json
{
    "message": "File uploaded successfully",
    "file": {
        "originalName": "profile.jpg",
        "filename": "1726312345678-profile.jpg",
        "size": 245678,
        "mimeType": "image/jpeg",
        "path": "/uploads/1726312345678-profile.jpg"
    }
}
```

---

# Running the Project

The frontend and backend run separately.

## Start Backend

Open a terminal:

```bash
cd server
npm install
npm run dev
```

The server runs on:

```text
http://localhost:5000
```

---

## Start Frontend

Open another terminal:

```bash
cd client
npm install
npm run dev
```

The frontend runs on:

```text
http://localhost:5173
```

---

# Testing the Upload

Open:

```text
http://localhost:5173
```

Then:

1. Click the file input.
2. Select a JPG or PNG image.
3. Click **Upload**.
4. The frontend sends the file to the backend.
5. Multer processes the upload.
6. The file is saved inside:

```text
server/uploads/
```

Example:

```text
server/
└── uploads/
    └── 1726312345678-profile.jpg
```

---

# Error Handling

The server handles errors such as:

### No file

```text
No file uploaded
```

### Invalid file type

```text
Only JPG and PNG files are allowed
```

### File too large

The upload is rejected when the file exceeds the configured `5 MB` limit.

---

# Important Concepts

## `File`

The browser provides the selected file as a JavaScript `File` object.

```js
const file = event.target.files[0];
```

---

## `FormData`

Used to send files from the browser:

```js
const formData = new FormData();

formData.append("file", file);
```

---

## `multipart/form-data`

Files are not normally sent as JSON.

File uploads use:

```text
multipart/form-data
```

---

## `upload.single()`

Multer's:

```js
upload.single("file")
```

means:

> Accept one file from the `file` field.

The uploaded file becomes:

```js
req.file
```

---

## `diskStorage()`

Multer's:

```js
multer.diskStorage()
```

stores the uploaded file directly on the server's filesystem.

---

# Key Takeaways

This project demonstrates the complete basic single-file upload flow:

```text
React
  ↓
File object
  ↓
FormData
  ↓
multipart/form-data
  ↓
Express
  ↓
Multer
  ↓
req.file
  ↓
Local filesystem
```

The main concepts covered are:

* React file input
* Browser `File` object
* `FormData`
* `multipart/form-data`
* Axios file upload
* Express upload endpoint
* Multer
* `upload.single()`
* `multer.diskStorage()`
* `req.file`
* File type validation
* File size limits
* Local file storage
* Upload error handling
