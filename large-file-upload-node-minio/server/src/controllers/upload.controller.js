import { uploadFileToMinio } from "../services/upload.service.js";

export const uploadFile = async (req, res) => {
  try {
    const fileName = req.headers["x-file-name"];

    if (!fileName) {
      return res.status(400).json({
        message: "x-file-name is required",
      });
    }

    console.log(`Upload started: ${fileName}`);

    const startTime = Date.now();

    const result = await uploadFileToMinio(fileName, req);

    const duration = (Date.now() - startTime) / 1000;

    console.log(`Upload completed: ${fileName}`);
    console.log(`Duration: ${duration}s`);

    return res.status(201).json({
      message: "File uploaded successfully",
      fileName,
      duration: `${duration}s`,
      ...result,
    });
  } catch (error) {
    console.error("Upload failed:", error);

    return res.status(500).json({
      message: "Upload failed",
      error: error.message,
    });
  }
};
