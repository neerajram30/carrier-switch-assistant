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

export interface ObjectStoragePort {
  upload(
    pathname: string,
    body: UploadFileBody,
    options?: UploadFileOptions,
  ): Promise<UploadFileResult>;
  delete(url: string): Promise<void>;
}
