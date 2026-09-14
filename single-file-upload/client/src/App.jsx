import { useState } from "react";
import axios from "axios";

function App() {

    const [file, setFile] = useState(null);
    const [message, setMessage] = useState("");

    const handleFileChange = (event) => {

        const selectedFile = event.target.files[0];

        setFile(selectedFile);
    };

    const handleUpload = async () => {

        if (!file) {
            setMessage("Please select a file");
            return;
        }

        const formData = new FormData();

        formData.append("file", file);

        try {

            setMessage("Uploading...");

            const response = await axios.post(
                "http://localhost:5000/api/upload",
                formData
            );

            console.log(response.data);

            setMessage("Upload successful!");

        } catch (error) {

            console.error(error);

            setMessage(
                error.response?.data?.message ||
                "Upload failed"
            );
        }
    };


    return (
        <div style={{ padding: "40px" }}>

            <h1>
                Single File Upload
            </h1>

            <input
                type="file"
                accept="image/jpeg,image/png"
                onChange={handleFileChange}
            />

            {file && (
                <div>
                    <p>
                        Name: {file.name}
                    </p>

                    <p>
                        Size: {file.size} bytes
                    </p>

                    <p>
                        Type: {file.type}
                    </p>
                </div>
            )}

            <button
                onClick={handleUpload}
                disabled={!file}
            >
                Upload
            </button>

            <p>
                {message}
            </p>

        </div>
    );
}

export default App;