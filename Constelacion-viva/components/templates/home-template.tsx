import { Navbar } from "@/components/organisms/navbar"
import { Hero } from "@/components/organisms/hero"
import { ServicesGrid } from "@/components/organisms/services-grid"
import { AboutTeam } from "@/components/organisms/about-team"
import { GalleryGrid } from "@/components/organisms/gallery-grid"
import { ContactForm } from "@/components/organisms/contact-form"
import { Footer } from "@/components/organisms/footer"

export function HomeTemplate() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <Hero />
      <ServicesGrid />
      <AboutTeam />
       <GalleryGrid />
       <ContactForm />
      <Footer />
    </main>
  )
}
