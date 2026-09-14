import express from "express";
import multer from "multer";
import cors from "cors";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const app = express();

app.use(cors({
    origin: "*"
}));

app.use(express.json());

app.get("/health", (req, res) => {
    res.send("Multiple File Upload Server is running");
});

// Get current directory because we are using ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Upload directory
const uploadDir = path.join(__dirname, "uploads");

// Create uploads directory if it doesn't exist
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, {
        recursive: true
    });
}

// Multer storage configuration
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

// Multer configuration
const upload = multer({
    storage,

    limits: {
        fileSize: 5 * 1024 * 1024, // 5 MB per file
        files: 10                   // maximum 10 files
    },

    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            "image/jpeg",
            "image/png"
        ];

        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error("Only JPG and PNG files are allowed"));
        }
    }
});

// Multiple file upload
app.post(
    "/api/upload",
    upload.array("files", 10),
    (req, res) => {

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                message: "No files uploaded"
            });
        }

        console.log("Uploaded files:");
        console.log(req.files);

        const uploadedFiles = req.files.map((file) => ({
            originalName: file.originalname,
            filename: file.filename,
            size: file.size,
            mimeType: file.mimetype,
            path: file.path
        }));

        res.status(201).json({
            message: "Files uploaded successfully",
            count: uploadedFiles.length,
            files: uploadedFiles
        });
    }
);

// Error handler
app.use((err, req, res, next) => {
    console.error(err);

    res.status(400).json({
        message: err.message
    });
});

const PORT = 5001;

app.listen(PORT, () => {
    console.log(
        `Server running on http://localhost:${PORT}`
    );
});