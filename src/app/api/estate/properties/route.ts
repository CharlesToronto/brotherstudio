import { estateSameOrigin } from "@/lib/estateServer";
import { NextResponse } from 'next/server';
import { hasAdminSession } from '@/lib/adminSession';
import { getSupabaseAdminClient } from '@/lib/supabase/server';
import { validateEstate } from '@/lib/estate';
export const dynamic = 'force-dynamic';
const headers = {'Cache-Control':'private, no-store'};
export async function GET() {
 try {
  if(!await hasAdminSession()) return NextResponse.json({error:'Connexion requise.'},{status:401,headers});
  const {data,error}=await getSupabaseAdminClient().from('estate_properties').select('*').order('sort_order').order('id');
  if(error) throw error;
  return NextResponse.json({properties:data},{headers});
 } catch {return NextResponse.json({error:'Chargement impossible.'},{status:500,headers});}
}
async function mutate(request: Request) {
 try {
  if(!await hasAdminSession()) return NextResponse.json({error:'Connexion requise.'},{status:401,headers});
  if(!estateSameOrigin(request)) return NextResponse.json({error:'Origine invalide.'},{status:403,headers});
  const body=await request.json();
  const db=getSupabaseAdminClient();
  if(request.method==='DELETE') {
   if(typeof body.id!=='string' || typeof body.updated_at!=='string') return NextResponse.json({error:'Données invalides.'},{status:400,headers});
   const {data,error}=await db.from('estate_properties').delete().eq('id',body.id).eq('updated_at',body.updated_at).select('id').maybeSingle();
   if(error) throw error;
   return NextResponse.json(data?{ok:true}:{error:'Le bien a changé. Actualisez.'},{status:data?200:409,headers});
  }
  const p=validateEstate(body);
  if(!p) return NextResponse.json({error:'Vérifiez les champs, les liens et les deux langues avant de publier.'},{status:400,headers});
  const record={id:p.id,category:p.category,published:p.published,featured:p.featured,sort_order:p.sort_order,image:p.image,images:p.images,documents:p.documents,content_fr:p.content_fr,content_en:p.content_en,updated_at:new Date().toISOString()};
  const query=request.method==='POST'?db.from('estate_properties').insert(record):db.from('estate_properties').update(record).eq('id',p.id).eq('updated_at',p.updated_at);
  const {data,error}=await query.select().maybeSingle();
  if(error?.code==='23505') return NextResponse.json({error:'Cette adresse est déjà utilisée.'},{status:409,headers});
  if(error) throw error;
  return NextResponse.json(data?{property:data}:{error:'Le bien a changé. Actualisez avant de réessayer.'},{status:data?200:409,headers});
 } catch {return NextResponse.json({error:'Enregistrement impossible.'},{status:500,headers});}
}
export const POST=mutate;
export const PATCH=mutate;
export const DELETE=mutate;
