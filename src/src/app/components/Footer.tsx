import { Cloud, Mail, Phone, MapPin } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground py-16">
      <div className="container mx-auto px-6">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Cloud className="h-8 w-8 text-secondary" />
              <span className="text-xl font-medium">AgroClima Editor</span>
            </div>
            <p className="text-primary-foreground/80 leading-relaxed">
              Herramienta gratuita y de código abierto desarrollada por una
              organización sin ánimo de lucro para facilitar la creación
              colaborativa de boletines agroclimáticos.
            </p>
            <div className="flex space-x-4">
              <div className="w-8 h-8 bg-primary-foreground/10 rounded-full flex items-center justify-center hover:bg-secondary hover:text-primary transition-colors cursor-pointer">
                <Mail className="h-4 w-4" />
              </div>
              <div className="w-8 h-8 bg-primary-foreground/10 rounded-full flex items-center justify-center hover:bg-secondary hover:text-primary transition-colors cursor-pointer">
                <Phone className="h-4 w-4" />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-medium text-lg text-secondary">Producto</h3>
            <ul className="space-y-2 text-primary-foreground/80">
              <li>
                <a href="#" className="hover:text-secondary transition-colors">
                  Características
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-secondary transition-colors">
                  Plantillas
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-secondary transition-colors">
                  Código Fuente
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-secondary transition-colors">
                  Contribuir
                </a>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="font-medium text-lg text-secondary">Recursos</h3>
            <ul className="space-y-2 text-primary-foreground/80">
              <li>
                <a href="#" className="hover:text-secondary transition-colors">
                  Documentación
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-secondary transition-colors">
                  Tutoriales
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-secondary transition-colors">
                  Blog
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-secondary transition-colors">
                  Soporte
                </a>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="font-medium text-lg text-secondary">Contacto</h3>
            <div className="space-y-3 text-primary-foreground/80">
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-secondary" />
                <span>info@agroclima.com</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-secondary" />
                <span>+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-secondary" />
                <span>Ciudad, País</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-primary-foreground/20 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-primary-foreground/70 text-sm">
            © 2025 AgroClima Editor. Todos los derechos reservados.
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a
              href="#"
              className="text-primary-foreground/70 hover:text-secondary text-sm transition-colors"
            >
              Privacidad
            </a>
            <a
              href="#"
              className="text-primary-foreground/70 hover:text-secondary text-sm transition-colors"
            >
              Términos
            </a>
            <a
              href="#"
              className="text-primary-foreground/70 hover:text-secondary text-sm transition-colors"
            >
              Cookies
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
