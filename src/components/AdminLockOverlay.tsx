"use client";

import { FormEvent, useEffect, useState } from "react";

const ACCESS_CODE = "1870";
const ADMIN_UNLOCK_STORAGE_KEY = "bs_admin_unlocked";

type AdminLockOverlayProps = {
  title?: string;
  storageKey?: string;
};

export function AdminLockOverlay({
  title = "Accès Admin",
  storageKey = ADMIN_UNLOCK_STORAGE_KEY,
}: AdminLockOverlayProps) {
  const cookieKey = `${storageKey}_cookie`;

  const readUnlockedState = () => {
    if (typeof window === "undefined") return false;
    const hasCookie = document.cookie
      .split(";")
      .some((entry) => entry.trim() === `${cookieKey}=1`);
    return (
      hasCookie ||
      window.sessionStorage.getItem(storageKey) === "1" ||
      window.localStorage.getItem(storageKey) === "1"
    );
  };

  const [isUnlocked, setIsUnlocked] = useState(() => {
    return storageKey === ADMIN_UNLOCK_STORAGE_KEY ? false : readUnlockedState();
  });
  const [checking, setChecking] = useState(storageKey === ADMIN_UNLOCK_STORAGE_KEY);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [code, setCode] = useState("");

  useEffect(() => {
    if (storageKey !== ADMIN_UNLOCK_STORAGE_KEY) return;
    let active = true;
    fetch("/api/admin/session", { cache: "no-store" }).then((response) => response.json()).then((data) => {
      if (active && data.authorized) setIsUnlocked(true);
    }).catch(() => {}).finally(() => { if (active) setChecking(false); });
    return () => { active = false; };
  }, [storageKey]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextCode = code.trim();

    if (!nextCode) {
      setError("Veuillez renseigner ce champ.");
      return;
    }

    if (storageKey === ADMIN_UNLOCK_STORAGE_KEY) {
      setSubmitting(true);
      try {
        const response = await fetch("/api/admin/session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: nextCode }) });
        if (!response.ok) { setError("Code incorrect ou accès indisponible."); return; }
      } catch { setError("Connexion impossible. Réessayez."); return; }
      finally { setSubmitting(false); }
    } else if (nextCode !== ACCESS_CODE) {
      setError("Code incorrect.");
      return;
    }

    try {
      window.sessionStorage.setItem(storageKey, "1");
    } catch {}
    try {
      window.localStorage.setItem(storageKey, "1");
    } catch {}
    document.cookie = `${cookieKey}=1; path=/; max-age=86400; SameSite=Lax`;
    window.dispatchEvent(new Event("brotherstudio-admin-unlocked"));
    setError("");
    setCode("");
    setIsUnlocked(true);
  };

  if (isUnlocked) return null;

  return (
    <div className="adminLockOverlay" role="dialog" aria-modal="true" aria-labelledby="adminLockTitle">
      <form className="adminLockCard" onSubmit={handleSubmit} noValidate>
        <h2 id="adminLockTitle" className="adminLockTitle">
          {title}
        </h2>
        <p className="adminLockText">Entrez le code pour déverrouiller cette page.</p>
        <input
          className="adminLockInput"
          name="code"
          type="password"
          inputMode="numeric"
          autoComplete="one-time-code"
          autoFocus
          disabled={checking || submitting}
          value={code}
          onChange={(event) => {
            setCode(event.target.value);
            if (error) setError("");
          }}
        />
        <button className="adminLockButton" type="submit" disabled={checking || submitting}>
          {checking || submitting ? "Vérification…" : "Déverrouiller"}
        </button>
        {error ? <p className="adminLockError">{error}</p> : null}
      </form>
    </div>
  );
}
