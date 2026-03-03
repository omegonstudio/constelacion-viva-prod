"use client"

import { motion } from "framer-motion"
import { VideoBackground } from "@/components/atoms/video-background"
import { Button } from "@/components/atoms/button"
import { SectionTitle } from "@/components/atoms/section-title"

export function Hero() {
  const handleFormaParteClick = () => {
    const serviciosSection = document.querySelector("#servicios")
    if (serviciosSection) {
      serviciosSection.scrollIntoView({ behavior: "smooth" })
      setTimeout(() => {
        const event = new CustomEvent("expandTerapeutas")
        window.dispatchEvent(event)
      }, 800)
    }
  }

  const handleContactClick = () => {
    const contactSection = document.querySelector("#contacto")
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: "smooth" })
    }
  }

  return (
    <section id="hero" className="relative h-screen w-full flex items-center justify-center overflow-hidden">
      {/* Video Background */}
      <VideoBackground className="absolute inset-0 w-full h-full object-cover" />

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/70 to-black/90" />

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="space-y-8"
        >
          {/* Title */}
          <SectionTitle as="h1" className="text-white text-5xl md:text-6xl lg:text-7xl xl:text-8xl">
            <span className="text-[#ed7417]">Red de Terapeutas</span>
            <br />
            Holísticos
          </SectionTitle>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="font-serif text-lg md:text-xl lg:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed"
          >
          dedicada a promover el bienestar integral, el desarrollo personal y la expresión artística como herramientas de transformación individual y colectiva.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4"
          >
            <Button variant="cta"  size="xl" onClick={handleFormaParteClick} className="min-w-[200px] text-[#060000]">
              Forma parte
            </Button>
            <Button
              variant="outline"
              size="xl"
              onClick={handleContactClick}
              className="min-w-[200px] bg-white/10 backdrop-blur-sm border-2 border-primary text-white hover:bg-primary hover:text-white"
            >
              Contáctanos
            </Button>
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
          className="w-6 h-10 border-2 border-primary rounded-full flex items-start justify-center p-2"
        >
          <motion.div className="w-1.5 h-1.5 rounded-full bg-primary" />
        </motion.div>
      </motion.div>
    </section>
  )
}
