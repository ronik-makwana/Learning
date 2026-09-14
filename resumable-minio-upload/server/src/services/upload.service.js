import {
  CreateMultipartUploadCommand,
  UploadPartCommand,
  ListPartsCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
} from "@aws-sdk/client-s3";

import {
  s3Client,
  BUCKET_NAME,
} from "../config/minio.js";

/*
 * 1. Start a multipart upload
 */
export const initiateUpload = async ({
  fileName,
  contentType,
}) => {
  const command = new CreateMultipartUploadCommand({
    Bucket: BUCKET_NAME,
    Key: fileName,
    ContentType: contentType,
  });

  const result = await s3Client.send(command);

  return {
    uploadId: result.UploadId,
    key: fileName,
  };
};

/*
 * 2. Upload one part/chunk
 */
export const uploadPart = async ({
  key,
  uploadId,
  partNumber,
  body,
  contentLength
}) => {
  const command = new UploadPartCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    UploadId: uploadId,
    PartNumber: partNumber,
    Body: body,
    ContentLength: Number(contentLength),
  });

  const result = await s3Client.send(command);

  return {
    partNumber,
    etag: result.ETag,
  };
};

/*
 * 3. Get already uploaded parts
 *
 * Used when the client wants to resume
 * an interrupted upload.
 */
export const listUploadedParts = async ({
  key,
  uploadId,
}) => {
  const command = new ListPartsCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    UploadId: uploadId,
  });

  const result = await s3Client.send(command);

  return (result.Parts || []).map((part) => ({
    partNumber: part.PartNumber,
    etag: part.ETag,
  }));
};

/*
 * 4. Complete the multipart upload
 */
export const completeUpload = async ({
  key,
  uploadId,
  parts,
}) => {
  const command = new CompleteMultipartUploadCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    UploadId: uploadId,

    MultipartUpload: {
      Parts: parts
        .sort(
          (a, b) =>
            a.partNumber - b.partNumber
        )
        .map((part) => ({
          PartNumber: part.partNumber,
          ETag: part.etag,
        })),
    },
  });

  const result = await s3Client.send(command);

  return result;
};

/*
 * 5. Abort an incomplete upload
 */
export const abortUpload = async ({
  key,
  uploadId,
}) => {
  const command = new AbortMultipartUploadCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    UploadId: uploadId,
  });

  return s3Client.send(command);
};