'use client';
import { useCallback, useEffect, useState } from 'react';
type Subscriber = { id: string; email: string; locale: string; created_at: string };
export function EstateNewsletterList() {
  const [rows, setRows] = useState<Subscriber[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  const refresh = useCallback(() => { setBusy(true); setError(''); setRevision(v => v + 1); }, []);
  function changePage(next: number) { setBusy(true); setError(''); setOffset(next); }
  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/estate/newsletter?offset=${offset}`, { cache: 'no-store', signal: controller.signal })
      .then(async response => { const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Chargement impossible.'); return data; })
      .then(data => { setRows(data.subscribers); setTotal(data.total); })
      .catch(e => { if (!controller.signal.aborted) setError(e instanceof Error ? e.message : 'Chargement impossible.'); })
      .finally(() => { if (!controller.signal.aborted) setBusy(false); });
    return () => controller.abort();
  }, [offset, revision]);
  return <div className="estateNewsletterList">
    <div className="estateNewsletterHeader"><div><h2>Liste newsletter</h2><p>{total} inscription{total === 1 ? '' : 's'}</p></div>
      <button type="button" className="valuationRefresh" disabled={busy} onClick={refresh}>Actualiser</button></div>
    {error ? <p className="valuationError" role="alert">{error}</p> : busy ? <p role="status">Chargement des inscriptions…</p> : rows.length ? <div className="estateNewsletterTable"><table>
      <caption className="srOnly">Inscriptions à la newsletter immobilière</caption><thead><tr><th scope="col">Adresse email</th><th scope="col">Date d’inscription</th><th scope="col">Langue</th></tr></thead>
      <tbody>{rows.map(row => <tr key={row.id}><td>{row.email}</td><td>{new Intl.DateTimeFormat('fr-CH', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/Zurich' }).format(new Date(row.created_at))}</td><td>{row.locale === 'fr' ? 'Français' : 'Anglais'}</td></tr>)}</tbody>
    </table></div> : <p>Aucune inscription sur cette page pour le moment.</p>}
    {!error && total > 50 ? <div className="estateNewsletterPagination"><button className="valuationRefresh" disabled={busy || offset === 0} onClick={() => changePage(Math.max(0, offset - 50))}>Précédent</button><span>Page {offset / 50 + 1} sur {Math.ceil(total / 50)}</span><button className="valuationRefresh" disabled={busy || offset + 50 >= total} onClick={() => changePage(offset + 50)}>Suivant</button></div> : null}
  </div>;
}
