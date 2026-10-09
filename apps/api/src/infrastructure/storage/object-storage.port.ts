export const OBJECT_STORAGE_PORT = Symbol('OBJECT_STORAGE_PORT');

export type UploadFileBody =
  | string
  | Buffer
  | Blob
  | ArrayBuffer
  | ReadableStream
  | NodeJS.ReadableStream;

export interface UploadFileOptions {
  contentType?: string;
  access?: 'public';
}

export interface UploadFileResult {
  url: string;
  pathname: string;
  contentType?: string;
}

export interface GenerateUploadTokenOptions {
  pathname: string;
  contentType: string;
  maximumSizeInBytes: number;
}

export interface UploadTokenResult {
  clientToken: string;
}

export interface StorageMetadata {
  size: number;
  uploadedAt: Date;
  pathname: string;
  contentType: string;
  url: string;
}

export interface ObjectStoragePort {
  upload(
    pathname: string,
    body: UploadFileBody,
    options?: UploadFileOptions,
  ): Promise<UploadFileResult>;
  delete(url: string): Promise<void>;
  generateUploadToken(
    options: GenerateUploadTokenOptions,
  ): Promise<UploadTokenResult>;
  exists(url: string): Promise<boolean>;
  head(url: string): Promise<StorageMetadata | null>;
}
