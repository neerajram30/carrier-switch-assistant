import { put, head, del } from '@vercel/blob';
import { generateClientTokenFromReadWriteToken } from '@vercel/blob/client';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../apps/api/.env') });

const token = process.env.BLOB_READ_WRITE_TOKEN;

if (!token) {
  console.error('ERROR: BLOB_READ_WRITE_TOKEN is not defined in apps/api/.env');
  process.exit(1);
}

async function verifyPrivateBlobIntegration() {
  console.log('=== Step 1: Generate Scoped Client Token for Private Upload ===');
  const storageKey = `users/00000000-0000-0000-0000-000000000001/resumes/test-${Date.now()}/original.pdf`;
  const fileContent = Buffer.from('%PDF-1.4 sample private resume content for integration test');
  const contentType = 'application/pdf';

  const clientToken = await generateClientTokenFromReadWriteToken({
    pathname: storageKey,
    token,
    maximumSizeInBytes: 5 * 1024 * 1024,
    allowedContentTypes: [contentType],
  });
  console.log('Client token generated successfully.');

  console.log('\n=== Step 2: Upload File via Client Flow with Private Access ===');
  const uploadResult = await put(storageKey, fileContent, {
    access: 'private',
    token: clientToken,
    contentType,
  });
  console.log('Upload result url:', uploadResult.url);
  console.log('Upload result pathname:', uploadResult.pathname);

  console.log('\n=== Step 3: Server head() Metadata Verification ===');
  const metadata = await head(storageKey, { token });
  console.log('head() retrieved metadata:');
  console.log(' - pathname:', metadata.pathname);
  console.log(' - size:', metadata.size, 'bytes');
  console.log(' - contentType:', metadata.contentType);
  console.log(' - uploadedAt:', metadata.uploadedAt);

  if (metadata.pathname !== storageKey) {
    throw new Error(`Pathname mismatch: expected ${storageKey}, got ${metadata.pathname}`);
  }
  if (metadata.size !== fileContent.length) {
    throw new Error(`Size mismatch: expected ${fileContent.length}, got ${metadata.size}`);
  }
  console.log('Metadata verified successfully!');

  console.log('\n=== Step 4: Security Verification (Unauthenticated Access Denied) ===');
  const publicFetchResponse = await fetch(uploadResult.url);
  console.log('Direct unauthenticated GET HTTP Status:', publicFetchResponse.status);
  if (publicFetchResponse.status === 403 || publicFetchResponse.status === 401) {
    console.log('CONFIRMED: Unauthenticated access is DENIED (HTTP ' + publicFetchResponse.status + '). Blob is strictly private.');
  } else {
    throw new Error(
      `SECURITY BREACH: Expected HTTP 403 or 401 for private blob, but got HTTP ${publicFetchResponse.status}. Unauthenticated access was permitted!`,
    );
  }

  console.log('\n=== Step 5: Deletion Verification ===');
  await del(storageKey, { token });
  console.log('del() executed for storageKey:', storageKey);

  let afterDeleteMeta = null;
  try {
    afterDeleteMeta = await head(storageKey, { token });
  } catch (err) {
    // Expected BlobNotFoundError
    console.log('head() after del threw expected error:', err.message || err.name);
  }

  if (!afterDeleteMeta) {
    console.log('CONFIRMED: Object successfully deleted and confirmed absent from storage.');
  } else {
    throw new Error(
      `CLEANUP FAILURE: Object still exists in storage after deletion! Metadata: ${JSON.stringify(afterDeleteMeta)}`,
    );
  }

  console.log('\n=== ALL PRIVATE STORAGE VERIFICATION CHECKS PASSED ===');
}

verifyPrivateBlobIntegration().catch((err) => {
  console.error('\nVerification failed:', err);
  process.exit(1);
});
