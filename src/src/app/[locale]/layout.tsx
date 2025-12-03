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
  Archivo_Narrow,
} from "next/font/google";
import "./globals.css";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";
import { AuthProviderWrapper } from "@/components/AuthProviderWrapper";
import { ToastProvider } from "@/components/Toast";

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

const archivoNarrow = Archivo_Narrow({
  variable: "--font-archivo-narrow",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Bulletin builder",
  description: "App to create agroclimatic bulletins",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
};

export default async function RootLayout({ children, params }: Props) {
  const { locale } = await params;
  const messages = await getMessages({ locale });

  return (
    <html lang={locale}>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        {/* Google tag (gtag.js) */}
        <script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-MLWGH1E59C"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-MLWGH1E59C');
            `,
          }}
        />
      </head>
      <body
        className={`${sintony.variable} ${poppins.variable} ${montserrat.variable} ${roboto.variable} ${openSans.variable} ${lato.variable} ${archivoNarrow.variable} antialiased`}
      >
        <AuthProviderWrapper>
          <NextIntlClientProvider messages={messages}>
            <ToastProvider>
              <Navbar />
              {children}
              <Footer />
            </ToastProvider>
          </NextIntlClientProvider>
        </AuthProviderWrapper>
      </body>
    </html>
  );
}
