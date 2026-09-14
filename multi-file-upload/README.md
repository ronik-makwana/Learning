# Multiple File Upload

A simple multiple file upload application using **React, Node.js, Express, and Multer**.

The application allows a user to select multiple image files from the browser and upload them together to a Node.js server, where the files are stored on the server's local filesystem.

---

## Project Structure

```text
multi-file-upload/
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
* CORS
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
       │ multiple files
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
User selects multiple files
        ↓
React receives File objects
        ↓
Create FormData
        ↓
Append each file using "files"
        ↓
Send POST request
        ↓
Express receives request
        ↓
Multer processes multipart/form-data
        ↓
Multer saves files to uploads/
        ↓
Server sends response
```

---

# Frontend

The user can select multiple files using:

```jsx
<input
    type="file"
    accept="image/jpeg,image/png"
    multiple
    onChange={handleFileChange}
/>
```

The important attribute is:

```text
multiple
```

It allows the user to select more than one file.

The selected files are available through:

```js
const selectedFiles = event.target.files;
```

`event.target.files` contains a `FileList`.

For example:

```text
FileList
│
├── profile.jpg
├── photo.png
└── image.jpg
```

Each item is a browser `File` object containing information such as:

```text
name
size
type
lastModified
```

---

# Creating FormData

The selected files are added to `FormData`.

```js
const formData = new FormData();

selectedFiles.forEach((file) => {
    formData.append("files", file);
});
```

Notice that every file uses the same field name:

```text
files
```

For example:

```text
FormData
│
├── files → profile.jpg
├── files → photo.png
└── files → image.jpg
```

The request is then sent to the backend:

```js
await axios.post(
    "http://localhost:5001/api/upload",
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
    upload.array("files", 10),
    (req, res) => {
        // ...
    }
);
```

The important part is:

```js
upload.array("files", 10)
```

This tells Multer:

> Expect multiple uploaded files with the field name `files`.

The second argument:

```text
10
```

means:

> Allow a maximum of 10 files in a single request.

The frontend and backend field names must match:

```text
Frontend                         Backend

formData.append("files", file)
             │
             └──────────────→ upload.array("files", 10)
```

---

# Multer

Multer is middleware used to handle:

```text
multipart/form-data
```

It processes the incoming files and makes the uploaded files available through:

```js
req.files
```

For example:

```js
console.log(req.files);
```

may produce information similar to:

```js
[
    {
        fieldname: "files",
        originalname: "profile.jpg",
        encoding: "7bit",
        mimetype: "image/jpeg",
        destination: ".../uploads",
        filename: "1726312345678-profile.jpg",
        path: ".../uploads/1726312345678-profile.jpg",
        size: 245678
    },
    {
        fieldname: "files",
        originalname: "photo.png",
        encoding: "7bit",
        mimetype: "image/png",
        destination: ".../uploads",
        filename: "1726312345689-photo.png",
        path: ".../uploads/1726312345689-photo.png",
        size: 189234
    }
]
```

Unlike single-file upload:

```js
req.file
```

is used for one file.

For multiple files:

```js
req.files
```

is used.

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

This specifies where the files should be stored.

In this project:

```text
server/uploads/
```

All uploaded files are stored inside this directory.

---

### Filename

```js
filename: (req, file, cb) => {
    const uniqueName =
        `${Date.now()}-${file.originalname}`;

    cb(null, uniqueName);
}
```

This generates a filename using the current timestamp.

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

Each uploaded file is checked individually.

For example:

```text
profile.jpg  → Allowed
photo.png    → Allowed
document.pdf → Rejected
```

---

# File Size Limit

The maximum file size is:

```text
5 MB per file
```

Configured using:

```js
limits: {
    fileSize: 5 * 1024 * 1024,
    files: 10
}
```

This means:

```text
Maximum files = 10
Maximum size  = 5 MB per file
```

---

# API

## Upload Multiple Files

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
files
```

### Maximum Files

```text
10
```

### Example Response

```json
{
    "message": "Files uploaded successfully",
    "count": 3,
    "files": [
        {
            "originalName": "image1.jpg",
            "filename": "1726312345678-image1.jpg",
            "size": 245678,
            "mimeType": "image/jpeg",
            "path": "/uploads/1726312345678-image1.jpg"
        }
    ]
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
http://localhost:5001
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
2. Select multiple JPG or PNG images.
3. Click **Upload**.
4. The frontend creates a `FormData` object.
5. Each file is added using the `files` field.
6. The frontend sends the request to the backend.
7. Multer processes the uploaded files.
8. The files are saved inside:

```text
server/uploads/
```

Example:

```text
server/
└── uploads/
    ├── 1726312345678-profile.jpg
    ├── 1726312345680-photo.png
    └── 1726312345682-image.jpg
```

---

# CORS

The backend allows requests from any origin:

```js
app.use(cors({
    origin: "*"
}));
```

This allows the React frontend running on:

```text
http://localhost:5173
```

to communicate with the backend running on:

```text
http://localhost:5001
```

---

# Error Handling

The server handles errors such as:

### No files

```text
No files uploaded
```

### Invalid file type

```text
Only JPG and PNG files are allowed
```

### Too many files

The upload is rejected when more than:

```text
10 files
```

are uploaded in a single request.

### File too large

The upload is rejected when any file exceeds:

```text
5 MB
```

---

# Important Concepts

## `FileList`

When multiple files are selected:

```js
const files = event.target.files;
```

the browser returns a `FileList`.

Example:

```text
FileList
│
├── File
├── File
└── File
```

---

## `multiple`

The HTML `multiple` attribute allows selecting multiple files:

```jsx
<input
    type="file"
    multiple
/>
```

Without `multiple`, the user can select only one file.

---

## `FormData`

Used to send files from the browser:

```js
const formData = new FormData();

files.forEach((file) => {
    formData.append("files", file);
});
```

The same field name can contain multiple files.

---

## `multipart/form-data`

Files are not normally sent as JSON.

File uploads use:

```text
multipart/form-data
```

---

## `upload.array()`

Multer's:

```js
upload.array("files", 10)
```

means:

> Accept multiple files from the `files` field, with a maximum of 10 files.

The uploaded files become:

```js
req.files
```

---

## `req.files`

For multiple-file uploads:

```js
req.files
```

contains an array of uploaded files.

Example:

```js
req.files.map((file) => {
    console.log(file.originalname);
});
```

---

## `diskStorage()`

Multer's:

```js
multer.diskStorage()
```

stores the uploaded files directly on the server's filesystem.

---

# Single File vs Multiple File

The main difference is the Multer method and request data.

### Single File

```js
upload.single("file")
```

Access:

```js
req.file
```

---

### Multiple Files

```js
upload.array("files", 10)
```

Access:

```js
req.files
```

---

# Key Takeaways

This project demonstrates the complete basic multiple-file upload flow:

```text
React
  ↓
FileList
  ↓
Multiple File objects
  ↓
FormData
  ↓
multipart/form-data
  ↓
Express
  ↓
Multer
  ↓
req.files
  ↓
Local filesystem
```

The main concepts covered are:

* React multiple file input
* `multiple` attribute
* Browser `FileList`
* Browser `File` objects
* `FormData`
* `multipart/form-data`
* Axios file upload
* Express upload endpoint
* Multer
* `upload.array()`
* `req.files`
* `multer.diskStorage()`
* Multiple file validation
* File type validation
* File size limits
* Maximum file count
* Local file storage
* CORS
* Upload error handling
