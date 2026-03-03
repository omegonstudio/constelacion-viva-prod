"use client";

import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { NavLinks } from "@/components/molecules/nav-links";
import { Button } from "@/components/atoms/button";
import { cn } from "@/lib/utils"; 
import { useRouter } from "next/navigation";
import { Logo } from "@/components/atoms/logo";

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleCtaClick = () => {
    const serviciosSection = document.querySelector("#servicios");
    if (serviciosSection) {
      serviciosSection.scrollIntoView({ behavior: "smooth" });
      // Trigger expansion of Terapeutas card after scroll
      setTimeout(() => {
        const event = new CustomEvent("expandTerapeutas");
        window.dispatchEvent(event);
      }, 800);
    }
  };

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        "bg-[#060000]/95 backdrop-blur-md border-b border-[#ed7417]/30"
      )}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Logo />

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-8">
            <NavLinks />
            <Button variant="secondary" size="sm" onClick={() => router.push("/login")}>
              Ingresar
            </Button>
            <Button variant="cta"className="text-[#060000]" size="default" onClick={handleCtaClick}>
              Forma parte
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 rounded-md hover:bg-primary/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 text-white"
            aria-label={isMobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="lg:hidden bg-[#060000]/95 backdrop-blur-md border-t border-[#ed7417]/30"
          >
            <div className="container mx-auto px-4 py-6 space-y-4">
              <NavLinks
                className="flex-col items-start"
                onLinkClick={() => setIsMobileMenuOpen(false)}
              />
              <Link href="/login" className="block w-full">
                <Button
                  variant="secondary"
                  size="lg"
                  className="w-full"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Ingresar
                </Button>
              </Link>
              <Button
                variant="cta"
                size="lg"
                className="w-full text-[#060000]"
                onClick={() => {
                  handleCtaClick();
                  setIsMobileMenuOpen(false);
                }}
              >
                Forma parte
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
