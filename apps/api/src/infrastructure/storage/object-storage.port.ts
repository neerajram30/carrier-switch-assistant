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
  access?: 'private' | 'public';
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
  access?: 'private' | 'public';
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
  delete(storageKey: string): Promise<void>;
  generateUploadToken(
    options: GenerateUploadTokenOptions,
  ): Promise<UploadTokenResult>;
  exists(storageKey: string): Promise<boolean>;
  head(storageKey: string): Promise<StorageMetadata | null>;
}
