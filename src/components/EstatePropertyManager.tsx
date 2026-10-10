"use client";
import { useEffect, useState } from 'react';
import { ESTATE_CATEGORIES, ESTATE_STATUSES, normalizeEstateContent, type EstateContent, type EstateProperty } from '@/lib/estate';
const emptyContent: EstateContent={title:'',location:'',status:'',price:'',rooms:'',area:'',outdoorArea:'',exterior:'',description:''};
const labels: Record<keyof EstateContent,string>={title:'Titre',location:'Localisation',status:'Disponibilité / statut',price:'Prix affiché',rooms:'Pièces',area:'Surface habitation',outdoorArea:'Surface extérieure',exterior:'Extérieur / stationnement',description:'Description'};
function blank(): EstateProperty{return {id:'',category:'Appartement',published:false,featured:false,sort_order:0,image:'',images:[],documents:[],content_fr:{...emptyContent},content_en:{...emptyContent},updated_at:''};}
export function EstatePropertyManager({onDirty}:{onDirty:(dirty:boolean)=>void}){
 const [properties,setProperties]=useState<EstateProperty[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState(''),[message,setMessage]=useState(''),[revision,setRevision]=useState(0);
 const [draft,setDraft]=useState<EstateProperty|null>(null),[original,setOriginal]=useState(''),[saving,setSaving]=useState(false),[search,setSearch]=useState(''),[language,setLanguage]=useState<'fr'|'en'>('fr');
 const dirty=!!draft&&JSON.stringify(draft)!==original;
 useEffect(()=>{onDirty(dirty);return()=>onDirty(false);},[dirty,onDirty]);
 useEffect(()=>{if(!dirty)return;const handler=(e:BeforeUnloadEvent)=>e.preventDefault();window.addEventListener('beforeunload',handler);return()=>window.removeEventListener('beforeunload',handler);},[dirty]);
 useEffect(()=>{const c=new AbortController();setLoading(true);fetch('/api/estate/properties',{cache:'no-store',signal:c.signal}).then(async r=>{const p=await r.json();if(!r.ok)throw new Error(p.error);setProperties(p.properties);setError('');}).catch(e=>{if(!c.signal.aborted)setError(e.message);}).finally(()=>{if(!c.signal.aborted)setLoading(false);});return()=>c.abort();},[revision]);
 function select(p:EstateProperty){if(dirty&&!window.confirm('Quitter sans enregistrer ce bien ?'))return;const normalized={...p,content_fr:normalizeEstateContent(p.content_fr,p.category),content_en:normalizeEstateContent(p.content_en,p.category)};setDraft(structuredClone(normalized));setOriginal(JSON.stringify(normalized));setMessage('');setError('');if(window.matchMedia('(max-width:760px)').matches)requestAnimationFrame(()=>document.querySelector('.estatePropertyEditor')?.scrollIntoView({block:'start',behavior:'smooth'}));}
 function update(p:Partial<EstateProperty>){setDraft(d=>d?{...d,...p}:d);}
 async function save(e:React.FormEvent){e.preventDefault();if(!draft)return;setSaving(true);setError('');setMessage('');try{
 const r=await fetch('/api/estate/properties',{method:draft.updated_at?'PATCH':'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(draft)});const p=await r.json();if(!r.ok)throw new Error(p.error);
 setDraft(p.property);setOriginal(JSON.stringify(p.property));setProperties(items=>[...items.filter(i=>i.id!==p.property.id),p.property].sort((a,b)=>a.sort_order-b.sort_order));setMessage('Bien enregistré. Les modifications sont visibles sur le site si le bien est publié.');
 }catch(e){setError(e instanceof Error?e.message:'Enregistrement impossible.');}finally{setSaving(false);}}
 async function remove(){if(!draft||!window.confirm(`Supprimer définitivement « ${draft.content_fr.title || draft.id} » ? Les demandes reçues seront conservées.`))return;setSaving(true);setError('');try{const r=await fetch('/api/estate/properties',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:draft.id,updated_at:draft.updated_at})});const p=await r.json();if(!r.ok)throw new Error(p.error);setProperties(items=>items.filter(i=>i.id!==draft.id));setDraft(null);setOriginal('');setMessage('Bien supprimé.');}catch(e){setError(e instanceof Error?e.message:'Suppression impossible.');}finally{setSaving(false);}}
 const contentKey=language==='fr'?'content_fr':'content_en';
 return <div className="valuationWorkspace">
 <div className="valuationHeading"><div><p className="valuationEyebrow">Catalogue immobilier</p><h2>Vos biens</h2><p>{properties.length} biens · {properties.filter(p=>p.published).length} publiés</p></div><div className="prospectHeaderActions"><button className="valuationRefresh" disabled={saving||loading} onClick={()=>select(blank())}>Créer un bien</button><button className="valuationRefresh" disabled={saving||loading} onClick={()=>{if(!dirty||window.confirm('Actualiser et abandonner les modifications ?')){setDraft(null);setOriginal('');setRevision(n=>n+1);}}}>Actualiser</button></div></div>
 {!draft&&error?<p className="valuationError" role="alert">{error}</p>:null}{!draft&&message?<p className="prospectSuccess" role="status">{message}</p>:null}
 {loading?<p role="status">Chargement des biens…</p>:<div className="estatePropertyColumns"><aside><label className="estateSearch">Rechercher un bien<input type="search" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Titre, localisation…"/></label><ul className="valuationList">{properties.filter(p=>`${p.content_fr.title} ${p.content_fr.location} ${p.id}`.toLowerCase().includes(search.toLowerCase())).map(p=><li key={p.id}><button disabled={saving} aria-pressed={draft?.id===p.id} onClick={()=>select(p)}><strong>{p.content_fr.title||p.id}</strong><span>{p.content_fr.location}</span><span>{p.published?'Publié':'Brouillon'} · {p.content_fr.price}</span></button></li>)}</ul></aside>
 {draft?<form className="estatePropertyEditor prospectFollowupForm" onSubmit={save}><h3>{draft.updated_at?'Modifier le bien':'Nouveau bien'}</h3>
 <fieldset disabled={saving}><div className="estateFieldGrid"><label>Adresse du bien (identifiant)<input value={draft.id} disabled={!!draft.updated_at} pattern="[a-z0-9]+(-[a-z0-9]+)*" maxLength={120} required onChange={e=>update({id:e.target.value})} placeholder="villa-monthey"/></label><label>Catégorie<select value={draft.category} onChange={e=>update({category:e.target.value})}>{ESTATE_CATEGORIES.map(c=><option key={c}>{c}</option>)}</select></label><label>Ordre d’affichage<input type="number" min={-100000} max={100000} value={draft.sort_order} onChange={e=>update({sort_order:Number(e.target.value)})}/></label></div>
 <div className="estateChecks"><label><input type="checkbox" checked={draft.published} onChange={e=>update({published:e.target.checked})}/>Publié sur le site</label><label><input type="checkbox" checked={draft.featured} onChange={e=>update({featured:e.target.checked})}/>Mis en avant</label></div>
 <div className="prospectModeSwitch" aria-label="Langue du contenu"><button type="button" aria-pressed={language==='fr'} onClick={()=>setLanguage('fr')}>Français</button><button type="button" aria-pressed={language==='en'} onClick={()=>setLanguage('en')}>English</button></div><p className="valuationDate">Complétez les deux langues avant de publier.</p>

 <div className="estateFieldGrid">
 {(Object.keys(labels) as (keyof EstateContent)[]).map(k => (
  <label key={k} className={k === 'description' ? 'estateWide' : ''}>
   {labels[k]} · {language.toUpperCase()}
   {k === 'status' ? (
    <select value={draft[contentKey].status} onChange={e => {
     const option = ESTATE_STATUSES.find(s => s[language] === e.target.value);
     if (option) update({
      content_fr: {...draft.content_fr, status: option.fr},
      content_en: {...draft.content_en, status: option.en},
     });
     else update({[contentKey]: {...draft[contentKey], status: e.target.value}});
    }}>
     <option value="">Choisir un statut</option>
     {draft[contentKey].status && !ESTATE_STATUSES.some(s => s[language] === draft[contentKey].status)
      ? <option value={draft[contentKey].status}>{draft[contentKey].status}</option> : null}
     {ESTATE_STATUSES.map(s => <option key={s.fr} value={s[language]}>{s[language]}</option>)}
    </select>
   ) : k === 'description' ? (
    <textarea rows={6} maxLength={15000} value={draft[contentKey][k] ?? ''} onChange={e => update({[contentKey]: {...draft[contentKey], [k]: e.target.value}})} />
   ) : (
    <input maxLength={300} value={draft[contentKey][k] ?? ''} onChange={e => update({[contentKey]: {...draft[contentKey], [k]: e.target.value}})} />
   )}
  </label>
 ))}
 </div>
 <h4>Images</h4><label>Image principale (lien ou chemin du site)<input value={draft.image} required onChange={e=>update({image:e.target.value})} placeholder="/immobilier/… ou https://…"/></label>
 <label>Galerie — un lien par ligne<textarea rows={5} value={draft.images.join('\n')} onChange={e=>update({images:e.target.value.split('\n')})} onBlur={()=>update({images:draft.images.map(s=>s.trim()).filter(Boolean)})} required/></label>
 <p className="valuationDate">L’ordre des lignes définit l’ordre du balayage des images.</p>
 <h4>Documents</h4>{draft.documents.map((d,i)=><div className="estateDocument" key={i}>{(['title','title_en','type','href'] as const).map(k=><label key={k}>{{title:'Titre français',title_en:'Titre anglais',type:'Type (PDF…)',href:'Lien du document'}[k]}<input value={d[k]} onChange={e=>update({documents:draft.documents.map((doc,j)=>j===i?{...doc,[k]:e.target.value}:doc)})}/></label>)}<button type="button" className="valuationRefresh" onClick={()=>update({documents:draft.documents.filter((_,j)=>j!==i)})}>Retirer ce document</button></div>)}<button className="valuationRefresh" type="button" onClick={()=>update({documents:[...draft.documents,{title:'',title_en:'',type:'PDF',href:''}]})}>Ajouter un document</button>
 </fieldset>{error?<p className="valuationError" role="alert">{error}</p>:null}{message?<p className="prospectSuccess" role="status">{message}</p>:null}<div className="estateEditorActions"><button className="valuationRefresh" type="submit" disabled={saving||!dirty}>{saving?'Enregistrement…':'Enregistrer'}</button>{draft.updated_at?<><a href={`/fr/immobilier/${draft.id}`} target="_blank" rel="noopener noreferrer">Voir la fiche</a><button className="valuationRefresh estateDelete" type="button" disabled={saving} onClick={remove}>Supprimer</button></>:null}</div><p className="valuationDate">{dirty?'Modifications non enregistrées':'À jour'}</p>
 </form>:<section className="valuationEmpty"><h3>Sélectionnez un bien</h3><p>Modifiez une annonce ou créez un nouveau bien.</p></section>}</div>}
 </div>;
}
