"use client";

import { useEffect, useMemo, useState } from "react";
import Script from "next/script";

type Props = {
  locale?: string;
};

type ConsentStatus = "accepted" | "rejected" | null;

const MEASUREMENT_ID = "G-MLWGH1E59C";
const CONSENT_STORAGE_KEY = "analytics_cookie_consent";
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

const COPY_BY_LOCALE = {
  es: {
    title: "Uso de cookies",
    description:
      "Utilizamos cookies analiticas para medir el sitio. Puedes aceptar o rechazar su uso.",
    accept: "Aceptar",
    reject: "Rechazar",
  },
  en: {
    title: "Cookie notice",
    description:
      "We use analytics cookies to measure the site. You can accept or reject their use.",
    accept: "Accept",
    reject: "Reject",
  },
  vi: {
    title: "Thong bao cookie",
    description:
      "Chung toi su dung cookie phan tich de do luong va cai thien trang web. Ban co the chap nhan hoac tu choi.",
    accept: "Chap nhan",
    reject: "Tu choi",
  },
};

function parseConsentStatus(value: string | null | undefined): ConsentStatus {
  if (value === "accepted" || value === "rejected") {
    return value;
  }

  return null;
}

function readConsentStatus(): ConsentStatus {
  if (typeof document === "undefined") {
    return null;
  }

  const cookieEntry = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${CONSENT_STORAGE_KEY}=`));

  if (cookieEntry) {
    const cookieValue = decodeURIComponent(cookieEntry.split("=")[1] ?? "");
    return parseConsentStatus(cookieValue);
  }

  if (typeof window !== "undefined") {
    return parseConsentStatus(window.localStorage.getItem(CONSENT_STORAGE_KEY));
  }

  return null;
}

function persistConsentStatus(status: Exclude<ConsentStatus, null>) {
  if (typeof document !== "undefined") {
    document.cookie = `${CONSENT_STORAGE_KEY}=${status}; path=/; max-age=${ONE_YEAR_SECONDS}; SameSite=Lax`;
  }

  if (typeof window !== "undefined") {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, status);
  }
}

export function CookieConsentBanner({ locale = "es" }: Props) {
  const [consentStatus, setConsentStatus] = useState<ConsentStatus>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setConsentStatus(readConsentStatus());
    setHydrated(true);
  }, []);

  const copy = useMemo(() => {
    const normalizedLocale = locale.toLowerCase().split("-")[0];

    if (normalizedLocale === "en" || normalizedLocale === "vi") {
      return COPY_BY_LOCALE[normalizedLocale];
    }

    return COPY_BY_LOCALE.es;
  }, [locale]);

  const handleAccept = () => {
    persistConsentStatus("accepted");
    setConsentStatus("accepted");
  };

  const handleReject = () => {
    persistConsentStatus("rejected");
    setConsentStatus("rejected");
  };

  return (
    <>
      {consentStatus === "accepted" && (
        <>
          <Script
            async
            src={`https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`}
            strategy="afterInteractive"
          />
          <Script id="google-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${MEASUREMENT_ID}', { anonymize_ip: true });
            `}
          </Script>
        </>
      )}

      {hydrated && consentStatus === null && (
        <div className="fixed inset-x-0 bottom-0 z-100 border-t border-[#d9d6c7] bg-[#f7f4ea]/95 backdrop-blur">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-4 md:flex-row md:items-center md:justify-between md:px-6">
            <div className="max-w-3xl text-sm text-[#2b2b2b]">
              <p className="font-semibold text-[#283618]">{copy.title}</p>
              <p className="mt-1 leading-relaxed">{copy.description}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={handleReject}
                className="rounded-md border border-[#b8b2a2] px-4 py-2 text-sm font-medium text-[#3d3d3d] transition hover:bg-[#ece7d8]"
              >
                {copy.reject}
              </button>
              <button
                type="button"
                onClick={handleAccept}
                className="rounded-md bg-[#606c38] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#4f5a2f]"
              >
                {copy.accept}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
