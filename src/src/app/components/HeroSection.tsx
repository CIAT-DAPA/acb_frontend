import Image from "next/image";
import { AnimatedText } from "./AnimatedText";
import { ArrowRight } from "lucide-react";
import {
  container,
  btnPrimary,
  heroSection,
  heroGrid,
  heroTitle,
  heroSubtext,
  card,
  dot,
} from "./ui";

export function HeroSection() {
  const words = [
    "información climática",
    "recomendaciones",
    "pronósticos",
    "alertas tempranas",
  ];
  return (
    <section className={heroSection}>
      {/* Background Pattern */}
      <div
        className="absolute inset-0 opacity-8 pointer-events-none select-none"
        aria-hidden
      >
        <div className="absolute top-20 left-10 w-32 h-32 border-2 border-primary/20 rounded-full"></div>
        <div className="absolute bottom-25 right-15 w-24 h-24 border-2 border-primary/30 rounded-full"></div>
        <div className="absolute top-20 right-40 w-16 h-16 border-2 border-primary/25 rounded-full"></div>
      </div>

      <div className={`${container} mx-auto w-full`}>
        <div className={heroGrid}>
          <div className="space-y-8">
            <div className="space-y-6">
              <h1 className={heroTitle}>
                <span className="block opacity-90">Crea boletines con</span>
                <span className="block mt-2 leading-tight font-headers">
                  <AnimatedText words={words} />
                </span>
              </h1>
              <p className={heroSubtext}>
                Plataforma para crear, revisar y distribuir boletines
                agroclimáticos profesionales de manera colaborativa.
              </p>
            </div>

            <div className="flex flex-row gap-4">
              <button
                type="button"
                className={btnPrimary}
                aria-label="Comenzar a crear boletines"
              >
                Comenzar a crear <ArrowRight className="h-5 w-5" />
              </button>
            </div>

            <div className="flex items-center space-x-8 text-sm text-foreground/80">
              <div className="flex items-center space-x-2">
                <div className={`${dot} bg-indigo-500`}></div>
                <span>Boletines de 2 paises</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`${dot} bg-green-500`}></div>
                <span>Plantillas personalizables</span>
              </div>
            </div>
          </div>

          <div className="relative">
            {/* Main Visual Grid */}
            <div className="grid grid-cols-2 gap-4">
              {/* Large main image */}
              <div className="col-span-2 relative">
                <div className={card}>
                  <Image
                    width={800}
                    height={500}
                    src="/assets/img/temp1.jpg"
                    alt="Mapa climático con datos meteorológicos"
                    className="w-full h-48 object-cover"
                  />
                </div>
              </div>

              {/* Left bottom image */}
              <div className="relative">
                <div className={card}>
                  <Image
                    width={400}
                    height={250}
                    src="/assets/img/temp1.jpg"
                    alt="Reporte agrícola con documentos y análisis"
                    className="w-full h-32 object-cover"
                  />
                </div>
              </div>

              {/* Right bottom image (replaces features preview) */}
              <div className="relative">
                <div className={card}>
                  <Image
                    width={400}
                    height={250}
                    src="/assets/img/temp1.jpg"
                    alt="Visual de datos y mapas"
                    className="w-full h-32 object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
