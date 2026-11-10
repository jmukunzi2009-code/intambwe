import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { contactSchema } from '@/lib/validation';
import { getCurrentUser } from '@/lib/auth';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';

export const runtime = 'nodejs';

export async function POST(request) {
  try {
    const body = await request.json();
    const validatedData = contactSchema.parse(body);

    const res = await query(
      `INSERT INTO contact_messages (name, email, phone, subject, message, status)
       VALUES ($1, $2, $3, $4, $5, 'unread')
       RETURNING id, name, subject, created_at`,
      [
        validatedData.name,
        validatedData.email,
        validatedData.phone || null,
        validatedData.subject,
        validatedData.message,
      ]
    );

    return NextResponse.json({
      success: true,
      message: 'Your message has been received. Our leadership team will review and respond promptly.',
      entry: res.rows[0],
    });
  } catch (error) {
    console.error('Contact API error:', error);
    if (error.errors) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Failed to submit contact message. Please try again.' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user.role, PERMISSIONS.CONTACT_MANAGE)) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });
    }

    const res = await query(
      `SELECT id, name, email, phone, subject, message, status, admin_notes, created_at
       FROM contact_messages
       ORDER BY created_at DESC`
    );

    return NextResponse.json({ messages: res.rows });
  } catch (error) {
    console.error('Get contact messages error:', error);
    return NextResponse.json({ error: 'Failed to fetch messages.' }, { status: 500 });
  }
}
