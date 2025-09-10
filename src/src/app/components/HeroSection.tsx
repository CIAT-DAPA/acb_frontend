import Image from "next/image";
import { AnimatedText } from "./AnimatedText";
import {
  ArrowRight,
  CloudRain,
  BarChart3,
  FileText,
  AlertTriangle,
} from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-secondary to-accent py-20 lg:py-32">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-8">
        <div className="absolute top-20 left-10 w-32 h-32 border-2 border-primary/20 rounded-full"></div>
        <div className="absolute bottom-32 right-20 w-24 h-24 border-2 border-primary/30 rounded-full"></div>
        <div className="absolute top-40 right-40 w-16 h-16 border-2 border-primary/25 rounded-full"></div>
      </div>

      <div className="container mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <div className="space-y-6">
              <h1 className="text-4xl lg:text-6xl font-bold text-foreground leading-tight">
                Crea boletines con
                <span className="block mt-2">
                  <AnimatedText />
                </span>
                <span className="block text-muted-foreground">
                  actualizados
                </span>
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed max-w-lg">
                Plataforma gratuita y de código abierto para crear, revisar y
                distribuir boletines agroclimáticos profesionales de manera
                colaborativa.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <button className="text-lg px-8 py-6 bg-primary hover:bg-primary/90">
                Comenzar a Crear
                <ArrowRight className="ml-2 h-5 w-5" />
              </button>
            </div>

            <div className="flex items-center space-x-8 text-sm text-muted-foreground">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span>Completamente gratuito</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-chart-2 rounded-full"></div>
                <span>Código abierto</span>
              </div>
            </div>
          </div>

          <div className="relative">
            {/* Main Visual Grid */}
            <div className="grid grid-cols-2 gap-4">
              {/* Large main image */}
              <div className="col-span-2 relative">
                <div className="relative z-10 rounded-xl overflow-hidden shadow-lg">
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
                <div className="relative z-10 rounded-xl overflow-hidden shadow-lg">
                  <Image
                    width={400}
                    height={250}
                    src="/assets/img/temp1.jpg"
                    alt="Reporte agrícola con documentos y análisis"
                    className="w-full h-32 object-cover"
                  />
                </div>
              </div>

              {/* Right bottom - Features preview */}
              <div className="bg-white rounded-xl shadow-lg p-4 flex flex-col justify-center space-y-3">
                <div className="flex items-center space-x-2 text-sm">
                  <CloudRain
                    className="h-4 w-4"
                    style={{ color: "var(--chart-2)" }}
                  />
                  <span className="text-foreground">Datos climáticos</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <BarChart3
                    className="h-4 w-4"
                    style={{ color: "var(--chart-1)" }}
                  />
                  <span className="text-foreground">Análisis avanzado</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <FileText className="h-4 w-4 text-primary" />
                  <span className="text-foreground">
                    Boletines profesionales
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <AlertTriangle
                    className="h-4 w-4"
                    style={{ color: "var(--chart-3)" }}
                  />
                  <span className="text-foreground">Alertas tempranas</span>
                </div>
              </div>
            </div>

            {/* Floating elements */}
            <div className="absolute -top-4 -right-4 w-20 h-20 bg-primary bg-opacity-10 rounded-full flex items-center justify-center">
              <CloudRain className="h-8 w-8 text-primary" />
            </div>
            <div className="absolute -bottom-6 -left-6 w-16 h-16 bg-primary bg-opacity-10 rounded-full flex items-center justify-center">
              <BarChart3 className="h-6 w-6 text-primary" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
