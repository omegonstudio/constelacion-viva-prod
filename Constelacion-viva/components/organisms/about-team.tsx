"use client";

import { motion } from "framer-motion";
import { SectionTitle } from "@/components/atoms/section-title";
import { Button } from "@/components/atoms/button";
import { AnimatedTooltip } from "@/components/ui/animated-tooltip";

const teamMembers = [
  {
    id: 1,
    name: "Yamila Velay",
    designation: "Terapeuta Holística - Founder",
    image: "/yami.png",
  },
  {
    id: 2,
    name: "Agustin Rodriguez",
    designation: "Desarrollador - Co Founder",
    image: "/Tito.png",
  },
/*   {
    id: 3,
    name: "Camila Faliani",
    designation: "Coordinadora de Proyectos",
    image: "/",
  },
  {
    id: 4,
    name: "Mar Marquez",
    designation: "Social Media Manager",
    image: "/MAR.webp",
  }, */
];

export function AboutTeam() {
  const handleCalendlyClick = () => {
    window.open("https://calendly.com/constelacionviva17/30min", "_blank");
  };

  return (
    <section id="sobre" className="py-20 md:py-32 bg-[#1a1a1a]">
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
              Sobre <span className="text-[#ed7417]">Nosotros</span>
            </SectionTitle>
            <p className="font-serif text-lg md:text-xl text-white/80 leading-relaxed max-w-3xl mx-auto">
              Somos una red de conexiones comprometidos con el crecimiento
              personal y colectivo
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-12"
          >
            <h3 className="font-sans text-center text-sm font-medium text-white/70 mb-8">
              Conoce nuesto equipo
            </h3>
            <div className="flex justify-center">
              <AnimatedTooltip items={teamMembers} />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-center"
          >
            <Button variant="cta" size="lg" onClick={handleCalendlyClick}>
              Agenda una reunión
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
