"use client";

import { FormEvent, useState } from "react";

const ADMIN_CODE = "783870";
const ADMIN_UNLOCK_STORAGE_KEY = "bs_admin_unlocked";

export function AdminLockOverlay() {
  const [isUnlocked, setIsUnlocked] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.sessionStorage.getItem(ADMIN_UNLOCK_STORAGE_KEY) === "1";
  });
  const [error, setError] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const codeRaw = formData.get("code");
    const code = typeof codeRaw === "string" ? codeRaw.trim() : "";

    if (code !== ADMIN_CODE) {
      setError("Code incorrect.");
      return;
    }

    window.sessionStorage.setItem(ADMIN_UNLOCK_STORAGE_KEY, "1");
    setError("");
    setIsUnlocked(true);
  };

  if (isUnlocked) return null;

  return (
    <div className="adminLockOverlay" role="dialog" aria-modal="true" aria-labelledby="adminLockTitle">
      <form className="adminLockCard" onSubmit={handleSubmit}>
        <h2 id="adminLockTitle" className="adminLockTitle">
          Accès Admin
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
