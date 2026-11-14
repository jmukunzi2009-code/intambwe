import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export const runtime = 'nodejs';

const CONTENT_TYPES = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
  '.m4v': 'video/x-m4v',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.m4a': 'audio/mp4',
  '.aac': 'audio/aac',
  '.flac': 'audio/flac',
};

export async function GET(_request, { params }) {
  const { filename } = await params;
  const ext = path.extname(filename).toLowerCase();

  if (path.basename(filename) !== filename || !CONTENT_TYPES[ext]) {
    return NextResponse.json({ error: 'File not found.' }, { status: 404 });
  }

  let file;
  try {
    file = await fs.readFile(path.join(process.cwd(), '.local-uploads', filename));
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.error('Read uploaded file error:', error);
      return NextResponse.json({ error: 'Unable to read uploaded file.' }, { status: 500 });
    }

    try {
      file = await fs.readFile(path.join(process.cwd(), 'public', 'uploads', filename));
    } catch (legacyError) {
      if (legacyError.code !== 'ENOENT') {
        console.error('Read legacy uploaded file error:', legacyError);
        return NextResponse.json({ error: 'Unable to read uploaded file.' }, { status: 500 });
      }
    }
  }

  if (file) {
    return new NextResponse(file, {
      headers: {
        'Content-Type': CONTENT_TYPES[ext],
        'Content-Length': String(file.length),
        'Cache-Control': 'public, max-age=3600',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  }

  return NextResponse.json({ error: 'File not found.' }, { status: 404 });
}
