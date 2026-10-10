import { put } from '@vercel/blob/client';

export interface UploadResumeResult {
  resumeId: string;
  blobUrl: string;
  storageKey: string;
  status: 'UPLOADED';
}

export async function uploadResumeDirectly(
  file: File,
  apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  userId = '00000000-0000-0000-0000-000000000001',
): Promise<UploadResumeResult> {
  const contentType =
    file.type ||
    (file.name.endsWith('.pdf')
      ? 'application/pdf'
      : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');

  // Step 1: Request upload intent from backend API
  const intentResponse = await fetch(`${apiUrl}/api/v1/resumes/upload-intent`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': userId,
    },
    body: JSON.stringify({
      fileName: file.name,
      contentType,
      fileSize: file.size,
    }),
  });

  if (!intentResponse.ok) {
    const errorData = await intentResponse.json().catch(() => ({}));
    throw new Error(
      errorData.message || 'Failed to initialize resume upload intent',
    );
  }

  const { resumeId, clientToken, storageKey } = await intentResponse.json();

  // Step 2: Perform direct client upload to Vercel Blob using scoped clientToken
  const blobResult = await put(storageKey, file, {
    access: 'public',
    token: clientToken,
  });

  // Step 3: Notify backend to verify storage existence and transition status to UPLOADED
  const completeResponse = await fetch(
    `${apiUrl}/api/v1/resumes/${resumeId}/complete`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId,
      },
      body: JSON.stringify({
        blobUrl: blobResult.url,
      }),
    },
  );

  if (!completeResponse.ok) {
    const errorData = await completeResponse.json().catch(() => ({}));
    throw new Error(
      errorData.message || 'Failed to verify uploaded resume with server',
    );
  }

  const completeData = await completeResponse.json().catch(() => ({}));

  return {
    resumeId,
    blobUrl: blobResult.url,
    storageKey: completeData.storageKey || storageKey,
    status: completeData.status || 'UPLOADED',
  };
}
