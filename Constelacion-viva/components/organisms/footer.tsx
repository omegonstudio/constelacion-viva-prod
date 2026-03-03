import { Instagram, MapPin } from "lucide-react";
import Image from "next/image";

export function Footer() {
  return (
    <footer className="bg-[#060000] text-white py-12 border-t border-[#ed7417]/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
          {/* Logo */}
          <div className="flex justify-center md:justify-start">
            <a
              href="https://omegon.com.ar/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:opacity-80 transition-opacity"
            >
              <Image
                src="/images/design-mode/omegon.png"
                alt="Constelación Viva"
                width={12}
                height={12}
                className="w-12 h-12"
              />
            </a>
          </div>

          {/* Social & Locations */}
          <div className="space-y-4 text-center">
            <a
              href="https://instagram.com/constelacionviva"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 hover:text-[#ed7417] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-md px-2 py-1"
              aria-label="Síguenos en Instagram"
            >
              <Instagram className="w-5 h-5" />
              <span className="font-sans text-sm">@constelacionviva</span>
            </a>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm font-serif">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#ed7417]" />
                <span>Buenos Aires</span>
              </div>
              <div className="hidden sm:block text-[#ed7417]">•</div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#ed7417]" />
                <span>Córdoba</span>
              </div>
              <div className="hidden sm:block text-[#ed7417]">•</div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#ed7417]" />
                <span>San Luis</span>
              </div>
              <div className="hidden sm:block text-[#ed7417]">•</div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#ed7417]" />
                <span>Zaragoza</span>
              </div>
            </div>
          </div>

          {/* Second Logo */}
          <div className="flex justify-center md:justify-end">
            <Image
              src="/images/design-mode/constelacion.png"
              alt="Constelación Viva Logo"
              width={12}
              height={12}
              className="w-12 h-12"
            />
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-white/20 text-center">
          <p className="font-sans text-sm text-white/70">
            © {new Date().getFullYear()} Constelación Viva. Todos los derechos
            reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
