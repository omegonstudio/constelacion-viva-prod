"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Check, ChevronLeft, Sparkles, Star, Crown, ArrowRight } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { Footer } from "@/components/organisms/footer"
import { useMembershipStore } from "@/lib/stores/membership.store"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/organisms/navbar"

const plans = [
  {
    id: 3,
    name: "Terapeuta Inicial",
    badge: "Inicial",
    period: "3 meses",
    description: "Ideal para comenzar tu camino dentro de la red.",
    icon: Sparkles,
    features: [
      "Descarga de ebook gratuito",
      "Pertenecer a la red de terapeutas",
      "Subir videos de cursos no pagos",
    ],
    highlighted: false,
  },
  {
    id: 6,
    name: "Terapeuta Profesional",
    badge: "Mas elegido",
    period: "6 meses",
    description: "El plan preferido por quienes quieren crecer profesionalmente.",
    icon: Star,
    features: [
      "Descarga de ebook gratuito",
      "Pertenecer a la red de terapeutas",
      "Subir videos de cursos pagos",
    ],
    highlighted: true,
  },
  {
    id: 12,
    name: "Terapeuta Premium",
    badge: "Premium",
    period: "12 meses",
    description: "Visibilidad y prioridad total en la plataforma.",
    icon: Crown,
    features: [
      "Todos los beneficios anteriores",
      "Prioridad y visibilidad destacada",
    ],
    highlighted: false,
  },
]

export default function PlanesPage() {
  const router = useRouter()

  const selectedPlan = useMembershipStore((s: any) => s.selectedPlan)
    const selectPlan = useMembershipStore((s: any) => s.selectPlan)
    

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        {/* Navbar simple */}
        <Navbar />


        {/* Main content */}
        <main className="flex-1">
          {/* Header section */}
          <section className="py-16 lg:py-24">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-foreground text-balance">
                  Planes para terapeutas
                </h1>
                <p className="mt-4 font-sans text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto text-pretty">
                  Elegi el plan que mejor acompane tu crecimiento profesional
                </p>
              </motion.div>
            </div>
          </section>

          {/* Plans grid */}
          <section className="pb-16 lg:pb-24">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto">
                {plans.map((plan, index) => {
                  const isSelected = selectedPlan === plan.id
                  const Icon = plan.icon

                  return (
                    <motion.div
                      key={plan.id}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.15 }}
                    >
                      <Card
                        role="radio"
                        aria-checked={isSelected}
                        aria-label={`${plan.name} - ${plan.period}`}
                        tabIndex={0}
                        onClick={() => selectPlan(plan.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault()
                            selectPlan(plan.id)
                          }
                        }}
                        className={cn(
                          "relative cursor-pointer transition-all duration-300 bg-card border-2 hover:border-primary/60",
                          isSelected
                            ? "border-primary ring-2 ring-primary/30 shadow-lg shadow-primary/10"
                            : "border-border",
                          plan.highlighted && !isSelected && "border-primary/40 bg-primary/5",
                        )}
                      >
                        {/* Highlighted ribbon */}
                        {plan.highlighted && (
                          <div className="absolute -top-px left-0 right-0 h-1 bg-primary rounded-t-lg" />
                        )}

                        <CardHeader className="pb-4">
                          <div className="flex items-center justify-between">
                            <Badge
                              className={cn(
                                "font-sans text-xs font-medium px-3 py-1",
                                plan.highlighted
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-secondary text-secondary-foreground",
                              )}
                            >
                              {plan.badge}
                            </Badge>

                            <AnimatePresence>
                              {isSelected && (
                                <motion.div
                                  initial={{ scale: 0, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  exit={{ scale: 0, opacity: 0 }}
                                  className="w-6 h-6 rounded-full bg-primary flex items-center justify-center"
                                >
                                  <Check className="w-4 h-4 text-primary-foreground" />
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>

                          <div className="mt-4 flex items-center gap-3">
                            <div className={cn(
                              "w-10 h-10 rounded-lg flex items-center justify-center",
                              isSelected ? "bg-primary/20" : "bg-secondary",
                            )}>
                              <Icon className={cn(
                                "w-5 h-5",
                                isSelected ? "text-primary" : "text-muted-foreground",
                              )} />
                            </div>
                            <div>
                              <h2 className="font-serif text-xl font-bold text-foreground">
                                {plan.name}
                              </h2>
                              <p className="font-sans text-sm text-primary font-medium">
                                Plan {plan.period.toLowerCase()}
                              </p>
                            </div>
                          </div>

                          <p className="mt-3 font-sans text-sm text-muted-foreground leading-relaxed">
                            {plan.description}
                          </p>
                        </CardHeader>

                        <CardContent className="pt-0">
                          {/* Features */}
                          <ul className="space-y-3" role="list">
                            {plan.features.map((feature) => (
                              <li
                                key={feature}
                                className="flex items-start gap-3 font-sans text-sm"
                              >
                                <div className="mt-0.5 w-5 h-5 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                                  <Check className="w-3 h-3 text-primary" />
                                </div>
                                <span className="text-foreground/90">{feature}</span>
                              </li>
                            ))}
                          </ul>

                          {/* Select button */}
                          <div className="mt-6">
                            {isSelected ? (
                              <Button
                                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-sans font-semibold"
                                size="lg"
                              >
                                Plan seleccionado
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full font-sans font-medium border-border text-foreground hover:border-primary hover:text-primary",
                                  plan.highlighted && "border-primary/40 text-primary hover:bg-primary/10",
                                )}
                                size="lg"
                              >
                                Elegir plan
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          </section>
        </main>

        {/* Sticky footer CTA */}
        <div className="sticky bottom-0 z-40 bg-background/95 backdrop-blur-md border-t border-border">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 max-w-5xl mx-auto">
              <p className="font-sans text-sm text-muted-foreground text-center sm:text-left">
                {selectedPlan
                  ? `Seleccionaste: ${plans.find((p) => p.id === selectedPlan)?.name}`
                  : "Selecciona un plan para continuar"}
              </p>
              <Button
              disabled={!selectedPlan}
              size="lg"
              onClick={() => {
                if (!selectedPlan) return
                router.push("/therapist/dashboard")
              }}
              className={cn(
                "w-full sm:w-auto font-sans font-semibold gap-2 transition-all duration-300",
                selectedPlan
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "bg-muted text-muted-foreground cursor-not-allowed",
              )}
            >
              {selectedPlan
                ? "Continuar con el plan elegido"
                : "Selecciona un plan para continuar"}
              {selectedPlan && <ArrowRight className="w-4 h-4" />}
            </Button>

            </div>
          </div>
        </div>

        <Footer />
      </div>
    </TooltipProvider>
  )
}
