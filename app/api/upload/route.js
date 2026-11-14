import { put } from '@vercel/blob';
import { handleUpload } from '@vercel/blob/client';
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { isStaffRole } from '@/lib/permissions';
import fs from 'fs/promises';
import path from 'path';

export const runtime = 'nodejs';

const MAX_FILE_SIZE = 25 * 1024 * 1024;
const ALLOWED_EXTENSIONS = new Set([
  '.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg', '.pdf',
  '.mp4', '.webm', '.mov', '.m4v',
  '.mp3', '.wav', '.ogg', '.m4a', '.aac', '.flac',
]);
const ALLOWED_CONTENT_TYPES = [
  'image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml',
  'application/pdf',
  'video/mp4', 'video/webm', 'video/quicktime', 'video/x-m4v',
  'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/aac', 'audio/flac',
];

function isBlobStorageEnabled() {
  return process.env.VERCEL === '1' || Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

async function authorizeAdminUpload(purpose) {
  if (purpose !== 'admin') return null;
  const user = await getCurrentUser();
  if (!user || !isStaffRole(user.role)) {
    throw new Error('You must be signed in as an administrator to upload this file.');
  }
  return user;
}

export async function GET() {
  const storage = isBlobStorageEnabled() ? 'blob' : 'local';
  return NextResponse.json({
    storage,
    configured: storage === 'local' || Boolean(process.env.BLOB_READ_WRITE_TOKEN),
  });
}

export async function POST(request) {
  const contentType = request.headers.get('content-type') || '';

  try {
    if (contentType.includes('application/json')) {
      const body = await request.json();

      if (body && typeof body.data === 'string') {
        const [, encoded] = body.data.split(';base64,');
        if (!encoded) {
          return NextResponse.json({ error: 'Invalid base64 file data provided.' }, { status: 400 });
        }

        const buffer = Buffer.from(encoded, 'base64');
        if (buffer.length > MAX_FILE_SIZE) {
          return NextResponse.json({ error: 'File size exceeds the 25 MB limit.' }, { status: 400 });
        }

        const mime = String(body.data.split(';')[0]).replace(/^data:/, '');
        const extensions = {
          'image/png': '.png',
          'image/jpeg': '.jpg',
          'image/webp': '.webp',
          'image/gif': '.gif',
          'image/svg+xml': '.svg',
          'application/pdf': '.pdf',
          'video/mp4': '.mp4',
          'audio/mpeg': '.mp3',
          'audio/wav': '.wav',
          'audio/ogg': '.ogg',
          'audio/mp4': '.m4a',
          'audio/aac': '.aac',
          'audio/flac': '.flac',
        };
        const ext = extensions[mime];
        if (!ext) {
          return NextResponse.json({ error: 'Unsupported file type.' }, { status: 400 });
        }

        const purpose = body.purpose || 'admin';
        await authorizeAdminUpload(purpose);
        const baseName = path.basename(String(body.filename || 'upload'), path.extname(String(body.filename || 'upload')))
          .replace(/[^a-zA-Z0-9_-]/g, '_')
          .slice(0, 40) || 'upload';
        const filename = `${Date.now()}-${baseName}${ext}`;

        if (isBlobStorageEnabled()) {
          if (!process.env.BLOB_READ_WRITE_TOKEN) {
            return NextResponse.json({ error: 'Vercel Blob is not configured. Add BLOB_READ_WRITE_TOKEN to the project environment variables.' }, { status: 503 });
          }
          const blob = await put(filename, buffer, { access: 'public', contentType: mime, addRandomSuffix: true });
          return NextResponse.json({ success: true, url: blob.url, filename, sizeMb: (buffer.length / (1024 * 1024)).toFixed(2) });
        }

        const uploadsDir = path.join(process.cwd(), '.local-uploads');
        await fs.mkdir(uploadsDir, { recursive: true });
        await fs.writeFile(path.join(uploadsDir, filename), buffer);
        return NextResponse.json({ success: true, url: `/uploads/${filename}`, filename, sizeMb: (buffer.length / (1024 * 1024)).toFixed(2) });
      }

      if (isBlobStorageEnabled() && !process.env.BLOB_READ_WRITE_TOKEN) {
        return NextResponse.json({ error: 'Vercel Blob is not configured. Create a Blob store and add BLOB_READ_WRITE_TOKEN to the project environment variables.' }, { status: 503 });
      }

      try {
        const response = await handleUpload({
          body,
          request,
          onBeforeGenerateToken: async (pathname, clientPayload) => {
            let purpose = 'admin';
            if (clientPayload) {
              try {
                purpose = JSON.parse(clientPayload).purpose || purpose;
              } catch {
                throw new Error('Invalid upload request.');
              }
            }
            await authorizeAdminUpload(purpose);

            if (!ALLOWED_EXTENSIONS.has(path.extname(pathname).toLowerCase())) {
              throw new Error('Unsupported file type. Upload an image, PDF, video, or audio file.');
            }

            return {
              allowedContentTypes: ALLOWED_CONTENT_TYPES,
              maximumSizeInBytes: MAX_FILE_SIZE,
              addRandomSuffix: true,
              tokenPayload: JSON.stringify({ purpose }),
            };
          },
        });

        return NextResponse.json(response);
      } catch (error) {
        console.error('Vercel Blob upload initialization error:', error);
        const message = error instanceof Error ? error.message : '';
        return NextResponse.json({
          error: message || 'Could not start the upload. Check the Blob store configuration and try again.',
        }, { status: 400 });
      }
    }

    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json({ error: 'Send the file using multipart/form-data.' }, { status: 415 });
    }

    const formData = await request.formData();
    const file = formData.get('file');
    const purpose = String(formData.get('purpose') || 'admin');
    await authorizeAdminUpload(purpose);

    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'No valid file was selected.' }, { status: 400 });
    }

    const ext = path.extname(file.name || '').toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return NextResponse.json({ error: 'Unsupported file type. Upload a JPG, PNG, WebP, GIF, PDF, video, or audio file.' }, { status: 400 });
    }
    if (file.size === 0) {
      return NextResponse.json({ error: 'The selected file is empty.' }, { status: 400 });
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File size exceeds the 25 MB limit.' }, { status: 400 });
    }
    if (isBlobStorageEnabled()) {
      return NextResponse.json({ error: 'Use the direct upload option for Vercel Blob storage.' }, { status: 400 });
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const safeBase = path.basename(file.name, ext).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 40) || 'upload';
    const filename = `${Date.now()}-${safeBase}${ext}`;
    const uploadsDir = path.join(process.cwd(), '.local-uploads');
    await fs.mkdir(uploadsDir, { recursive: true });
    await fs.writeFile(path.join(uploadsDir, filename), bytes);

    return NextResponse.json({
      success: true,
      url: `/uploads/${filename}`,
      filename,
      sizeMb: (bytes.length / (1024 * 1024)).toFixed(2),
    });
  } catch (error) {
    console.error('File upload error:', error);
    const errorMessage = error instanceof Error ? error.message : '';
    if (errorMessage.includes('administrator')) {
      return NextResponse.json({ error: errorMessage }, { status: 403 });
    }
    return NextResponse.json({
      error: isBlobStorageEnabled()
        ? 'Image storage failed. Check the Vercel Blob store configuration and try again.'
        : 'Upload failed because the local upload folder could not be written. Check folder permissions.',
    }, { status: 500 });
  }
}
