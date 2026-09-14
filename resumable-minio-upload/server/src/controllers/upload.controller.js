import {
  initiateUpload,
  uploadPart,
  listUploadedParts,
  completeUpload,
  abortUpload,
} from "../services/upload.service.js";

/*
 * POST /api/upload/initiate
 *
 * Creates a new multipart upload
 * and returns the uploadId.
 */
export const initiateUploadController = async (
  req,
  res
) => {
  try {
    const {
      fileName,
      contentType,
    } = req.body;

    if (!fileName) {
      return res.status(400).json({
        message: "fileName is required",
      });
    }

    const result = await initiateUpload({
      fileName,
      contentType:
        contentType ||
        "application/octet-stream",
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error(
      "Initiate upload error:",
      error
    );

    return res.status(500).json({
      message: "Failed to initiate upload",
    });
  }
};

/*
 * PUT /api/upload/part
 *
 * Receives ONE chunk.
 *
 * The request itself is passed as a stream
 * to MinIO.
 */
export const uploadPartController = async (
  req,
  res
) => {
  try {
    const {
      key,
      uploadId,
      partNumber,
    } = req.query;

    if (
      !key ||
      !uploadId ||
      !partNumber
    ) {
      return res.status(400).json({
        message:
          "key, uploadId and partNumber are required",
      });
    }

    const partNumberValue =
      Number(partNumber);

    if (
      !Number.isInteger(partNumberValue) ||
      partNumberValue <= 0
    ) {
      return res.status(400).json({
        message:
          "partNumber must be a positive integer",
      });
    }

    const result = await uploadPart({
      key,
      uploadId,
      partNumber: partNumberValue,

      // Raw HTTP request stream
      body: req,
      contentLength: req.headers["content-length"],
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error(
      "Upload part error:",
      error
    );

    return res.status(500).json({
      message: "Failed to upload part",
      error: error.message,
    });
  }
};

/*
 * GET /api/upload/parts
 *
 * Returns parts that MinIO has already received.
 *
 * This is important for resumable uploads.
 */
export const listPartsController = async (
  req,
  res
) => {
  try {
    const {
      key,
      uploadId,
    } = req.query;

    if (!key || !uploadId) {
      return res.status(400).json({
        message:
          "key and uploadId are required",
      });
    }

    const parts =
      await listUploadedParts({
        key,
        uploadId,
      });

    return res.status(200).json({
      parts,
    });
  } catch (error) {
    console.error(
      "List parts error:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to get uploaded parts",
    });
  }
};

/*
 * POST /api/upload/complete
 *
 * Tells MinIO to combine all uploaded
 * parts into the final object.
 */
export const completeUploadController =
  async (req, res) => {
    try {
      const {
        key,
        uploadId,
        parts,
      } = req.body;

      if (
        !key ||
        !uploadId ||
        !Array.isArray(parts)
      ) {
        return res.status(400).json({
          message:
            "key, uploadId and parts are required",
        });
      }

      const result =
        await completeUpload({
          key,
          uploadId,
          parts,
        });

      return res.status(200).json({
        message:
          "Upload completed successfully",
        key,
        location: result.Location,
      });
    } catch (error) {
      console.error(
        "Complete upload error:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to complete upload",
        error: error.message,
      });
    }
  };

/*
 * DELETE /api/upload/abort
 *
 * Cancels an incomplete multipart upload.
 */
export const abortUploadController =
  async (req, res) => {
    try {
      const {
        key,
        uploadId,
      } = req.query;

      if (!key || !uploadId) {
        return res.status(400).json({
          message:
            "key and uploadId are required",
        });
      }

      await abortUpload({
        key,
        uploadId,
      });

      return res.status(200).json({
        message: "Upload aborted",
      });
    } catch (error) {
      console.error(
        "Abort upload error:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to abort upload",
      });
    }
  };