'use client';
import { useState, type FormEvent } from 'react';
import type { Locale } from '@/lib/i18n';
import styles from './EstateNewsletter.module.css';
export function EstateNewsletterForm({ locale }: { locale: Locale }) {
  const fr = locale === 'fr';
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setBusy(true); setError('');
    try {
      const response = await fetch('/api/estate/newsletter', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.get('email'), website: data.get('website'), locale, consent: data.get('consent') === 'on' }) });
      if (!response.ok) throw new Error(response.status === 429
        ? (fr ? 'Trop de tentatives. Réessayez plus tard.' : 'Too many attempts. Please try again later.')
        : (fr ? 'Inscription impossible. Réessayez dans un instant.' : 'Unable to subscribe. Please try again shortly.'));
      setSuccess(true); form.reset();
    } catch (e) { setError(e instanceof Error ? e.message : (fr ? 'Inscription impossible.' : 'Unable to subscribe.')); }
    finally { setBusy(false); }
  }
  return <section className={styles.section} aria-labelledby="estate-newsletter-title">
    <div><p className="realEstateEyebrow">Newsletter</p><h2 id="estate-newsletter-title">{fr ? 'Les nouveaux biens, dans votre boîte mail.' : 'New properties, in your inbox.'}</h2>
      <p>{fr ? 'Inscrivez-vous pour découvrir nos nouveautés immobilières.' : 'Subscribe to discover our latest properties.'}</p></div>
    {success ? <p className={styles.success} role="status">{fr ? 'Merci ! Votre inscription a bien été enregistrée.' : 'Thank you! Your subscription has been saved.'}</p>
      : <form onSubmit={submit} className={styles.form}>
        <div className={styles.row}><label className={styles.email}><span className="srOnly">{fr ? 'Adresse email' : 'Email address'}</span>
          <input type="email" name="email" placeholder={fr ? 'Votre adresse email' : 'Your email address'} autoComplete="email" required maxLength={254} disabled={busy}/></label>
          <button type="submit" className="realEstateSellButton" disabled={busy}>{busy ? (fr ? 'Inscription…' : 'Subscribing…') : (fr ? 'M’inscrire' : 'Subscribe')} <span aria-hidden="true">↗</span></button></div>
        <label className={styles.consent}><input name="consent" type="checkbox" required disabled={busy}/><span>{fr ? 'J’accepte de recevoir la newsletter immobilière de Brother Studio.' : 'I agree to receive the Brother Studio property newsletter.'}</span></label>
        <div className={styles.trap} aria-hidden="true"><label>Website<input name="website" tabIndex={-1} autoComplete="off"/></label></div>
        {error ? <p className={styles.error} role="alert">{error}</p> : null}
      </form>}
  </section>;
}
