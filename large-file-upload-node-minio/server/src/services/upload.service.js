import { minioClient, bucketName } from "../config/minio.js";

export const uploadFileToMinio = async (fileName, stream) => {
  await minioClient.putObject(bucketName, fileName, stream);

  return {
    fileName,
  };
};
