"use client";

import { motion } from "framer-motion";
import { Instagram, MapPin, Calendar } from "lucide-react";
import { SectionTitle } from "@/components/atoms/section-title";
import { Button } from "@/components/atoms/button";

export function ContactForm() {
  const handleCalendlyClick = () => {
    window.open("https://calendly.com/constelacionviva17/30min", "_blank");
  };

  return (
    <section id="contacto" className="py-20 md:py-32 bg-[#060000]"> {/* bg-[#1a1a1a] */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <SectionTitle className="mb-6 text-white">
              <span className="text-[#ed7417]">Contáctanos</span>
            </SectionTitle>
            <p className="font-serif text-lg md:text-xl text-white/80 leading-relaxed">
              Estamos aquí para acompañarte en tu camino hacia el bienestar
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-1 gap-12">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="flex flex-col items-center gap-8" // Changed from space-y-4 to gap-8 and added centering
            >
              <div className="flex justify-center w-full">
                <Button
                  variant="cta"
                  size="sm"
                  className="w-auto max-w-md text-[#060000]" // Modified width classes
                  onClick={() =>
                    window.open(
                      "https://docs.google.com/forms/d/e/1FAIpQLSfWfRJJGjXkRVZWXlwJTMQbtXpw_JJJWXVuRbHpRa5ZWV_kZg/viewform?usp=header",
                      "_blank"
                    )
                  }
                >
                  Convocatoria: Terapeutas
                </Button>
              </div>
              <div className="flex justify-center w-full">
                <Button
                  variant="cta"
                  size="sm"
                  className="w-auto max-w-md text-[#060000]" // Modified width classes
                  onClick={() =>
                    window.open(
                      "https://docs.google.com/forms/d/e/1FAIpQLSfShabaGxqM_JpeEczu9zi-lm2YEDMTD1xdelchJ07kkb12Kg/viewform?usp=header",
                      "_blank"
                    )
                  }
                >
                  Inscripción de Expositores y Emprendedores
                </Button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="space-y-12" // Increased from space-y-8
            >
              <div className="flex flex-col items-center">
                {" "}
                {/* Added centering */}
                <h3 className="font-sans text-xl font-semibold mb-6 text-white">
                  {" "}
                  {/* Increased margin bottom */}
                  Otras formas de contacto
                </h3>
                <div className="space-y-6 w-full max-w-md">
                  {" "}
                  {/* Increased space and added max width */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="justify-center w-full bg-transparent border-primary text-white hover:bg-primary hover:text-white"
                    onClick={handleCalendlyClick}
                  >
                    <Calendar className="w-5 h-5 mr-3 text-[#060000]" />
                    Agendar una reunión
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="justify-center w-full bg-transparent border-primary text-white hover:bg-primary hover:text-white"
                    onClick={() =>
                      window.open(
                        "https://instagram.com/constelacionviva",
                        "_blank"
                      )
                    }
                  >
                    <Instagram className="w-5 h-5 mr-3" />
                    @constelacionviva
                  </Button>
                </div>
              </div>

              <div className="flex flex-col items-center text-center">
                <h3 className="font-sans text-xl font-semibold mb-6 text-white">
                  Nuestras ubicaciones
                </h3>
                <div className="space-y-4 w-full max-w-md">
                  <div className="flex items-center justify-center gap-3 text-white/80">
                    <MapPin className="w-5 h-5 text-primary flex-shrink-0" />
                    <span className="font-serif">Buenos Aires, Argentina</span>
                  </div>
                  <div className="flex items-center justify-center gap-3 text-white/80">
                    <MapPin className="w-5 h-5 text-primary flex-shrink-0" />
                    <span className="font-serif">Córdoba, Argentina</span>
                  </div>
                  <div className="flex items-center justify-center gap-3 text-white/80">
                    <MapPin className="w-5 h-5 text-primary flex-shrink-0" />
                    <span className="font-serif">San Luis, Argentina</span>
                  </div>
                   <div className="flex items-center justify-center gap-3 text-white/80">
                    <MapPin className="w-5 h-5 text-primary flex-shrink-0" />
                    <span className="font-serif">Zaragoza, España</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
