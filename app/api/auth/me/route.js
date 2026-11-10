import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        role: user.role,
        schoolName: user.school_name,
        classLevel: user.class_level,
        country: user.country,
        phone: user.phone,
        bio: user.bio,
      },
    });
  } catch (error) {
    console.error('Me API error:', error);
    return NextResponse.json({ authenticated: false, user: null }, { status: 500 });
  }
}
