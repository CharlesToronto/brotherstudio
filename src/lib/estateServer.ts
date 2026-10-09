import 'server-only';
import { createHmac } from 'node:crypto';
import { getSupabaseAdminClient } from '@/lib/supabase/server';
import { localizeEstate, type EstateProperty } from '@/lib/estate';
export async function getEstateProperties(locale: string) {
 const {data,error} = await getSupabaseAdminClient().from('estate_properties').select('*').eq('published',true).order('sort_order').order('id');
 if(error) throw error;
 return (data as EstateProperty[]).map(p=>localizeEstate(p,locale));
}
export async function getEstateProperty(id: string, locale: string) {
 const {data,error} = await getSupabaseAdminClient().from('estate_properties').select('*').eq('published',true).eq('id',id).maybeSingle();
 if(error) throw error;
 return data ? localizeEstate(data as EstateProperty,locale) : null;
}
export async function estateRateLimit(request: Request, scope: string, max: number, seconds: number) {
 const ip = request.headers.get('x-vercel-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
 const key = createHmac('sha256',process.env.ADMIN_SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || '').update(`${scope}:${ip}`).digest('hex');
 const {data,error} = await getSupabaseAdminClient().rpc('estate_allow_request',{rate_key:key,max_attempts:max,window_seconds:seconds});
 if(error) throw error;
 return data === true;
}
export function visitForDashboard(row: Record<string, unknown>) {
 return {...row, property_address: `${row.property_title} — ${row.property_location}`, room_count:'',approximate_area:null,contact_time:'',sale_timeline:'',desired_price_chf:null};
}
/** Compare with the external Host: Next.js can use an internal hostname in request.url. */
export function estateSameOrigin(request: Request) {
 const origin = request.headers.get('origin');
 const host = request.headers.get('host');
 if(!origin || !host) return false;
 const protocol = new URL(request.url).protocol;
 return origin === `${protocol}//${host}`;
}
