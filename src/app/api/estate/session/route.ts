import { estateSameOrigin } from "@/lib/estateServer";
import { NextResponse } from 'next/server';
import { ADMIN_SESSION_COOKIE,createAdminSession,hasAdminSession } from '@/lib/adminSession';
import { estateRateLimit } from '@/lib/estateServer';
export async function GET(){return NextResponse.json({authorized:await hasAdminSession()},{headers:{'Cache-Control':'no-store'}});}
export async function POST(request: Request){
 try {
  if(!estateSameOrigin(request)) return NextResponse.json({error:'Origine invalide.'},{status:403});
  if(!await estateRateLimit(request,'login',8,900)) return NextResponse.json({error:'Trop de tentatives. Réessayez dans 15 minutes.'},{status:429});
  const body=await request.json().catch(()=>null);
  if(body?.code!==(process.env.ADMIN_ACCESS_CODE || '1870')) return NextResponse.json({error:'Code incorrect.'},{status:403});
  const response=NextResponse.json({authorized:true});
  response.cookies.set(ADMIN_SESSION_COOKIE,createAdminSession(),{httpOnly:true,secure:new URL(request.url).protocol==='https:',sameSite:'strict',path:'/',maxAge:86400});
  return response;
 } catch {return NextResponse.json({error:'Connexion indisponible.'},{status:503});}
}
export async function DELETE(request: Request){
 if(!estateSameOrigin(request)) return NextResponse.json({error:'Origine invalide.'},{status:403});
 const response=NextResponse.json({ok:true});response.cookies.set(ADMIN_SESSION_COOKIE,'',{path:'/',maxAge:0});return response;
}
