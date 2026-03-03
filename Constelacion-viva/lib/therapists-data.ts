export interface Therapist {
    slug: string
    name: string
    location: string
    therapies: string[]
    bioExcerpt: string
    bioFull: string
    photos: string[]
    membershipStatus: "Active" | "Inactive" | "Pending"
    rating: number
    sessionsCount: number
    price: number
    sessionDuration: number
    aboutTherapy: string
    faqs: { question: string; answer: string }[]
  }
  
  export const therapists: Therapist[] = [
    {
      slug: "maria-gonzalez",
      name: "María González",
      location: "Buenos Aires",
      therapies: ["Reiki", "Meditación", "Constelaciones Familiares"],
      bioExcerpt: "Terapeuta holística con más de 10 años de experiencia en sanación energética y acompañamiento emocional.",
      bioFull: "Soy María, terapeuta holística con más de 10 años de experiencia dedicados a la sanación energética y el acompañamiento emocional. Mi camino comenzó con una búsqueda personal que me llevó a formaciones en Reiki, Meditación y Constelaciones Familiares. Creo profundamente en el poder de la conexión mente-cuerpo-espíritu y en la capacidad innata de cada persona para sanar. Mi enfoque integra diversas técnicas para crear un espacio seguro donde puedas explorar y transformar patrones limitantes.",
      photos: [
        "/woman-therapist-portrait.png",
        "/meditation-workshop-moon.jpg",
        "/reiki-therapy-session.jpg",
        "/family-constellations-therapy.jpg",
        "/wellness-retreat-nature.jpg"
      ],
      membershipStatus: "Active",
      rating: 4.9,
      sessionsCount: 245,
      price: 80,
      sessionDuration: 60,
      aboutTherapy: "Mis sesiones combinan técnicas de Reiki, meditación guiada y constelaciones familiares para abordar bloqueos emocionales y energéticos. Cada sesión es única y adaptada a tus necesidades específicas, creando un espacio seguro para la sanación profunda.",
      faqs: [
        { question: "¿Qué debo esperar en mi primera sesión?", answer: "En la primera sesión haremos una entrevista inicial para conocer tus necesidades y objetivos. Luego comenzaremos con técnicas suaves de relajación y evaluación energética." },
        { question: "¿Cuántas sesiones necesito?", answer: "Depende de cada persona y sus objetivos. Generalmente recomiendo un mínimo de 3-4 sesiones para notar cambios significativos." },
        { question: "¿Las sesiones pueden ser online?", answer: "Sí, ofrezco sesiones tanto presenciales en Buenos Aires como online por videollamada." }
      ]
    },
    {
      slug: "carlos-mendez",
      name: "Carlos Méndez",
      location: "Córdoba",
      therapies: ["Yoga", "Respiración Consciente", "Coaching"],
      bioExcerpt: "Instructor de yoga certificado y coach de vida especializado en técnicas de respiración y mindfulness.",
      bioFull: "Mi nombre es Carlos y soy instructor de yoga certificado internacionalmente con especialización en Hatha y Kundalini Yoga. También soy coach de vida y facilitador de técnicas de respiración consciente. Mi misión es ayudarte a encontrar equilibrio y claridad a través del movimiento, la respiración y la auto-indagación. Creo que cada persona tiene dentro de sí todas las respuestas que necesita.",
      photos: [
        "/man-coach-portrait.jpg",
        "/sunrise-yoga-practice.jpg"
      ],
      membershipStatus: "Active",
      rating: 4.8,
      sessionsCount: 189,
      price: 65,
      sessionDuration: 75,
      aboutTherapy: "Mis clases y sesiones individuales integran posturas de yoga, pranayama (respiración consciente) y técnicas de coaching para ayudarte a alcanzar tus metas de bienestar físico y mental.",
      faqs: [
        { question: "¿Necesito experiencia previa en yoga?", answer: "No, mis clases se adaptan a todos los niveles, desde principiantes hasta practicantes avanzados." },
        { question: "¿Qué debo llevar a una clase?", answer: "Solo necesitas ropa cómoda y una esterilla. Yo proporciono los demás elementos necesarios." }
      ]
    },
    {
      slug: "lucia-fernandez",
      name: "Lucía Fernández",
      location: "Buenos Aires",
      therapies: ["Aromaterapia", "Masaje Holístico", "Reflexología"],
      bioExcerpt: "Especialista en terapias corporales con enfoque en aromaterapia y técnicas de masaje para el bienestar integral.",
      bioFull: "Soy Lucía, terapeuta corporal con formación en aromaterapia clínica, masaje holístico y reflexología podal. Mi pasión es trabajar con el cuerpo como puerta de entrada al bienestar integral. Utilizo aceites esenciales de alta calidad y técnicas manuales precisas para aliviar tensiones, mejorar la circulación y promover la relajación profunda. Cada sesión es un viaje sensorial hacia tu centro.",
      photos: [
        "/yoga-instructor.png",
        "/holistic-massage-therapy.jpg",
        "/sound-therapy-bowls.jpg"
      ],
      membershipStatus: "Active",
      rating: 4.95,
      sessionsCount: 312,
      price: 75,
      sessionDuration: 90,
      aboutTherapy: "Combino aromaterapia con técnicas de masaje holístico y reflexología para crear una experiencia terapéutica completa. Los aceites esenciales se seleccionan específicamente para tus necesidades del momento.",
      faqs: [
        { question: "¿Tienen contraindicaciones los aceites esenciales?", answer: "Algunos aceites pueden tener contraindicaciones en embarazo o ciertas condiciones. Siempre hago una consulta previa para seleccionar los más adecuados." },
        { question: "¿Cuánto dura el efecto del masaje?", answer: "Los efectos pueden durar varios días. Recomiendo sesiones regulares cada 2-4 semanas para mantener el bienestar." }
      ]
    },
    {
      slug: "ana-martinez",
      name: "Ana Martínez",
      location: "Córdoba",
      therapies: ["Terapia Floral", "Astrología", "Tarot Terapéutico"],
      bioExcerpt: "Terapeuta floral y astróloga dedicada a guiar procesos de autoconocimiento y transformación personal.",
      bioFull: "Me llamo Ana y soy terapeuta floral certificada en el sistema Bach y astróloga con más de 8 años de práctica. Utilizo el tarot como herramienta terapéutica de autoconocimiento, no como adivinación. Mi enfoque integra estas tres disciplinas para ofrecer una mirada profunda a tus patrones emocionales y tu potencial de crecimiento personal.",
      photos: [
        "/woman-facilitator-portrait.jpg",
        "/cacao-ceremony.png"
      ],
      membershipStatus: "Active",
      rating: 4.7,
      sessionsCount: 156,
      price: 55,
      sessionDuration: 60,
      aboutTherapy: "Mis sesiones combinan lectura de carta natal, esencias florales personalizadas y tarot terapéutico para darte claridad sobre tu camino y herramientas concretas para tu proceso.",
      faqs: [
        { question: "¿Necesito saber mi hora de nacimiento para la carta natal?", answer: "Sí, la hora exacta es importante para una lectura precisa. Si no la conoces, podemos trabajar con una carta solar." },
        { question: "¿Las flores de Bach tienen efectos secundarios?", answer: "No, las esencias florales son completamente seguras y pueden combinarse con cualquier tratamiento médico." }
      ]
    },
    {
      slug: "diego-ruiz",
      name: "Diego Ruiz",
      location: "Buenos Aires",
      therapies: ["Sonidoterapia", "Meditación", "Ceremonias de Cacao"],
      bioExcerpt: "Facilitador de ceremonias y terapeuta de sonido especializado en cuencos tibetanos y gongs.",
      bioFull: "Soy Diego, facilitador de ceremonias y terapeuta de sonido. Mi trabajo con cuencos tibetanos, gongs y otros instrumentos ancestrales busca crear espacios de sanación colectiva e individual. También facilito ceremonias de cacao como portal para la conexión con el corazón. Mi formación incluye estudios en Nepal y Guatemala con maestros tradicionales.",
      photos: [
        "/man-body-therapist-portrait.jpg",
        "/sound-therapy-bowls.jpg",
        "/cacao-ceremony.png",
        "/meditation-workshop.png"
      ],
      membershipStatus: "Active",
      rating: 4.85,
      sessionsCount: 203,
      price: 70,
      sessionDuration: 120,
      aboutTherapy: "Ofrezco sesiones individuales y grupales de sonidoterapia, así como ceremonias de cacao mensuales. El sonido trabaja a nivel celular, induciendo estados profundos de relajación y sanación.",
      faqs: [
        { question: "¿Qué es una ceremonia de cacao?", answer: "Es un ritual ancestral donde consumimos cacao ceremonial de alta calidad mientras meditamos y nos conectamos con el corazón. No es alucinógeno." },
        { question: "¿Puedo asistir si tengo ansiedad?", answer: "Sí, de hecho la sonidoterapia es muy beneficiosa para la ansiedad. Solo avísame antes para adaptar la sesión." }
      ]
    },
    {
      slug: "paula-santos",
      name: "Paula Santos",
      location: "Buenos Aires",
      therapies: ["Biodanza", "Danza Terapéutica", "Expresión Corporal"],
      bioExcerpt: "Facilitadora de Biodanza y danza terapéutica, creando espacios de expresión y liberación emocional.",
      bioFull: "Mi nombre es Paula y soy facilitadora certificada de Biodanza y danza terapéutica. Creo profundamente en el poder del movimiento para sanar traumas, liberar emociones y reconectarnos con nuestra vitalidad. Mis clases grupales son espacios seguros donde el juicio no existe y cada cuerpo es bienvenido tal como es.",
      photos: [
        "/woman-therapist.jpg"
      ],
      membershipStatus: "Active",
      rating: 4.9,
      sessionsCount: 178,
      price: 45,
      sessionDuration: 90,
      aboutTherapy: "La Biodanza utiliza música, movimiento y emoción para generar vivencias integradoras. No necesitas saber bailar, solo dejarte llevar por la música y tu cuerpo.",
      faqs: [
        { question: "¿Necesito saber bailar?", answer: "¡Para nada! Biodanza no es sobre técnica, es sobre expresión auténtica. Todos los cuerpos son bienvenidos." },
        { question: "¿Las clases son individuales o grupales?", answer: "Principalmente grupales, ya que la interacción con otros es parte fundamental del proceso. También ofrezco sesiones individuales." }
      ]
    },
    {
      slug: "roberto-garcia",
      name: "Roberto García",
      location: "Córdoba",
      therapies: ["Acupuntura", "Medicina China", "Chi Kung"],
      bioExcerpt: "Acupunturista y practicante de medicina tradicional china con enfoque en el equilibrio energético.",
      bioFull: "Soy Roberto, acupunturista certificado con formación en medicina tradicional china en Beijing. Mi práctica integra acupuntura, fitoterapia china y Chi Kung para restaurar el equilibrio energético del cuerpo. Tengo más de 15 años de experiencia tratando diversas condiciones desde un enfoque holístico oriental.",
      photos: [
        "/man-coach-portrait.jpg",
        "/holistic-therapy-nature-meditation.jpg"
      ],
      membershipStatus: "Inactive",
      rating: 4.8,
      sessionsCount: 420,
      price: 90,
      sessionDuration: 60,
      aboutTherapy: "La acupuntura trabaja con los meridianos energéticos del cuerpo para restaurar el flujo de Qi. Es efectiva para dolor, estrés, problemas digestivos y mucho más.",
      faqs: [
        { question: "¿Duele la acupuntura?", answer: "Las agujas son muy finas y la mayoría de personas siente solo una ligera presión. Muchos se relajan tanto que se duermen durante la sesión." },
        { question: "¿Cuántas sesiones necesito?", answer: "Depende de la condición. Para casos agudos pueden bastar 2-3 sesiones, para crónicos se recomiendan tratamientos más largos." }
      ]
    }
  ]
  
  export const locations = [...new Set(therapists.filter(t => t.membershipStatus === "Active").map(t => t.location))]
  
  export const allTherapies = [...new Set(therapists.filter(t => t.membershipStatus === "Active").flatMap(t => t.therapies))].sort()
  
  export function getActiveTherapists() {
    return therapists.filter(t => t.membershipStatus === "Active")
  }
  
  export function getTherapistBySlug(slug: string) {
    return therapists.find(t => t.slug === slug && t.membershipStatus === "Active")
  }
  
  export function getRelatedTherapists(currentSlug: string, limit = 3) {
    return getActiveTherapists()
      .filter(t => t.slug !== currentSlug)
      .slice(0, limit)
  }
  