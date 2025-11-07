"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "next/navigation";
import { Globe, ChevronDown } from "lucide-react";
import { useState, useTransition, useEffect } from "react";

const LANGUAGES = [
  { code: "es", name: "Español", flag: "🇪🇸" },
  { code: "en", name: "English", flag: "🇺🇸" },
] as const;

export function LanguageSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const hookLocale = useLocale(); // Renombrado para debugging
  const [isPending, startTransition] = useTransition();

  // Extraer el locale actual del pathname como backup
  const pathnameLocale = pathname.split("/")[1];

  // Usar el locale del pathname si está disponible, sino el del hook
  const currentLocale = ["es", "en"].includes(pathnameLocale)
    ? pathnameLocale
    : hookLocale;

  // Cerrar el dropdown cuando cambie el idioma
  useEffect(() => {
    setIsOpen(false);
  }, [currentLocale, pathname]);

  const currentLanguage = LANGUAGES.find((lang) => lang.code === currentLocale);

  const handleLanguageChange = (newLocale: string) => {
    startTransition(() => {
      // Reemplazar el locale en la URL actual
      const segments = pathname.split("/");
      segments[1] = newLocale; // Reemplazar el segmento del idioma
      const newPath = segments.join("/");
      router.push(newPath);
    });
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isPending}
        className="flex items-center space-x-2 px-3 py-2 rounded-md border border-[#ffaf68]/30 text-[#fefae0]/80 hover:text-[#ffaf68] hover:border-[#ffaf68]/50 transition-colors duration-200 disabled:opacity-50"
        aria-label="Cambiar idioma"
      >
        <Globe className="h-4 w-4" />
        <span className="text-sm font-medium">
          {currentLanguage?.flag} {currentLanguage?.code.toUpperCase()}
        </span>
        <ChevronDown
          className={`h-3 w-3 transition-transform ${
            isOpen ? "rotate-180" : ""
          } ${isPending ? "animate-spin" : ""}`}
        />
      </button>

      {isOpen && (
        <>
          {/* Overlay para cerrar el dropdown */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown menu */}
          <div className="absolute right-0 mt-2 w-40 bg-[#283618] border border-[#ffaf68]/20 rounded-md shadow-lg z-20">
            {LANGUAGES.map((language) => (
              <button
                key={language.code}
                onClick={() => handleLanguageChange(language.code)}
                disabled={isPending || currentLocale === language.code}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-[#ffaf68]/10 transition-colors first:rounded-t-md last:rounded-b-md disabled:opacity-50 ${
                  currentLocale === language.code
                    ? "text-[#ffaf68] bg-[#ffaf68]/5"
                    : "text-[#fefae0]/80 hover:text-[#ffaf68]"
                }`}
              >
                <span className="flex items-center space-x-2">
                  <span>{language.flag}</span>
                  <span>{language.name}</span>
                  {currentLocale === language.code && (
                    <span className="ml-auto text-xs">✓</span>
                  )}
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
