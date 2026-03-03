"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown } from "lucide-react"
import { Button } from "@/components/atoms/button"
import { cn } from "@/lib/utils"

interface ServiceProposal {
  title: string
  description: string
}

interface ServiceCardProps {
  title: string
  expandLabel: string
  proposals: ServiceProposal[]
  calendlyUrl?: string
  isExpanded?: boolean
  onToggle?: () => void
}

export function ServiceCard({
  title,
  expandLabel,
  proposals,
  calendlyUrl = "https://calendly.com/placeholder",
  isExpanded = false,
  onToggle,
}: ServiceCardProps) {
  const [localExpanded, setLocalExpanded] = useState(isExpanded)

  const expanded = onToggle ? isExpanded : localExpanded
  const toggle = onToggle || (() => setLocalExpanded(!localExpanded))

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden bg-card border-2 border-border p-8 md:p-10"
      style={{ borderRadius: "var(--radius-card)" }}
    >
      <div className="flex items-start justify-between gap-4 mb-6">
        <h3 className="font-serif text-3xl md:text-4xl font-bold text-foreground">{title}</h3>
        <button
          onClick={toggle}
          className="flex items-center gap-2 font-sans text-sm font-medium text-primary hover:text-primary/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-md px-3 py-2"
          aria-expanded={expanded}
          aria-label={`${expanded ? "Cerrar" : "Abrir"} ${title}`}
        >
          <span>{expandLabel}</span>
          <ChevronDown className={cn("w-5 h-5 transition-transform duration-300", expanded && "rotate-180")} />
        </button>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {proposals.map((proposal, index) => (
              <div key={index} className="space-y-2">
                <h4 className="font-sans text-lg font-semibold text-foreground">{proposal.title}</h4>
                <p className="font-serif text-base text-muted-foreground leading-relaxed">{proposal.description}</p>
              </div>
            ))}

            <div className="pt-4">
              <Button
                variant="cta"
                size="lg"
                onClick={() => window.open(calendlyUrl, "_blank")}
                className="w-full sm:w-auto text-[#060000]"
              >
                Agendar consulta
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
