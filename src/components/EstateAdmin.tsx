"use client";
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { House, Inbox, LogOut, Mail } from 'lucide-react';
import { DashboardValuationRequests } from '@/components/DashboardValuationRequests';
import { EstateNewsletterList } from '@/components/EstateNewsletterList';
import { EstatePropertyManager } from '@/components/EstatePropertyManager';
import '@/components/dashboard-workspace.css';
import '@/components/estate-admin.css';
export function EstateAdmin(){
 const [authorized,setAuthorized]=useState(false),[checking,setChecking]=useState(true),[busy,setBusy]=useState(false),[code,setCode]=useState(''),[error,setError]=useState('');
 const [tab,setTab]=useState<'properties'|'visits'|'newsletter'>('properties');
 const dirty=useRef(false);
 const onDirty=useCallback((value:boolean)=>{dirty.current=value;},[]);
 useEffect(()=>{let active=true;fetch('/api/estate/session',{cache:'no-store'}).then(r=>r.json()).then(p=>{if(active)setAuthorized(p.authorized===true);}).catch(()=>{if(active)setError('Connexion indisponible.');}).finally(()=>{if(active)setChecking(false);});return()=>{active=false;};},[]);
 function leave(){return !dirty.current || window.confirm('Des modifications ne sont pas enregistrées. Continuer sans les enregistrer ?');}
 return <main className="estateAdmin">
 <header className="estateAdminHeader"><div><p className="valuationEyebrow">Brother Studio · Immobilier</p><h1>Administration immobilière</h1></div><div className="estateAdminHeaderActions"><Link className="estateHeaderAction estateHeaderSiteLink" href="/fr/immobilier/biens" onClick={e=>{if(!leave())e.preventDefault();}}>Voir le site</Link>{authorized?<button type="button" className="estateHeaderAction estateHeaderLogout" onClick={async()=>{if(!leave())return;const r=await fetch('/api/estate/session',{method:'DELETE'});if(r.ok){dirty.current=false;setAuthorized(false);}else setError('Déconnexion impossible.');}}><LogOut size={16}/>Déconnexion</button>:null}</div></header>
 {!authorized?<section className="estateLogin"><h2>Accès protégé</h2><p>Entrez votre code administrateur.</p><form className="prospectFollowupForm" onSubmit={async e=>{e.preventDefault();setBusy(true);setError('');try{const r=await fetch('/api/estate/session',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({code:code.trim()})});const p=await r.json();if(!r.ok)throw new Error(p.error);setAuthorized(true);setCode('');}catch(e){setError(e instanceof Error?e.message:'Connexion impossible.');}finally{setBusy(false);}}}><label>Code d’accès<input type="password" inputMode="numeric" autoComplete="current-password" value={code} onChange={e=>setCode(e.target.value)} required disabled={checking||busy}/></label><button className="valuationRefresh" disabled={checking||busy}>{checking?'Vérification…':busy?'Connexion…':'Déverrouiller'}</button></form>{error?<p className="valuationError" role="alert">{error}</p>:null}</section>:<>
 <div className="dashboardTopTabs" role="tablist" aria-label="Administration immobilière">{(['properties','visits','newsletter'] as const).map(t=><button key={t} type="button" role="tab" id={`estate-tab-${t}`} aria-controls={`estate-panel-${t}`} aria-selected={tab===t} onClick={()=>{if(t!==tab&&leave()){dirty.current=false;setTab(t);}}}>{t==='properties'?<House size={17}/>:t==='visits'?<Inbox size={17}/>:<Mail size={17}/>} {t==='properties'?'Biens':t==='visits'?'Demandes de visite':'Liste newsletter'}</button>)}</div>
 <section role="tabpanel" id={`estate-panel-${tab}`} aria-labelledby={`estate-tab-${tab}`}>{tab==='properties'?<EstatePropertyManager onDirty={onDirty}/>:tab==='visits'?<DashboardValuationRequests visits onUnsavedChange={onDirty}/>:<EstateNewsletterList/>}</section>
 </>}
 </main>;
}
