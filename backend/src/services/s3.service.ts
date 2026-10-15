import { PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client } from '../config/s3.config';
import { env } from '../config/env.config';

export interface PresignedUrlResult {
  uploadUrl: string;
  fileKey: string;
  expiresInSeconds: number;
  isMock?: boolean;
}

export class S3Service {
  /**
   * Returns true if AWS S3 client has valid configured credentials.
   */
  static isS3Configured(): boolean {
    return s3Client !== null;
  }

  /**
   * Generates a short-lived pre-signed PUT URL for uploading private files directly to S3.
   * Default expiration: 300 seconds (5 minutes).
   * Fallback: If credentials are unconfigured, generates a safe local simulation URL.
   */
  static async generatePresignedUploadUrl(
    fileKey: string,
    contentType: string,
    expiresInSeconds = 300
  ): Promise<PresignedUrlResult> {
    if (!s3Client) {
      console.warn(`[AWS S3 Notice]: AWS credentials not configured. Generating simulated upload URL for key: ${fileKey}`);
      const mockUploadUrl = `http://localhost:${env.PORT}/api/v1/materials/mock-s3-upload?key=${encodeURIComponent(fileKey)}&expires=${Date.now() + expiresInSeconds * 1000}`;
      return {
        uploadUrl: mockUploadUrl,
        fileKey,
        expiresInSeconds,
        isMock: true,
      };
    }

    const command = new PutObjectCommand({
      Bucket: env.AWS_S3_BUCKET_NAME,
      Key: fileKey,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: expiresInSeconds });

    return {
      uploadUrl,
      fileKey,
      expiresInSeconds,
      isMock: false,
    };
  }

  /**
   * Generates a short-lived pre-signed GET URL for securely downloading/viewing private files.
   * Default expiration: 900 seconds (15 minutes).
   * Fallback: If credentials are unconfigured, generates a safe local simulation URL.
   */
  static async generatePresignedDownloadUrl(
    fileKey: string,
    expiresInSeconds = 900
  ): Promise<{ downloadUrl: string; isMock: boolean }> {
    if (!s3Client) {
      console.warn(`[AWS S3 Notice]: AWS credentials not configured. Generating simulated download URL for key: ${fileKey}`);
      const mockDownloadUrl = `http://localhost:${env.PORT}/api/v1/materials/mock-s3-download?key=${encodeURIComponent(fileKey)}&expires=${Date.now() + expiresInSeconds * 1000}`;
      return {
        downloadUrl: mockDownloadUrl,
        isMock: true,
      };
    }

    const command = new GetObjectCommand({
      Bucket: env.AWS_S3_BUCKET_NAME,
      Key: fileKey,
    });

    const downloadUrl = await getSignedUrl(s3Client, command, { expiresIn: expiresInSeconds });
    return {
      downloadUrl,
      isMock: false,
    };
  }
}
