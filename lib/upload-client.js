'use client';

import { upload } from '@vercel/blob/client';

async function readJson(response, failureMessage) {
  try {
    return await response.json();
  } catch {
    throw new Error(failureMessage);
  }
}

async function readUploadResponse(response) {
  const contentType = response.headers.get('content-type') || '';
  const result = contentType.includes('application/json')
    ? await readJson(response, 'The upload service returned an invalid response. Please try again.')
    : null;

  if (!response.ok) {
    throw new Error(result?.error || `Upload failed (HTTP ${response.status}).`);
  }

  if (!result?.url) {
    throw new Error('The upload service returned no file URL.');
  }

  return result.url;
}

export async function uploadMediaFile(file, { purpose = 'admin' } = {}) {
  if (!file) throw new Error('Choose a file before uploading.');

  const configResponse = await fetch('/api/upload', { cache: 'no-store' });
  const config = await readJson(configResponse, 'The upload service is unavailable. Please try again in a moment.');
  if (!configResponse.ok) {
    throw new Error(config.error || 'Could not check upload storage configuration.');
  }

  if (config.storage === 'blob') {
    if (!config.configured) {
      throw new Error('Persistent image storage is not configured. Connect a Vercel Blob store and add BLOB_READ_WRITE_TOKEN in the deployment settings.');
    }

    const blob = await upload(file.name, file, {
      access: 'public',
      handleUploadUrl: '/api/upload',
      clientPayload: JSON.stringify({ purpose }),
    });
    return blob.url;
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('purpose', purpose);
  const response = await fetch('/api/upload', { method: 'POST', body: formData });
  return readUploadResponse(response);
}
