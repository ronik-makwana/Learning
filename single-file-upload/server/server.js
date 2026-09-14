import express from "express";
import multer from "multer";
import cors from "cors";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const app = express();

app.use(cors());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, {
        recursive: true
    });
}


// ----------------------------------------
// Multer storage
// ----------------------------------------

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


// ----------------------------------------
// Multer configuration
// ----------------------------------------

const upload = multer({

    storage,

    limits: {
        fileSize: 5 * 1024 * 1024 // 5 MB
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


// ----------------------------------------
// Single file upload
// ----------------------------------------

app.post(
    "/api/upload",

    upload.single("file"),

    (req, res) => {

        if (!req.file) {
            return res.status(400).json({
                message: "No file uploaded"
            });
        }

        console.log(req.file);

        res.status(201).json({
            message: "File uploaded successfully",

            file: {
                originalName: req.file.originalname,
                filename: req.file.filename,
                size: req.file.size,
                mimeType: req.file.mimetype,
                path: req.file.path
            }
        });
    }
);


// ----------------------------------------
// Error handler
// ----------------------------------------

app.use((err, req, res, next) => {

    console.error(err);

    res.status(400).json({
        message: err.message
    });
});


// ----------------------------------------
// Start server
// ----------------------------------------

const PORT = 5000;

app.listen(PORT, () => {
    console.log(
        `Server running on http://localhost:${PORT}`
    );
});