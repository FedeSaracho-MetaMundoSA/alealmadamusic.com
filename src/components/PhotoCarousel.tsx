import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Maximize2, X, Play, Pause, Camera, MapPin, Calendar } from 'lucide-react';
import { resolveImage, resolveVideo } from '../lib/imageResolver';
import { getSectionData, initDataStore } from '../lib/dataStore';

export interface CarouselSlide {
  src: string;
  title: string;
  location: string;
  date: string;
  description: string;
  order?: number;
  isPrincipal?: boolean;
}

export const CAROUSEL_SLIDES: CarouselSlide[] = [
  {
    src: "/fotos/trewa9.jpg",
    title: "ALE ALMADA - BIOGRAFÍA & LIVE SET",
    location: "Trewa Club, Salta",
    date: "2027",
    description: "Captura de la biografía principal en Trewa Club. Sonido Progressive House con ecualización de frecuencias graves e inmersión sensorial."
  },
  {
    src: "/fotos/trewa1.jpg",
    title: "TREWA CLUB - NIGHT SENSATION 01",
    location: "Trewa Club, Salta",
    date: "MARZO 2027",
    description: "Frecuencias profundas e inmersión sensorial durante el set principal en Trewa Club."
  },
  {
    src: "/fotos/trewa2.jpg",
    title: "TREWA CLUB - PROGRESSIVE FLOW 02",
    location: "Trewa Club, Salta",
    date: "MARZO 2027",
    description: "El sonido Progressive House hilvana la conexión colectiva de la pista de baile."
  },
  {
    src: "/fotos/trewa3.jpg",
    title: "TREWA CLUB - ATMOSPHERE 03",
    location: "Trewa Club, Salta",
    date: "FEBRERO 2027",
    description: "Iluminación envolvente sincronizada con mezclas de bajos profundos."
  },
  {
    src: "/fotos/trewa4.jpg",
    title: "TREWA CLUB - VIBE 04",
    location: "Trewa Club, Salta",
    date: "ENERO 2027",
    description: "Selección de melodías e imponentes sintetizadores para una atmósfera nocturna."
  },
  {
    src: "/fotos/trewa5.jpg",
    title: "TREWA CLUB - DEEP SESSION 05",
    location: "Trewa Club, Salta",
    date: "ENERO 2027",
    description: "Sonido envolvente y transiciones rítmicas en vivo."
  },
  {
    src: "/fotos/trewa6.jpg",
    title: "TREWA CLUB - INTENSE NIGHT 06",
    location: "Trewa Club, Salta",
    date: "DICIEMBRE 2026",
    description: "Momento culmen de la noche con una pista totalmente conectada."
  },
  {
    src: "/fotos/trewa7.jpg",
    title: "TREWA CLUB - GROOVE 07",
    location: "Trewa Club, Salta",
    date: "NOVIEMBRE 2026",
    description: "Groove orgánico y melódico en la cabina principal."
  },
  {
    src: "/fotos/trewa8.jpg",
    title: "TREWA CLUB - MAIN STAGE 08",
    location: "Trewa Club, Salta",
    date: "OCTUBRE 2026",
    description: "Pantallas generativas e iluminación para una experiencia audiovisual completa."
  },
  {
    src: "/fotos/sunset1.jpg",
    title: "SUNSET SESSIONS - GOLDEN HOUR 01",
    location: "Sunset Sessions, Salta",
    date: "ENERO 2027",
    description: "La luz dorada del atardecer sobre los cerros acompañado por melodías de Organic House."
  },
  {
    src: "/fotos/sunset2.jpg",
    title: "SUNSET SESSIONS - CERROS 02",
    location: "Valles Calchaquíes, Salta",
    date: "FEBRERO 2027",
    description: "Música al aire libre integrándose armoniosamente con la naturaleza."
  },
  {
    src: "/fotos/sunset3.jpg",
    title: "SUNSET SESSIONS - ORGANIC VIBES 03",
    location: "Salta, Argentina",
    date: "MARZO 2027",
    description: "Ritmos pausados y texturas cálidas para disfrutar del atardecer."
  },
  {
    src: "/fotos/sunset4.jpg",
    title: "SUNSET SESSIONS - DEEP HORIZON 04",
    location: "Open Air Sunset",
    date: "DICIEMBRE 2026",
    description: "Horizonte infinito acompañado por acordes de progressive melódico."
  },
  {
    src: "/fotos/sunset5.jpg",
    title: "SUNSET SESSIONS - MOUNTAINS 05",
    location: "Cerros de Salta",
    date: "NOVIEMBRE 2026",
    description: "Atardeceres inolvidables con curaduría sonora única."
  },
  {
    src: "/fotos/sunset6.jpg",
    title: "SUNSET SESSIONS - WARM LIGHTS 06",
    location: "Salta, Argentina",
    date: "OCTUBRE 2026",
    description: "Filtros de frecuencias y cálidas selecciones musicales."
  },
  {
    src: "/fotos/sunset7.jpg",
    title: "SUNSET SESSIONS - HARMONY 07",
    location: "Sunset Sessions",
    date: "SEPTIEMBRE 2026",
    description: "Atmósfera envolvente y vibrante energía colectivo."
  },
  {
    src: "/fotos/sunset8.jpg",
    title: "SUNSET SESSIONS - SUNSET DREAMS 08",
    location: "Cerros de Salta",
    date: "AGOSTO 2026",
    description: "Caída del sol con sonidos profundos de deep house."
  },
  {
    src: "/fotos/sunset9.jpg",
    title: "SUNSET SESSIONS - TWILIGHT 09",
    location: "Open Air, Salta",
    date: "JULIO 2026",
    description: "Crepúsculo en los valles salteños y música que transporta."
  },
  {
    src: "/fotos/imagen1.jpg",
    title: "ALE ALMADA - DJ SET 01",
    location: "Sónica Radio, Salta",
    date: "2027",
    description: "Sesión en vivo de estudio con selección exigente de Progressive House."
  },
  {
    src: "/fotos/imagen2.jpg",
    title: "ALE ALMADA - DJ SET 02",
    location: "Sónica Radio, Salta",
    date: "2027",
    description: "Detalle técnico de mezcla y ecualización precisa."
  },
  {
    src: "/fotos/imagen3.jpg",
    title: "ALE ALMADA - DJ SET 03",
    location: "Live Stream, Salta",
    date: "2027",
    description: "Transmisión en directo para oyentes de todo el país."
  },
  {
    src: "/fotos/imagen4.jpg",
    title: "ALE ALMADA - DJ SET 04",
    location: "Sónica Studio",
    date: "2026",
    description: "Bajos envolventes y ritmo constante en la cabina de audio."
  },
  {
    src: "/fotos/imagen5.jpg",
    title: "ALE ALMADA - DJ SET 05",
    location: "Salta, Argentina",
    date: "2026",
    description: "Experiencia auditiva enriquecida con producciones propias."
  },
  {
    src: "/fotos/imagen6.jpg",
    title: "ALE ALMADA - DJ SET 06",
    location: "Trewa Stage",
    date: "2026",
    description: "Momentos mágicos de conexión durante la presentación."
  },
  {
    src: "/fotos/imagen7.jpg",
    title: "ALE ALMADA - DJ SET 07",
    location: "Sónica Radio",
    date: "2026",
    description: "Cierre de la jornada con ritmos hipnóticos."
  },
  {
    src: "/fotos/hero.jpg",
    title: "ALE ALMADA - HERO PRESENTACIÓN",
    location: "Salta, Argentina",
    date: "2027",
    description: "Imagen principal de la cabina y presentación artística."
  },
  {
    src: "/videos/videoiniciohero.mp4",
    title: "SUNSET DJ BOOTH SENSATION (VIDEO)",
    location: "Sunset Sessions, Salta",
    date: "ENERO 2027",
    description: "La sinergia perfecta entre la cabina de DJ y el imponente entorno natural de los valles salteños."
  },
  {
    src: "/videos/trewabar3.mp4",
    title: "SET EN VIVO - TREWA BAR (VIDEO)",
    location: "Trewa Club, Salta",
    date: "FEBRERO 2027",
    description: "La noche vibra a ritmo de progressive house en el bar subterráneo."
  },
  {
    src: "/videos/trewabar4.mp4",
    title: "SÓNICA STUDIO LIVE BLOCK (VIDEO)",
    location: "Sónica Radio, Salta",
    date: "AÑO 2026",
    description: "Sesión transmitida en vivo con un groove constante y envolvente."
  }
];

interface PhotoCarouselProps {
  slides?: CarouselSlide[];
}

export const PhotoCarousel: React.FC<PhotoCarouselProps> = ({ slides }) => {
  const sortSlides = (items: CarouselSlide[]) => {
    return [...items].sort((a, b) => {
      const orderA = a.order !== undefined ? Number(a.order) : 99;
      const orderB = b.order !== undefined ? Number(b.order) : 99;
      return orderA - orderB;
    });
  };

  const [activeSlides, setActiveSlides] = useState<CarouselSlide[]>(() => {
    return sortSlides(slides || CAROUSEL_SLIDES);
  });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0); // -1 for left, 1 for right
  const [autoplay, setAutoplay] = useState(true);
  const [lightboxSlide, setLightboxSlide] = useState<CarouselSlide | null>(null);

  useEffect(() => {
    if (slides) {
      setActiveSlides(sortSlides(slides));
      setCurrentIndex(0);
    } else {
      const stored = localStorage.getItem("ale_almada_photos");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setActiveSlides(sortSlides(Array.isArray(parsed) ? parsed : CAROUSEL_SLIDES));
        } catch (e) {
          setActiveSlides(sortSlides(CAROUSEL_SLIDES));
        }
      } else {
        setActiveSlides(sortSlides(CAROUSEL_SLIDES));
        localStorage.setItem("ale_almada_photos", JSON.stringify(CAROUSEL_SLIDES));
      }
    }
  }, [slides]);

  // Handle local storage storage event for real-time reactivity without refresh
  useEffect(() => {
    const handleStorageChange = () => {
      if (!slides) {
        const list = getSectionData<CarouselSlide[]>("photos", CAROUSEL_SLIDES);
        setActiveSlides(sortSlides(Array.isArray(list) ? list : CAROUSEL_SLIDES));
      }
    };
    handleStorageChange();
    const unsub = initDataStore(() => handleStorageChange());
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("ale_almada_update", handleStorageChange);
    return () => {
      unsub();
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("ale_almada_update", handleStorageChange);
    };
  }, [slides]);

  useEffect(() => {
    if (!autoplay || activeSlides.length <= 1) return;
    const interval = setInterval(() => {
      handleNext();
    }, 6000);
    return () => clearInterval(interval);
  }, [currentIndex, autoplay, activeSlides]);

  const handleNext = () => {
    if (activeSlides.length === 0) return;
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % activeSlides.length);
  };

  const handlePrev = () => {
    if (activeSlides.length === 0) return;
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + activeSlides.length) % activeSlides.length);
  };

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? '100%' : '-100%',
      opacity: 0,
      scale: 1.05
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: {
        x: { type: 'spring', stiffness: 300, damping: 30 },
        opacity: { duration: 0.5 },
        scale: { duration: 0.6 }
      }
    },
    exit: (dir: number) => ({
      x: dir < 0 ? '100%' : '-100%',
      opacity: 0,
      scale: 0.95,
      transition: {
        x: { type: 'spring', stiffness: 300, damping: 30 },
        opacity: { duration: 0.5 },
        scale: { duration: 0.5 }
      }
    })
  };

  const activeSlide = activeSlides[currentIndex] || null;

  if (activeSlides.length === 0) {
    return (
      <div className="text-center py-12 text-zinc-500 font-mono text-xs">
        No hay fotos en la galería. Agrega fotos desde el panel de administración.
      </div>
    );
  }

  return (
    <div id="photo-carousel" className="relative w-full flex flex-col gap-5">
      
      {/* Main Image Slider Area - BEAUTIFULLY ROUNDED CORNERS with no rigid borders */}
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-black rounded-2xl md:rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.85)] flex items-center justify-center">
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          {(activeSlide?.src || "").toLowerCase().endsWith('.mp4') ? (
            <motion.video
              key={currentIndex}
              src={resolveVideo(activeSlide.src)}
              autoPlay
              muted
              loop
              playsInline
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="absolute inset-0 w-full h-full object-cover select-none filter brightness-[0.75] hover:brightness-[0.9] transition-all duration-500 cursor-none"
            />
          ) : (
            <motion.img
              key={currentIndex}
              src={resolveImage(activeSlide.src, "photo")}
              alt={activeSlide.title}
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = "/fotos/sunset1.jpeg";
              }}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="absolute inset-0 w-full h-full object-cover select-none filter brightness-[0.75] hover:brightness-[0.9] transition-all duration-500 cursor-none"
            />
          )}
        </AnimatePresence>

        {/* Dynamic Vignette Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/35 pointer-events-none z-[5]" />

        {/* Floating Lateral Controls (Round Buttons, clean and frameless) */}
        <div className="absolute inset-x-5 top-1/2 -translate-y-1/2 flex justify-between items-center z-10 pointer-events-none">
          <button
            onClick={(e) => { e.stopPropagation(); handlePrev(); }}
            className="w-11 h-11 rounded-full border border-white/10 hover:border-glow bg-black/70 hover:bg-black text-white hover:text-glow flex items-center justify-center transition-all duration-300 pointer-events-auto cursor-none shadow-2xl group"
          >
            <ChevronLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleNext(); }}
            className="w-11 h-11 rounded-full border border-white/10 hover:border-glow bg-black/70 hover:bg-black text-white hover:text-glow flex items-center justify-center transition-all duration-300 pointer-events-auto cursor-none shadow-2xl group"
          >
            <ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {/* Lightbox Trigger Button */}
        <button
          onClick={() => setLightboxSlide(activeSlide)}
          className="absolute top-5 right-5 z-10 w-9 h-9 rounded-full bg-black/70 hover:bg-glow hover:text-bg border border-white/10 hover:border-glow text-white flex items-center justify-center transition-all duration-300 pointer-events-auto cursor-none shadow-md"
          title="Ver en pantalla completa"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      {/* Slide Meta Info & Navigation Dots (Frameless, clean, resting beneath) */}
      <div className="py-2 px-1 flex justify-between items-center gap-5">
        <div className="font-mono text-[9px] text-zinc-500 tracking-wider">
          ({currentIndex + 1} / {activeSlides.length})
        </div>

        {/* Progress Dots at the bottom right */}
        <div className="flex gap-1.5 flex-wrap justify-end">
          {activeSlides.map((_, idx) => {
            const isActive = idx === currentIndex;
            return (
              <button
                key={idx}
                onClick={() => {
                  setDirection(idx > currentIndex ? 1 : -1);
                  setCurrentIndex(idx);
                }}
                className="group relative h-2 rounded-full overflow-hidden transition-all duration-300 cursor-none bg-white/10"
                style={{ width: isActive ? '35px' : '8px' }}
              >
                <div 
                  className={`absolute inset-0 rounded-full transition-all duration-300 ${
                    isActive ? 'bg-glow' : 'bg-transparent group-hover:bg-white/20'
                  }`} 
                />
              </button>
            );
          })}
        </div>
      </div>

      {/* Fullscreen Lightbox Modal */}
      <AnimatePresence>
        {lightboxSlide && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[999999] bg-black/98 backdrop-blur-2xl flex flex-col items-center justify-center p-4 sm:p-8"
          >
            {/* Close trigger */}
            <button
              onClick={() => setLightboxSlide(null)}
              className="absolute top-6 right-6 w-11 h-11 rounded-full border border-white/10 hover:border-glow/50 bg-zinc-950/80 hover:bg-zinc-950 text-white hover:text-glow flex items-center justify-center transition-all duration-300 cursor-none shadow-xl"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Centered Image or Video */}
            <div className="relative max-w-5xl max-h-[75vh] w-full h-full flex items-center justify-center">
              {(lightboxSlide?.src || "").toLowerCase().endsWith('.mp4') ? (
                <motion.video
                  initial={{ scale: 0.96, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.96, opacity: 0 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                  src={resolveVideo(lightboxSlide.src)}
                  autoPlay
                  controls
                  className="max-w-full max-h-full object-contain rounded-2xl border border-white/10 shadow-[0_0_60px_rgba(255,85,0,0.15)] select-none"
                />
              ) : (
                <motion.img
                  initial={{ scale: 0.96, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.96, opacity: 0 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                  src={resolveImage(lightboxSlide.src, "photo")}
                  alt={lightboxSlide.title}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = "/fotos/sunset1.jpeg";
                  }}
                  className="max-w-full max-h-full object-contain rounded-2xl border border-white/10 shadow-[0_0_60px_rgba(255,85,0,0.15)] select-none"
                />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
