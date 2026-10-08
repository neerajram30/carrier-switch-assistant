import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { OBJECT_STORAGE_PORT } from './object-storage.port.js';
import { VercelBlobStorageAdapter } from './vercel-blob-storage.adapter.js';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: OBJECT_STORAGE_PORT,
      useClass: VercelBlobStorageAdapter,
    },
    VercelBlobStorageAdapter,
  ],
  exports: [OBJECT_STORAGE_PORT, VercelBlobStorageAdapter],
})
export class StorageModule {}
