"use client";

import { FormEvent, useState } from "react";

type PriceAccessGateMessages = {
  accessTitle: string;
  accessText: string;
  accessPlaceholder: string;
  accessButton: string;
  accessLegal: string;
  invalidEmail: string;
};

const STORAGE_KEY = "brotherstudio-price-access-email";

type PriceAccessGateProps = {
  messages: PriceAccessGateMessages;
  children: React.ReactNode;
};

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function PriceAccessGate({ messages, children }: PriceAccessGateProps) {
  const [email, setEmail] = useState(() => {
    if (typeof window === "undefined") return "";
    return window.sessionStorage.getItem(STORAGE_KEY) ?? "";
  });
  const [hasAccess, setHasAccess] = useState(() => isValidEmail(email));
  const [error, setError] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedEmail = email.trim().toLowerCase();
    if (!isValidEmail(normalizedEmail)) {
      setError(messages.invalidEmail);
      return;
    }

    window.sessionStorage.setItem(STORAGE_KEY, normalizedEmail);
    setError("");
    setHasAccess(true);
  };

  if (hasAccess) {
    return <>{children}</>;
  }

  return (
    <div
      className="adminLockOverlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="priceAccessTitle"
    >
      <form className="adminLockCard" onSubmit={handleSubmit}>
        <p className="adminLockTitle">{messages.accessTitle}</p>
        <h1 id="priceAccessTitle" className="adminLockTitle">
          {messages.accessText}
        </h1>
        <label className="srOnly" htmlFor="price-access-email">
          {messages.accessPlaceholder}
        </label>
        <input
          id="price-access-email"
          className="adminLockInput"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder={messages.accessPlaceholder}
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            if (error) setError("");
          }}
          autoFocus
        />
        <button className="adminLockButton" type="submit">
          {messages.accessButton}
        </button>
        {error ? <p className="adminLockError">{error}</p> : null}
        <p className="adminLockText">{messages.accessLegal}</p>
      </form>
    </div>
  );
}
