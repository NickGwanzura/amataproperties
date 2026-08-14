declare module "@aws-sdk/client-s3" {
  export class S3Client {
    constructor(config: Record<string, unknown>);
    send(command: unknown): Promise<unknown>;
  }
  export class PutObjectCommand {
    constructor(input: Record<string, unknown>);
  }
  export class DeleteObjectCommand {
    constructor(input: Record<string, unknown>);
  }
  export class GetObjectCommand {
    constructor(input: Record<string, unknown>);
  }
}

declare module "@aws-sdk/s3-request-presigner" {
  import type { S3Client } from "@aws-sdk/client-s3";
  export function getSignedUrl(client: S3Client, command: unknown, options?: { expiresIn?: number }): Promise<string>;
}
