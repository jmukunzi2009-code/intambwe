import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getCurrentUser, logAudit } from '@/lib/auth';
import { isStaffRole } from '@/lib/permissions';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const res = await query('SELECT setting_key, setting_value, description FROM website_settings');
    const settings = {};
    for (const row of res.rows) {
      settings[row.setting_key] = row.setting_value;
    }
    return NextResponse.json({ settings, rows: res.rows });
  } catch (error) {
    console.error('Fetch settings error:', error);
    return NextResponse.json({ error: 'Failed to load website settings.' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await getCurrentUser();
    if (!user || !isStaffRole(user.role)) {
      return NextResponse.json({ error: 'Unauthorized: only staff can modify website settings.' }, { status: 403 });
    }

    const body = await request.json();
    const { key, value, description } = body;

    if (!key || typeof key !== 'string') {
      return NextResponse.json({ error: 'Setting key is required.' }, { status: 400 });
    }

    const res = await query(
      `INSERT INTO website_settings (setting_key, setting_value, description, updated_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (setting_key)
       DO UPDATE SET setting_value = EXCLUDED.setting_value,
                     description = COALESCE(EXCLUDED.description, website_settings.description),
                     updated_at = NOW()
       RETURNING *`,
      [key.trim(), String(value || ''), description || null]
    );

    await logAudit({
      userId: user.id,
      action: 'SETTING_UPDATED',
      entityType: 'website_settings',
      entityId: key,
      details: { key, value },
    });

    return NextResponse.json({ success: true, setting: res.rows[0] });
  } catch (error) {
    console.error('Save setting error:', error);
    return NextResponse.json({ error: error.message || 'Failed to save setting.' }, { status: 500 });
  }
}
