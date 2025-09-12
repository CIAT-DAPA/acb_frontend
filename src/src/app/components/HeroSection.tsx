import Image from "next/image";
import { AnimatedText } from "./AnimatedText";
import { ArrowRight } from "lucide-react";
import {
  container,
  btnPrimary,
  heroSection,
  heroTitle,
  heroSubtext,
  card,
  dot,
  elevated,
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
      {/* Centered content */}
      <div className={`${container} mx-auto w-full relative`}>
        <div className="relative py-8 lg:py-14">
          {/* Side images floating like on a desk */}
          <div aria-hidden className="pointer-events-none select-none">
            <div
              className={`hidden md:block absolute left-6 lg:left-12 top-8 rotate-[-3deg] ${elevated}`}
            >
              <div className={`${card}`}>
                <Image
                  width={480 / 2}
                  height={320 / 2}
                  src="/assets/img/bol2.jpg"
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <div
              className={`hidden md:block absolute -left-11 xl:-left-15 -bottom-30 rotate-[-10deg] ${elevated}`}
            >
              <div className={`${card}`}>
                <Image
                  width={366 / 2}
                  height={638 / 2}
                  src="/assets/img/bol1.jpg"
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            <div
              className={`hidden md:block absolute -right-11 xl:-right-15 -bottom-35 rotate-[10deg] ${elevated}`}
            >
              <div className={`${card} `}>
                <Image
                  width={500 / 2}
                  height={350 / 2}
                  src="/assets/img/bol4.jpg"
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <div
              className={`hidden md:block absolute -right-6 xl:right-15 bottom-15 rotate-[-15deg] ${elevated}`}
            >
              <div className={`${card}`}>
                <Image
                  width={500 / 2}
                  height={350 / 2}
                  src="/assets/img/bol3.jpg"
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>

          {/* Headline centered */}
          <div className="relative z-10 text-center max-w-3xl mx-auto space-y-6">
            <h1 className={heroTitle}>
              <span className="block opacity-90">Crea boletines con</span>
              <span className="block mt-2 leading-tight font-headers">
                <AnimatedText words={words} />
              </span>
            </h1>
            <p className={`${heroSubtext} mx-auto`}>
              Plataforma para crear, revisar y distribuir boletines
              agroclimáticos profesionales de manera colaborativa.
            </p>

            <div className="flex justify-center">
              <button
                type="button"
                className={`${btnPrimary} shadow-2xl shadow-black/20`}
                aria-label="Comenzar a crear boletines"
              >
                Comenzar a crear <ArrowRight className="h-5 w-5" />
              </button>
            </div>

            <div className="flex items-center justify-center gap-8 text-sm text-foreground/80">
              <div className="flex items-center gap-2">
                <div className={`${dot} bg-indigo-500`}></div>
                <span>Boletines de 2 paises</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`${dot} bg-green-500`}></div>
                <span>Plantillas personalizables</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
