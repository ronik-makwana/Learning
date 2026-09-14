import { useState } from "react";
import axios from "axios";

function App() {
    const [files, setFiles] = useState([]);
    const [message, setMessage] = useState("");
    const [uploading, setUploading] = useState(false);

    const handleFileChange = (event) => {
        const selectedFiles = Array.from(
            event.target.files
        );

        setFiles(selectedFiles);
        setMessage("");
    };

    const handleUpload = async () => {
        if (files.length === 0) {
            setMessage("Please select files");
            return;
        }

        const formData = new FormData();

        files.forEach((file) => {
            formData.append("files", file);
        });

        try {
            setUploading(true);
            setMessage("Uploading...");

            const response = await axios.post(
                "http://localhost:5001/api/upload",
                formData
            );

            console.log(response.data);

            setMessage(
                `${response.data.count} files uploaded successfully`
            );

            setFiles([]);

        } catch (error) {
            console.error(error);

            setMessage(
                error.response?.data?.message ||
                "Upload failed"
            );

        } finally {
            setUploading(false);
        }
    };

    return (
        <div>
            <h1>Multiple File Upload</h1>

            <input
                type="file"
                multiple
                accept="image/jpeg,image/png"
                onChange={handleFileChange}
            />

            {files.length > 0 && (
                <div>
                    <h3>
                        Selected Files: {files.length}
                    </h3>

                    {files.map((file, index) => (
                        <div key={index}>
                            <p>
                                {file.name}
                            </p>

                            <p>
                                Size: {file.size} bytes
                            </p>

                            <p>
                                Type: {file.type}
                            </p>

                            <hr />
                        </div>
                    ))}
                </div>
            )}

            <button
                onClick={handleUpload}
                disabled={
                    files.length === 0 ||
                    uploading
                }
            >
                {uploading
                    ? "Uploading..."
                    : "Upload Files"}
            </button>

            <p>{message}</p>
        </div>
    );
}

export default App;