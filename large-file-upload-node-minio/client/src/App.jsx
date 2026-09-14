import { useState } from "react";
import axios from "axios";
import "./App.css";

const API_URL = "http://localhost:5001";

function App() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];

    if (!selectedFile) {
      return;
    }

    setFile(selectedFile);
    setProgress(0);
    setMessage("");
    setError("");
  };

  const uploadFile = async () => {
    if (!file) {
      setError("Please select a file first.");
      return;
    }

    try {
      setUploading(true);
      setProgress(0);
      setMessage("");
      setError("");

      const response = await axios.post(`${API_URL}/api/upload`, file, {
        headers: {
          "x-file-name": file.name,
          "Content-Type": file.type || "application/octet-stream",
        },

        onUploadProgress: (progressEvent) => {
          if (!progressEvent.total) {
            return;
          }

          const percentage = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total,
          );

          setProgress(percentage);
        },
      });

      console.log("Upload response:", response.data);

      setMessage(`Upload successful: ${response.data.fileName}`);
    } catch (error) {
      console.error("Upload failed:", error);

      if (error.response) {
        setError(error.response.data?.message || "Upload failed.");
      } else {
        setError("Unable to connect to the server.");
      }
    } finally {
      setUploading(false);
    }
  };

  const removeFile = () => {
    setFile(null);
    setProgress(0);
    setMessage("");
    setError("");
  };

  return (
    <div className="app">
      <div className="upload-container">
        <h1>Large File Upload</h1>

        <p className="subtitle">React → Axios → Node.js → MinIO</p>

        <div className="file-picker">
          <input
            id="file-input"
            type="file"
            onChange={handleFileChange}
            disabled={uploading}
          />

          <label htmlFor="file-input">
            {file ? "Change File" : "Choose File"}
          </label>
        </div>

        {file && (
          <div className="file-info">
            <p>
              <strong>Name:</strong>
              <br />
              {file.name}
            </p>

            <p>
              <strong>Size:</strong> {(file.size / (1024 * 1024)).toFixed(2)} MB
            </p>

            <p>
              <strong>Type:</strong> {file.type || "Unknown"}
            </p>
          </div>
        )}

        {file && (
          <button
            className="upload-button"
            onClick={uploadFile}
            disabled={uploading}
          >
            {uploading ? `Uploading ${progress}%` : "Upload File"}
          </button>
        )}

        {uploading && (
          <div className="progress-container">
            <div className="progress-header">
              <span>Upload Progress</span>
              <span>{progress}%</span>
            </div>

            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{
                  width: `${progress}%`,
                }}
              />
            </div>
          </div>
        )}

        {message && !error && <div className="success">{message}</div>}

        {error && <div className="error">{error}</div>}

        {file && !uploading && (
          <button className="remove-button" onClick={removeFile}>
            Remove File
          </button>
        )}
      </div>
    </div>
  );
}

export default App;
