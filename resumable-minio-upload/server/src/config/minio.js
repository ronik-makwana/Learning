import {
  S3Client,
  HeadBucketCommand,
  CreateBucketCommand,
} from "@aws-sdk/client-s3";

const endpoint = `http://${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT}`;

export const s3Client = new S3Client({
  region: "us-east-1",

  endpoint,

  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY,
    secretAccessKey: process.env.MINIO_SECRET_KEY,
  },

  /*
   * MinIO uses S3-compatible APIs.
   *
   * Path-style addressing makes:
   *
   * http://minio:9000/uploads
   *
   * instead of:
   *
   * http://uploads.minio:9000
   */
  forcePathStyle: true,

  /*
   * We are streaming the request directly
   * from Express -> MinIO.
   *
   * Disable flexible checksum behavior because
   * the SDK otherwise tries to determine the
   * decoded content length from the stream.
   */
  requestChecksumCalculation: "WHEN_REQUIRED",

  responseChecksumValidation: "WHEN_REQUIRED",
});

export const BUCKET_NAME = process.env.MINIO_BUCKET;

export const createBucketIfNotExists = async () => {
  try {
    await s3Client.send(
      new HeadBucketCommand({
        Bucket: BUCKET_NAME,
      }),
    );

    console.log(`Bucket "${BUCKET_NAME}" already exists`);
  } catch (error) {
    console.log(`Bucket "${BUCKET_NAME}" does not exist. Creating...`);

    await s3Client.send(
      new CreateBucketCommand({
        Bucket: BUCKET_NAME,
      }),
    );

    console.log(`Bucket "${BUCKET_NAME}" created successfully`);
  }
};
