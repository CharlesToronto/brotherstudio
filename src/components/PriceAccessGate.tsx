"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

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
  fallbackHref: string;
  children: React.ReactNode;
};

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function PriceAccessGate({
  messages,
  fallbackHref,
  children,
}: PriceAccessGateProps) {
  const router = useRouter();
  const [email, setEmail] = useState(() => {
    if (typeof window === "undefined") return "";
    return window.sessionStorage.getItem(STORAGE_KEY) ?? "";
  });
  const [hasAccess, setHasAccess] = useState(() => isValidEmail(email));
  const [error, setError] = useState("");

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.push(fallbackHref);
  };

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
      className="priceAccessOverlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="priceAccessTitle"
    >
      <form className="priceAccessCard" onSubmit={handleSubmit}>
        <button
          className="priceAccessBackButton"
          type="button"
          onClick={handleBack}
          aria-label="Go back"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M15 10H5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
            <path
              d="M9 6L5 10L9 14"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="square"
              strokeLinejoin="miter"
            />
          </svg>
        </button>
        <h1 id="priceAccessTitle" className="priceAccessTitle">
          {messages.accessText}
        </h1>
        <label className="srOnly" htmlFor="price-access-email">
          {messages.accessPlaceholder}
        </label>
        <input
          id="price-access-email"
          className="priceAccessInput"
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
        <button className="priceAccessButton" type="submit">
          {messages.accessButton}
        </button>
        {error ? <p className="priceAccessError">{error}</p> : null}
        <p className="priceAccessLegal">{messages.accessLegal}</p>
      </form>
    </div>
  );
}
