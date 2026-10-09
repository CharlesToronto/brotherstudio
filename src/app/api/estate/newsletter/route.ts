import { NextResponse } from 'next/server';
import { hasAdminSession } from '@/lib/adminSession';
import { getSupabaseAdminClient } from '@/lib/supabase/server';
import { estateRateLimit, estateSameOrigin } from '@/lib/estateServer';
export const dynamic = 'force-dynamic';
const headers = { 'Cache-Control': 'private, no-store' };
export async function GET(request: Request) {
  try {
    if (!await hasAdminSession()) return NextResponse.json({ error: 'Connexion requise.' }, { status: 401, headers });
    const offset = Number(new URL(request.url).searchParams.get('offset') || 0);
    if (!Number.isSafeInteger(offset) || offset < 0) return NextResponse.json({ error: 'Page invalide.' }, { status: 400, headers });
    const { data, error, count } = await getSupabaseAdminClient().from('estate_newsletter_subscribers')
      .select('id,email,locale,created_at', { count: 'exact' }).order('created_at', { ascending: false }).order('id').range(offset, offset + 49);
    if (error) throw error;
    return NextResponse.json({ subscribers: data, total: count }, { headers });
  } catch { return NextResponse.json({ error: 'Chargement impossible.' }, { status: 500, headers }); }
}
export async function POST(request: Request) {
  try {
    if (!estateSameOrigin(request)) return NextResponse.json({ error: 'origin' }, { status: 403, headers });
    const body = await request.json().catch(() => null);
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
    if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !['fr', 'en'].includes(body?.locale) || body?.consent !== true)
      return NextResponse.json({ error: 'invalid' }, { status: 400, headers });
    if (body.website) return NextResponse.json({ ok: true }, { headers });
    if (!await estateRateLimit(request, 'newsletter', 10, 3600)) return NextResponse.json({ error: 'rate' }, { status: 429, headers });
    const { error } = await getSupabaseAdminClient().from('estate_newsletter_subscribers')
      .upsert({ email, locale: body.locale }, { onConflict: 'email', ignoreDuplicates: true });
    if (error) throw error;
    return NextResponse.json({ ok: true }, { headers });
  } catch { return NextResponse.json({ error: 'unavailable' }, { status: 500, headers }); }
}
