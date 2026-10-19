export interface TextExtractor {
  supports(contentType: string, fileName?: string): boolean;
  extract(buffer: Buffer): Promise<string>;
}
