import { Cloud, Menu } from "lucide-react";

export function Header() {
  return (
    <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Cloud className="h-8 w-8 text-primary" />
          <span className="text-xl font-medium text-foreground">
            AgroClima Editor
          </span>
        </div>

        <nav className="hidden md:flex items-center space-x-8">
          <a
            href="#"
            className="text-foreground/70 hover:text-primary transition-colors font-medium"
          >
            Inicio
          </a>
          <a
            href="#"
            className="text-foreground/70 hover:text-primary transition-colors font-medium"
          >
            Plantillas
          </a>
          <a
            href="#"
            className="text-foreground/70 hover:text-primary transition-colors font-medium"
          >
            Datos
          </a>
          <a
            href="#"
            className="text-foreground/70 hover:text-primary transition-colors font-medium"
          >
            Ayuda
          </a>
        </nav>

        <div className="flex items-center space-x-4">
          <button className="border-primary/20 text-primary hover:bg-primary hover:text-primary-foreground">
            Iniciar Sesión
          </button>
          <button className="bg-primary hover:bg-primary/90 text-primary-foreground">
            Acceder
          </button>
          <button className="md:hidden text-foreground hover:bg-secondary">
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
