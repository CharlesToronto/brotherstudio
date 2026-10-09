import { estateSameOrigin } from "@/lib/estateServer";
import { NextResponse } from 'next/server';
import { hasAdminSession } from '@/lib/adminSession';
import { getSupabaseAdminClient } from '@/lib/supabase/server';
import { estateRateLimit, visitForDashboard } from '@/lib/estateServer';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'private, no-store'};
export async function GET() {
 try {
  if(!await hasAdminSession()) return NextResponse.json({error:'Connexion requise.'},{status:401,headers});
  const db=getSupabaseAdminClient(), requests=[];
  for(let offset=0;;offset+=500){
   const {data,error}=await db.from('estate_visit_requests').select('*').order('created_at',{ascending:false}).order('id').range(offset,offset+499);
   if(error) throw error;
   requests.push(...data.map(visitForDashboard)); if(data.length<500) break;
  }
  return NextResponse.json({requests},{headers});
 } catch {return NextResponse.json({error:'Chargement impossible.'},{status:500,headers});}
}
export async function POST(request: Request) {
 try {
  if(!estateSameOrigin(request)) return NextResponse.json({error:'origin'},{status:403,headers});
  const b=await request.json().catch(()=>null);
  if(!b || typeof b.name!=='string' || !b.name.trim() || b.name.length>160 || typeof b.email!=='string' || b.email.length>254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(b.email) || typeof b.phone!=='string' || !/^[+\d\s().-]{6,40}$/.test(b.phone) || typeof b.propertyId!=='string' || b.propertyId.length>120 || !['fr','en'].includes(b.locale) || typeof b.submissionId!=='string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(b.submissionId)) return NextResponse.json({error:'invalid'},{status:400,headers});
  if(b.website) return NextResponse.json({ok:true},{headers});
  if(!await estateRateLimit(request,'visit',10,3600)) return NextResponse.json({error:'rate'},{status:429,headers});
  const db=getSupabaseAdminClient();
  const {data:p,error:propertyError}=await db.from('estate_properties').select('id,category,content_fr').eq('id',b.propertyId).eq('published',true).maybeSingle();
  if(propertyError) throw propertyError;
  if(!p) return NextResponse.json({error:'unavailable'},{status:404,headers});
  const parts=b.name.trim().split(/\s+/);
  const {error}=await db.from('estate_visit_requests').insert({submission_id:b.submissionId,property_id:p.id,property_slug:p.id,property_title:p.content_fr.title,property_location:p.content_fr.location,property_type:p.category,first_name:parts.shift(),last_name:parts.join(' '),email:b.email.trim().toLowerCase(),phone:b.phone.trim(),locale:b.locale});
  if(error && error.code!=='23505') throw error;
  return NextResponse.json({ok:true},{headers});
 } catch {return NextResponse.json({error:'unavailable'},{status:500,headers});}
}
