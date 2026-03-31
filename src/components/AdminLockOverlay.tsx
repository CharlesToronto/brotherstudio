"use client";

import { FormEvent, useState } from "react";

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
  const [isUnlocked, setIsUnlocked] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.sessionStorage.getItem(storageKey) === "1";
  });
  const [error, setError] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const codeRaw = formData.get("code");
    const code = typeof codeRaw === "string" ? codeRaw.trim() : "";

    if (code !== ACCESS_CODE) {
      setError("Code incorrect.");
      return;
    }

    window.sessionStorage.setItem(storageKey, "1");
    setError("");
    setIsUnlocked(true);
  };

  if (isUnlocked) return null;

  return (
    <div className="adminLockOverlay" role="dialog" aria-modal="true" aria-labelledby="adminLockTitle">
      <form className="adminLockCard" onSubmit={handleSubmit}>
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
          required
        />
        <button className="adminLockButton" type="submit">
          Déverrouiller
        </button>
        {error ? <p className="adminLockError">{error}</p> : null}
      </form>
    </div>
  );
}
