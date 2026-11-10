import { NextResponse } from 'next/server';
import { destroySession, getCurrentUser, logAudit } from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST(request) {
  try {
    const user = await getCurrentUser();
    if (user) {
      await logAudit({
        userId: user.id,
        action: 'USER_LOGOUT',
        entityType: 'users',
        entityId: user.id,
      });
    }

    await destroySession();

    // Check Accept header
    const acceptHeader = request.headers.get('accept') || '';
    if (acceptHeader.includes('text/html')) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    return NextResponse.json({ success: true, message: 'Signed out successfully.' });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.redirect(new URL('/login', request.url));
  }
}
