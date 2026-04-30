import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import {
  Sintony,
  Poppins,
  Montserrat,
  Roboto,
  Open_Sans,
  Lato,
  Archivo,
  Archivo_Narrow,
} from "next/font/google";
import "./globals.css";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";
import { AuthProviderWrapper } from "@/components/AuthProviderWrapper";
import { ToastProvider } from "@/components/Toast";
import { CookieConsentBanner } from "@/components/CookieConsentBanner";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

const sintony = Sintony({
  variable: "--font-sintony",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700", "900"],
});

const openSans = Open_Sans({
  variable: "--font-open-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

const lato = Lato({
  variable: "--font-lato",
  subsets: ["latin"],
  weight: ["300", "400", "700", "900"],
});

const archivoLight = Archivo({
  variable: "--font-archivo-light",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

const archivoNarrow = Archivo_Narrow({
  variable: "--font-archivo-narrow",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Bulletin builder",
  description: "Bulletin builder",
  keywords: ["bulletin", "agroclimatic", "climate", "agriculture", "weather"],
  robots: {
    index: true,
    follow: true,
  },
};

export default async function RootLayout({ children, params }: Props) {
  const { locale } = await params;
  const messages = await getMessages({ locale });

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#606c38" />
        <link rel="manifest" href="/manifest.json" />
        <link
          rel="icon"
          href="/faviconDark.ico"
          media="(prefers-color-scheme: light)"
        />
        <link
          rel="icon"
          href="/favicon.ico"
          media="(prefers-color-scheme: dark)"
        />
        <link
          rel="alternate"
          hrefLang="es"
          href="https://bulletinbuilder.ciat.cgiar.org/es"
        />
        <link
          rel="alternate"
          hrefLang="en"
          href="https://bulletinbuilder.ciat.cgiar.org/en"
        />
        <link
          rel="alternate"
          hrefLang="vi"
          href="https://bulletinbuilder.ciat.cgiar.org/vi"
        />
      </head>
      <body
        className={`${sintony.variable} ${poppins.variable} ${montserrat.variable} ${roboto.variable} ${openSans.variable} ${lato.variable} ${archivoLight.variable} ${archivoNarrow.variable} antialiased`}
      >
        <AuthProviderWrapper>
          <NextIntlClientProvider messages={messages}>
            <ToastProvider>
              <Navbar />
              {children}
              <Footer />
              <CookieConsentBanner locale={locale} />
            </ToastProvider>
          </NextIntlClientProvider>
        </AuthProviderWrapper>
      </body>
    </html>
  );
}
