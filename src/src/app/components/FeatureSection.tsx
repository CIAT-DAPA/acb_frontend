import { FileText, Download, GitBranch, Palette } from "lucide-react";

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
      <div className="container mx-auto px-6">
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
              className="border-0 shadow-sm hover:shadow-lg transition-all duration-300 group"
            >
              <div className="space-y-4">
                <div className="w-12 h-12 bg-secondary rounded-lg flex items-center justify-center group-hover:bg-primary transition-colors duration-300">
                  <feature.icon className="h-6 w-6 text-primary group-hover:text-white transition-colors duration-300" />
                </div>
                <div className="text-xl">{feature.title}</div>
              </div>
              <div>
                <div className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-16">
          <div className="inline-flex items-center space-x-2 bg-secondary text-primary px-4 py-2 rounded-full">
            <div className="w-2 h-2 bg-primary rounded-full"></div>
            <span className="text-sm font-medium">
              Proyecto de código abierto para la comunidad agroclimática
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
