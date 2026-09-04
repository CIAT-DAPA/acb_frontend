"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { CookieConsentBanner } from "@/components/CookieConsentBanner";
import { isEmbedPathname } from "@/utils/embed";

type ChromeGateProps = {
  children: React.ReactNode;
  locale: string;
};

/**
 * Renderiza el chrome de la aplicación (Navbar, Footer y banner de cookies)
 * salvo cuando la ruta es una vista embebible (`/[locale]/embed/...`),
 * donde solo se muestra el contenido para poder incrustarlo en un iframe.
 */
export function ChromeGate({ children, locale }: ChromeGateProps) {
  const pathname = usePathname();

  if (isEmbedPathname(pathname)) {
    return <>{children}</>;
  }

  return (
    <>
      <Navbar />
      {children}
      <Footer />
      <CookieConsentBanner locale={locale} />
    </>
  );
}
