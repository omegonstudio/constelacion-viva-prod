"use client"

import { useState, useEffect } from "react"
import { ServiceCard } from "@/components/molecules/service-card"
import { SectionTitle } from "@/components/atoms/section-title"

const terapeutasProposals = [
  {
    title: "Perfil Profesional",
    description:
      "Crea tu perfil completo con tus especialidades, formación y enfoque terapéutico. Conecta con personas que buscan exactamente lo que ofreces.",
  },
  {
    title: "Red de Colaboración",
    description:
      "Únete a una comunidad de profesionales del bienestar. Comparte experiencias, aprende y crece junto a otros terapeutas holísticos.",
  },
]

const eventosProposals = [
  {
    title: "Talleres y Workshops",
    description:
      "Participa en talleres vivenciales sobre diversas prácticas holísticas. Desde meditación hasta terapias corporales, cada mes nuevas experiencias.",
  },
  {
    title: "Eventos Presenciales y Online",
    description:
      "Incluyen noches y meriendas temáticas, ferias, festivales y encuentros experienciales, donde convergen el arte, la espiritualidad y el disfrute.",
  },
]

export function ServicesGrid() {
  const [expandedCard, setExpandedCard] = useState<string | null>(null)

  useEffect(() => {
    const handleExpandTerapeutas = () => {
      setExpandedCard("terapeutas")
    }

    window.addEventListener("expandTerapeutas", handleExpandTerapeutas)
    return () => window.removeEventListener("expandTerapeutas", handleExpandTerapeutas)
  }, [])

  return (
    <section id="servicios" className="py-20 md:py-32 bg-[#060000]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <SectionTitle className="mb-6 text-white">
            Nuestros <span className="text-[#ed7417]">Servicios</span>
          </SectionTitle>
          <p className="font-serif text-lg md:text-xl text-white/80 max-w-3xl mx-auto leading-relaxed">
            Conectar y potenciar el alcance a terapeutas, facilitadores, artistas y eventos que transforman vidas.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
          <ServiceCard
            title="Terapeutas"
            expandLabel="sumate"
            proposals={terapeutasProposals}
            calendlyUrl="https://calendly.com/constelacionviva17/30min"
            isExpanded={expandedCard === "terapeutas"}
            onToggle={() => setExpandedCard(expandedCard === "terapeutas" ? null : "terapeutas")}
          />

          <ServiceCard
            title="Eventos"
            expandLabel="conoce más"
            proposals={eventosProposals}
            calendlyUrl="https://calendly.com/constelacionviva17/30min"
            isExpanded={expandedCard === "eventos"}
            onToggle={() => setExpandedCard(expandedCard === "eventos" ? null : "eventos")}
          />
        </div>
      </div>
    </section>
  )
}
