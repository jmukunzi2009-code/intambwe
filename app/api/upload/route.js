import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { isStaffRole } from '@/lib/permissions';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';

export async function POST(request) {
  try {
    const user = await getCurrentUser();

    const contentType = request.headers.get('content-type') || '';
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // 1. Handle FormData upload
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file');

      if (!file || typeof file === 'string') {
        return NextResponse.json({ error: 'No valid file was uploaded.' }, { status: 400 });
      }

      const originalName = file.name || 'upload.bin';
      const ext = path.extname(originalName).toLowerCase() || '.png';
      const safeExtensions = ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg', '.pdf', '.mp4'];
      if (!safeExtensions.includes(ext)) {
        return NextResponse.json({ error: 'Unsupported file type. Please upload an image, PDF, or video.' }, { status: 400 });
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Max 25MB file
      if (buffer.length > 25 * 1024 * 1024) {
        return NextResponse.json({ error: 'File size exceeds 25MB limit.' }, { status: 400 });
      }

      const safeBase = path.basename(originalName, ext).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 40);
      const filename = `${Date.now()}-${safeBase}${ext}`;
      const filePath = path.join(uploadsDir, filename);

      fs.writeFileSync(filePath, buffer);

      return NextResponse.json({
        success: true,
        url: `/uploads/${filename}`,
        filename,
        sizeMb: (buffer.length / (1024 * 1024)).toFixed(2),
      });
    }

    // 2. Handle JSON base64 upload
    if (contentType.includes('application/json')) {
      const body = await request.json();
      const { data, filename: requestedName } = body;

      if (!data || typeof data !== 'string' || !data.includes(';base64,')) {
        return NextResponse.json({ error: 'Invalid base64 file data provided.' }, { status: 400 });
      }

      const [header, base64Data] = data.split(';base64,');
      const mime = header.replace('data:', '');
      const buffer = Buffer.from(base64Data, 'base64');

      if (buffer.length > 25 * 1024 * 1024) {
        return NextResponse.json({ error: 'File size exceeds 25MB limit.' }, { status: 400 });
      }

      let ext = '.png';
      if (mime.includes('pdf')) ext = '.pdf';
      else if (mime.includes('jpeg') || mime.includes('jpg')) ext = '.jpg';
      else if (mime.includes('webp')) ext = '.webp';
      else if (mime.includes('gif')) ext = '.gif';
      else if (mime.includes('mp4')) ext = '.mp4';

      const safeBase = (requestedName || 'upload').replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 40);
      const filename = `${Date.now()}-${safeBase}${ext}`;
      const filePath = path.join(uploadsDir, filename);

      fs.writeFileSync(filePath, buffer);

      return NextResponse.json({
        success: true,
        url: `/uploads/${filename}`,
        filename,
        sizeMb: (buffer.length / (1024 * 1024)).toFixed(2),
      });
    }

    return NextResponse.json({ error: 'Unsupported media type. Send multipart/form-data or base64 JSON.' }, { status: 415 });
  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json({ error: 'Failed to process file upload.' }, { status: 500 });
  }
}
