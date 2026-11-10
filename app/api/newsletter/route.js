import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { z } from 'zod';

const subscriberSchema = z.object({
  email: z.string().email('Please enter a valid email address').toLowerCase().trim(),
});

export async function POST(request) {
  try {
    const body = await request.json();
    const { email } = subscriberSchema.parse(body);

    await query(
      `INSERT INTO newsletter_subscribers (email, is_active)
       VALUES ($1, true)
       ON CONFLICT (email) 
       DO UPDATE SET is_active = true, subscribed_at = NOW()`,
      [email]
    );

    return NextResponse.json({
      success: true,
      message: 'Thank you for subscribing! You will receive invitations to upcoming youth summits and leadership resources.',
    });
  } catch (error) {
    if (error.errors) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('Newsletter error:', error);
    return NextResponse.json({ error: 'Failed to process subscription.' }, { status: 500 });
  }
}
