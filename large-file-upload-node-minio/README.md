# Large File Upload

A simple large file upload application using **React, Node.js, Express, Axios, and MinIO**.

The application allows a user to select a large file from the browser and upload it to a Node.js server using a **stream-based HTTP upload**. The Node.js server passes the incoming request stream directly to MinIO, where the file is stored as an object.

---

## Project Structure

```text
large-file-upload-node-minio/
│
├── client/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   └── main.jsx
│   ├── Dockerfile
│   └── package.json
│
├── server/
│   ├── src/
│   │   ├── config/
│   │   │   └── minio.js
│   │   │
│   │   ├── controllers/
│   │   │   └── upload.controller.js
│   │   │
│   │   ├── routes/
│   │   │   └── upload.routes.js
│   │   │
│   │   ├── services/
│   │   │   └── upload.service.js
│   │   │
│   │   ├── app.js
│   │   └── server.js
│   │
│   ├── Dockerfile
│   ├── .env
│   └── package.json
│
├── docker-compose.yml
└── README.md
```

---

## Tech Stack

### Frontend

* React
* Vite
* Axios
* File API

### Backend

* Node.js
* Express
* Node.js Streams
* ES Modules
* CORS

### Storage

* MinIO
* Object Storage

### Infrastructure

* Docker
* Docker Compose

---

# Architecture

```text
┌──────────────────┐
│      React       │
│     Frontend     │
│                  │
│   Select File    │
│   Progress Bar   │
└────────┬─────────┘
         │
         │ Axios
         │ File as HTTP body
         ▼
┌──────────────────┐
│     Node.js      │
│     Express      │
│                  │
│    req Stream    │
└────────┬─────────┘
         │
         │ Readable Stream
         ▼
┌──────────────────┐
│      MinIO       │
│                  │
│  Object Storage  │
└──────────────────┘
```

---

# How Upload Works

The complete flow is:

```text
User selects file
        ↓
React receives File object
        ↓
Axios sends File as request body
        ↓
Express receives HTTP request
        ↓
req is a Readable Stream
        ↓
Node passes req to MinIO
        ↓
MinIO stores the object
        ↓
Node receives successful result
        ↓
Server returns HTTP 201
        ↓
React displays upload success
```

---

# Frontend

The user selects a file using:

```jsx
<input
    type="file"
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

Example:

```text
File
│
├── name: video.mp4
├── size: 1 GB
├── type: video/mp4
└── lastModified: ...
```

---

# Sending the File

Unlike a traditional `FormData` upload, this project sends the `File` directly as the HTTP request body.

```js
await axios.post(
    `${API_URL}/api/upload`,
    file,
    {
        headers: {
            "x-file-name": file.name,
            "Content-Type":
                file.type || "application/octet-stream"
        }
    }
);
```

The important part is:

```js
file
```

is passed directly to Axios.

There is no:

```text
FormData
```

and no:

```text
Multer
```

in this upload flow.

---

# Node.js Request Stream

When the request reaches Express:

```js
req
```

represents the incoming HTTP request.

The request body is available as a **Readable Stream**.

Instead of loading the complete file into memory, the server can consume the incoming data as it arrives.

Conceptually:

```text
Browser
   ↓
File
   ↓
HTTP Request
   ↓
┌─────────────┐
│ Chunk       │
│ Chunk       │
│ Chunk       │
│ Chunk       │
└──────┬──────┘
       ↓
    Node req
       ↓
     MinIO
```

---

# Streaming to MinIO

The important part of the backend is:

```js
await minioClient.putObject(
    bucketName,
    fileName,
    stream
);
```

The `stream` passed to the service is the Node.js request:

```js
await uploadFileToMinio(
    fileName,
    req
);
```

So internally the flow is:

```text
req
 ↓
Readable Stream
 ↓
MinIO putObject()
 ↓
Object Storage
```

The application does not manually read the entire file into a Buffer.

---

# Backend Structure

The backend is divided into several layers.

```text
Request
   ↓
Route
   ↓
Controller
   ↓
Service
   ↓
MinIO
```

---

## Route

```js
router.post("/upload", uploadFile);
```

The endpoint is:

```text
POST /api/upload
```

---

## Controller

The controller gets the filename from the request header:

```js
const fileName = req.headers["x-file-name"];
```

Then it passes the request stream to the service:

```js
const result = await uploadFileToMinio(
    fileName,
    req
);
```

The controller is responsible for the HTTP response.

---

## Service

The service communicates with MinIO:

```js
await minioClient.putObject(
    bucketName,
    fileName,
    stream
);
```

The service does not need to know anything about React or the browser.

---

# MinIO

MinIO is used as the object storage layer.

The server creates a MinIO client:

```js
const minioClient = new Minio.Client({
    endPoint: process.env.MINIO_ENDPOINT,
    port: Number(process.env.MINIO_PORT),
    useSSL: process.env.MINIO_USE_SSL === "true",
    accessKey: process.env.MINIO_ROOT_USER,
    secretKey: process.env.MINIO_ROOT_PASSWORD
});
```

---

# Bucket Initialization

When the server starts, it checks whether the bucket exists.

```js
const exists =
    await minioClient.bucketExists(bucketName);
```

If the bucket does not exist:

```js
await minioClient.makeBucket(bucketName);
```

The configured bucket is:

```text
large-files
```

Therefore, the application automatically creates the bucket when necessary.

---

# Environment Variables

The server uses:

```env
PORT=5001

MINIO_ENDPOINT=minio
MINIO_PORT=9000
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin123
MINIO_BUCKET=large-files
MINIO_USE_SSL=false
```

Inside Docker Compose, the Node.js server connects to:

```text
minio:9000
```

The hostname:

```text
minio
```

is the Docker Compose service name.

---

# Upload Progress

Axios provides:

```js
onUploadProgress
```

while the browser is sending the file.

```js
onUploadProgress: (progressEvent) => {
    if (!progressEvent.total) {
        return;
    }

    const percentage = Math.round(
        (progressEvent.loaded * 100) /
        progressEvent.total
    );

    setProgress(percentage);
}
```

The browser provides:

```text
loaded
total
```

For example:

```text
loaded = 500 MB
total  = 1000 MB
```

The percentage becomes:

```text
500 / 1000 × 100
= 50%
```

React then updates the progress bar:

```js
setProgress(50);
```

The progress bar uses:

```jsx
style={{
    width: `${progress}%`
}}
```

---

# Important: Progress vs Upload Success

The progress bar reaching:

```text
100%
```

does not by itself mean that MinIO has successfully stored the file.

The final success happens when:

```js
await minioClient.putObject(...)
```

successfully resolves.

Then the server returns:

```http
201 Created
```

The frontend waits for the Axios request:

```js
const response = await axios.post(...);
```

and only then displays:

```text
Upload successful
```

The flow is:

```text
Browser Upload Progress
        ↓
       100%
        ↓
Wait for Server Response
        ↓
MinIO putObject() succeeds
        ↓
HTTP 201
        ↓
Upload Successful
```

---

# API

## Upload File

### Endpoint

```http
POST /api/upload
```

### Content Type

The file itself is sent as the request body:

```text
application/octet-stream
```

or the actual file MIME type.

### Filename Header

```text
x-file-name
```

Example:

```text
x-file-name: video.mp4
```

### Request Body

```text
<File bytes>
```

---

# Example Request

Conceptually:

```text
POST /api/upload
Content-Type: video/mp4
x-file-name: video.mp4

<video file bytes>
```

---

# Example Response

```json
{
    "message": "File uploaded successfully",
    "fileName": "video.mp4",
    "duration": "12.4s"
}
```

---

# Performance Testing

This project is designed to test large file uploads.

Recommended test files:

```text
100 MB
500 MB
1 GB
2 GB
```

---

## macOS

Create a 1 GB file:

```bash
mkfile 1g test-1gb.bin
```

Create a 2 GB file:

```bash
mkfile 2g test-2gb.bin
```

---

## Linux

Create a 1 GB file:

```bash
fallocate -l 1G test-1gb.bin
```

Create a 2 GB file:

```bash
fallocate -l 2G test-2gb.bin
```

---

# Measuring Upload Performance

The server measures the upload duration.

Example:

```text
Upload started: test-1gb.bin

Upload completed: test-1gb.bin
Duration: 12.4s
```

The important metrics are:

```text
File Size
Upload Duration
Upload Speed
Node.js Memory Usage
CPU Usage
```

For example:

```text
File Size:       1 GB
Duration:        12.4 seconds
Throughput:      ~82 MB/s
```

---

# Docker Compose

The project contains three services:

```text
┌──────────────┐
│    Client    │
│    :5173     │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│    Server    │
│    :5001     │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│    MinIO     │
│    :9000     │
│    :9001     │
└──────────────┘
```

---

# Running the Project

From the project root:

```bash
docker compose up --build
```

Or run in the background:

```bash
docker compose up --build -d
```

---

# Application URLs

### React

```text
http://localhost:5173
```

### Node.js API

```text
http://localhost:5001
```

### Health Check

```text
http://localhost:5001/health
```

### MinIO Console

```text
http://localhost:9001
```

---

# MinIO Login

```text
Username: minioadmin
Password: minioadmin123
```

Open the `large-files` bucket to see uploaded objects.

---

# Docker Commands

## Start

```bash
docker compose up
```

## Build and Start

```bash
docker compose up --build
```

## Start in Background

```bash
docker compose up --build -d
```

## Check Services

```bash
docker compose ps
```

## View Server Logs

```bash
docker logs large-file-server
```

## View MinIO Logs

```bash
docker logs large-file-minio
```

## View Client Logs

```bash
docker logs large-file-client
```

## Stop Services

```bash
docker compose down
```

---

# Data Persistence

MinIO uses a Docker volume:

```yaml
volumes:
    - minio_data:/data
```

Therefore, uploaded objects remain available after:

```bash
docker compose down
```

To remove the MinIO data as well:

```bash
docker compose down -v
```

> `docker compose down -v` deletes the Docker volume containing the uploaded objects.

---

# Current Limitations

This project uses a **single HTTP request** for each file.

It does not currently implement:

* Multipart upload
* Resumable upload
* Upload sessions
* Application-level chunks
* Per-part retry
* Parallel part uploads
* Direct browser-to-MinIO upload

For example, if a 1 GB upload fails at 60%:

```text
████████████░░░░░░░░
             ↑
           failure
```

the current implementation does not resume from 60%.

The file needs to be uploaded again.

---

# Current Streaming vs Multipart Upload

### Current Implementation

```text
React
  │
  │ Single HTTP Request
  │
  ▼
Node.js
  │
  │ req Stream
  │
  ▼
MinIO
```

### Multipart Upload

A future multipart implementation would divide the file into independent parts:

```text
1 GB File

┌────────┐
│ Part 1 │
├────────┤
│ Part 2 │
├────────┤
│ Part 3 │
├────────┤
│ Part 4 │
├────────┤
│  ...   │
├────────┤
│ Part N │
└────────┘
```

Each part could then be uploaded and retried independently.

---

# Key Concepts

This project demonstrates:

* Browser File API
* Axios file upload
* HTTP request body
* Node.js Readable Streams
* Express
* Stream-based uploads
* MinIO object storage
* Bucket initialization
* Upload progress
* Upload success confirmation
* Docker Compose
* Large file performance testing

---

# Complete Upload Flow

```text
                  FILE UPLOAD

┌──────────────────────────┐
│       React Client       │
│                          │
│      Select File         │
└────────────┬─────────────┘
             │
             │ File
             ▼
┌──────────────────────────┐
│          Axios           │
│                          │
│    Upload Progress       │
└────────────┬─────────────┘
             │
             │ HTTP Request Body
             ▼
┌──────────────────────────┐
│       Node.js            │
│       Express            │
│                          │
│      req Stream          │
└────────────┬─────────────┘
             │
             │ Readable Stream
             ▼
┌──────────────────────────┐
│          MinIO           │
│                          │
│       putObject()        │
└────────────┬─────────────┘
             │
             │ Success
             ▼
┌──────────────────────────┐
│       HTTP 201           │
│                          │
│   Upload Successful      │
└──────────────────────────┘
```

---

# Demo

**Demo:** google.com
