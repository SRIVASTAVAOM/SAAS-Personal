import { S3Client } from '@aws-sdk/client-s3';
import { env } from './env.config';

let s3Client: S3Client | null = null;

if (env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY) {
  s3Client = new S3Client({
    region: env.AWS_REGION,
    credentials: {
      accessKeyId: env.AWS_ACCESS_KEY_ID,
      secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    },
  });
} else {
  // Documented blocker: S3 credentials not provided in local environment.
  // Foundation utility will gracefully handle this without crashing the application.
  console.info('[AWS S3 Notice]: AWS credentials not provided in environment. S3 operations will be mocked/unavailable until configured.');
}

export { s3Client };
