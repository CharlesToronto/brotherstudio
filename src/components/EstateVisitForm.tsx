"use client";
import { useRef, useState } from 'react';
import type { Locale } from '@/lib/i18n';
export function EstateVisitForm({locale,propertyId}:{locale:Locale;propertyId:string}){
 const fr=locale==='fr', submissionId=useRef('');
 const [busy,setBusy]=useState(false),[sent,setSent]=useState(false),[error,setError]=useState('');
 if(sent) return <p role="status">{fr?'Merci, votre demande de visite a bien été envoyée. Nous vous recontacterons.':'Thank you, your viewing request has been sent. We will contact you.'}</p>;
 return <form onSubmit={async event=>{
  event.preventDefault();if(busy)return;setBusy(true);setError('');
  const form=new FormData(event.currentTarget);
  submissionId.current ||= crypto.randomUUID();
  try {
   const response=await fetch('/api/estate/visits',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:form.get('name'),email:form.get('email'),phone:form.get('phone'),website:form.get('website'),locale,propertyId,submissionId:submissionId.current})});
   if(!response.ok) throw new Error(response.status===429 ? (fr?'Trop de demandes. Réessayez plus tard.':'Too many requests. Please try again later.') : (fr?'Envoi impossible. Vérifiez vos coordonnées et réessayez.':'Unable to send. Check your contact details and try again.'));
   setSent(true);
  } catch(e){setError(e instanceof Error?e.message:(fr?'Connexion impossible.':'Connection failed.'));}finally{setBusy(false);}
 }}>
 <input name="name" autoComplete="name" maxLength={160} aria-label={fr?'Nom complet':'Full name'} placeholder={fr?'Nom complet *':'Full name *'} required disabled={busy}/>
 <input name="email" type="email" autoComplete="email" maxLength={254} aria-label={fr?'Adresse e-mail':'Email address'} placeholder={fr?'Adresse e-mail *':'Email address *'} required disabled={busy}/>
 <input name="phone" type="tel" autoComplete="tel" minLength={6} maxLength={40} aria-label={fr?'Numéro de téléphone':'Phone number'} placeholder={fr?'Numéro de téléphone *':'Phone number *'} required disabled={busy}/>
 <div hidden><label>Website<input name="website" tabIndex={-1} autoComplete="off"/></label></div>
 <button type="submit" disabled={busy}>{busy?(fr?'Envoi…':'Sending…'):(fr?'Organiser une visite':'Arrange a visit')}</button>
 {error?<p role="alert">{error}</p>:null}
 </form>;
}
