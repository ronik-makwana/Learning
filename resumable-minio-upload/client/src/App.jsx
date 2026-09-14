import { useRef, useState } from "react";
import axios from "axios";

const API_URL = "http://localhost:3000/api/upload";

const CHUNK_SIZE = 10 * 1024 * 1024;

function App() {
  const [file, setFile] = useState(null);

  const [uploading, setUploading] = useState(false);
  const [uploadStarted, setUploadStarted] = useState(false);
  const [paused, setPaused] = useState(false);

  const [progress, setProgress] = useState(0);
  const [currentPart, setCurrentPart] = useState(0);
  const [totalParts, setTotalParts] = useState(0);

  const [message, setMessage] = useState("");

  // Used to pause/resume the upload loop immediately.
  const pausedRef = useRef(false);

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];

    if (!selectedFile) {
      return;
    }

    setFile(selectedFile);

    // New file = new upload session
    localStorage.removeItem("upload-session");

    setUploadStarted(false);
    setUploading(false);
    setPaused(false);
    setProgress(0);
    setCurrentPart(0);
    setTotalParts(0);
    setMessage("");
  };

  const initiateUpload = async () => {
    const response = await axios.post(`${API_URL}/initiate`, {
      fileName: file.name,
      contentType: file.type || "application/octet-stream",
    });

    return response.data;
  };

  const getUploadedParts = async ({ key, uploadId }) => {
    const response = await axios.get(`${API_URL}/parts`, {
      params: {
        key,
        uploadId,
      },
    });

    return response.data.parts;
  };

  const uploadChunk = async ({ key, uploadId, partNumber, chunk }) => {
    const response = await axios.put(`${API_URL}/part`, chunk, {
      params: {
        key,
        uploadId,
        partNumber,
        contentLength: chunk.size,
      },

      headers: {
        "Content-Type": "application/octet-stream",
      },

      onUploadProgress: (event) => {
        if (!event.total) {
          return;
        }

        console.log(
          `Part ${partNumber}:`,
          Math.round((event.loaded / event.total) * 100),
          "%",
        );
      },
    });

    return response.data;
  };

  const completeUpload = async ({ key, uploadId, parts }) => {
    const response = await axios.post(`${API_URL}/complete`, {
      key,
      uploadId,
      parts,
    });

    return response.data;
  };

  const handleUpload = async () => {
    if (!file) {
      alert("Please select a file");
      return;
    }

    try {
      setUploadStarted(true);
      setUploading(true);
      setMessage("");

      pausedRef.current = false;
      setPaused(false);

      /*
       * ------------------------------------------------
       * 1. Check if we already have an upload session
       * ------------------------------------------------
       */

      let uploadSession =
        JSON.parse(localStorage.getItem("upload-session")) || null;

      let uploadId;
      let key;

      /*
       * ------------------------------------------------
       * 2. Reuse existing upload session
       * ------------------------------------------------
       */

      if (
        uploadSession &&
        uploadSession.fileName === file.name &&
        uploadSession.fileSize === file.size
      ) {
        uploadId = uploadSession.uploadId;
        key = uploadSession.key;

        console.log("Resuming existing upload:", uploadId);
      } else {
        /*
         * ------------------------------------------------
         * 3. No existing session → create new upload
         * ------------------------------------------------
         */

        const result = await initiateUpload();

        uploadId = result.uploadId;
        key = result.key;

        localStorage.setItem(
          "upload-session",
          JSON.stringify({
            uploadId,
            key,
            fileName: file.name,
            fileSize: file.size,
          }),
        );

        console.log("Created new upload:", uploadId);
      }

      /*
       * ------------------------------------------------
       * 4. Get parts already uploaded to MinIO
       * ------------------------------------------------
       */

      const uploadedParts = await getUploadedParts({
        key,
        uploadId,
      });

      const uploadedPartMap = new Map(
        uploadedParts.map((part) => [part.partNumber, part.etag]),
      );

      console.log("Already uploaded parts:", [...uploadedPartMap.keys()]);

      /*
       * ------------------------------------------------
       * 5. Calculate total number of parts
       * ------------------------------------------------
       */

      const partsCount = Math.ceil(file.size / CHUNK_SIZE);

      setTotalParts(partsCount);

      /*
       * ------------------------------------------------
       * 6. Calculate initial progress
       * ------------------------------------------------
       */

      setProgress(Math.round((uploadedPartMap.size / partsCount) * 100));

      /*
       * ------------------------------------------------
       * 7. Upload missing parts
       * ------------------------------------------------
       */

      const completedParts = [...uploadedParts];

      for (let partNumber = 1; partNumber <= partsCount; partNumber++) {
        /*
         * Check pause before starting
         * the next part.
         */
        if (pausedRef.current) {
          console.log("Upload paused");

          setUploading(false);
          setPaused(true);

          return;
        }

        /*
         * Already uploaded?
         * Skip this part.
         */
        if (uploadedPartMap.has(partNumber)) {
          console.log(`Skipping Part ${partNumber}`);

          setCurrentPart(partNumber);

          continue;
        }

        setCurrentPart(partNumber);

        /*
         * Create chunk.
         */
        const start = (partNumber - 1) * CHUNK_SIZE;

        const end = Math.min(start + CHUNK_SIZE, file.size);

        const chunk = file.slice(start, end);

        /*
         * Upload chunk.
         */
        const result = await uploadChunk({
          key,
          uploadId,
          partNumber,
          chunk,
        });

        /*
         * Save ETag.
         */
        completedParts.push({
          partNumber: result.partNumber,
          etag: result.etag,
        });

        uploadedPartMap.set(partNumber, result.etag);

        /*
         * Update progress.
         */
        setProgress(Math.round((uploadedPartMap.size / partsCount) * 100));

        console.log(`Part ${partNumber} completed`);
      }

      /*
       * ------------------------------------------------
       * 8. Complete upload
       * ------------------------------------------------
       */

      setMessage("Completing upload...");

      await completeUpload({
        key,
        uploadId,
        parts: completedParts,
      });

      /*
       * Upload successfully completed.
       * Remove saved session.
       */
      localStorage.removeItem("upload-session");

      setProgress(100);
      setUploading(false);
      setPaused(false);

      setMessage("Upload completed successfully!");

      console.log("Upload completed");
    } catch (error) {
      console.error("Upload error:", error);

      setUploading(false);

      setMessage("Upload failed. You can try Resume.");
    }
  };

  const pauseUpload = () => {
    pausedRef.current = true;

    setPaused(true);

    console.log("Pause requested");
  };

  const resumeUpload = () => {
    if (!file) {
      return;
    }

    pausedRef.current = false;

    setPaused(false);

    console.log("Resuming upload...");

    handleUpload();
  };

  return (
    <div
      style={{
        maxWidth: "700px",
        margin: "50px auto",
        fontFamily: "Arial",
      }}
    >
      <h1>Resumable MinIO Upload</h1>

      <input type="file" onChange={handleFileChange} />

      {file && (
        <div
          style={{
            marginTop: "20px",
          }}
        >
          <p>
            <strong>File:</strong> {file.name}
          </p>

          <p>
            <strong>Size:</strong> {(file.size / (1024 * 1024)).toFixed(2)} MB
          </p>

          <button
            onClick={handleUpload}
            disabled={uploading}
            style={{
              marginRight: "10px",
            }}
          >
            Start Upload
          </button>

          {uploading && !paused && <button onClick={pauseUpload}>Pause</button>}

          {paused && <button onClick={resumeUpload}>Resume</button>}
        </div>
      )}

      {uploadStarted && (
        <div
          style={{
            marginTop: "30px",
          }}
        >
          <p>
            Part: {currentPart} / {totalParts}
          </p>

          <div
            style={{
              width: "100%",
              height: "25px",
              border: "1px solid #ccc",
            }}
          >
            <div
              style={{
                width: `${progress}%`,
                height: "100%",
                background: "green",
                transition: "width 0.2s",
              }}
            />
          </div>

          <p>{progress}%</p>

          {paused && <p>Upload paused. Click Resume to continue.</p>}

          {message && <p>{message}</p>}
        </div>
      )}
    </div>
  );
}

export default App;
