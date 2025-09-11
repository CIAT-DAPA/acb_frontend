import { FileText, Download, GitBranch, Palette } from "lucide-react";
import { container, dot } from "./ui";

const features = [
  {
    icon: FileText,
    title: "Generación de Boletines",
    description:
      "Crea boletines agroclimáticos profesionales con un editor intuitivo diseñado específicamente para contenido técnico y científico.",
  },
  {
    icon: Download,
    title: "Exportación Flexible",
    description:
      "Exporta tus boletines en múltiples formatos: PDF para impresión, HTML para web, o formatos compatibles con diferentes plataformas de distribución.",
  },
  {
    icon: GitBranch,
    title: "Flujo de Revisión",
    description:
      "Sistema completo de revisión colaborativa con control de versiones, comentarios y aprobaciones para garantizar la calidad del contenido.",
  },
  {
    icon: Palette,
    title: "Plantillas Personalizadas",
    description:
      "Crea y guarda plantillas reutilizables que se adapten a tus necesidades específicas y mantengan la consistencia de tu organización.",
  },
];

export function FeaturesSection() {
  return (
    <section className="py-20 lg:py-32 bg-white">
      <div className={`${container} mx-auto`}>
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl lg:text-5xl font-bold text-foreground">
            Todo lo que necesitas para crear
            <span className="text-primary block">boletines excepcionales</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Una herramienta gratuita y colaborativa que simplifica el proceso de
            creación, revisión y distribución de boletines agroclimáticos de
            alta calidad.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {features.map((feature, index) => (
            <div
              key={index}
              className="rounded-2xl border border-gray-200/70 bg-white p-6 md:p-8 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 focus-within:ring-2 focus-within:ring-blue-100"
            >
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-blue-50 ring-1 ring-blue-100 flex items-center justify-center transition-colors">
                  <feature.icon className="h-6 w-6 text-blue-500" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
