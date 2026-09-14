import express from "express";

import {
  initiateUploadController,
  uploadPartController,
  listPartsController,
  completeUploadController,
  abortUploadController,
} from "../controllers/upload.controller.js";

const router = express.Router();

/*
 * Start a multipart upload
 */
router.post("/initiate", initiateUploadController);

/*
 * Upload one chunk/part
 */
router.put("/part", uploadPartController);

/*
 * Get already uploaded parts
 */
router.get("/parts", listPartsController);

/*
 * Complete the multipart upload
 */
router.post("/complete", completeUploadController);

/*
 * Cancel an incomplete upload
 */
router.delete("/abort", abortUploadController);

export default router;
