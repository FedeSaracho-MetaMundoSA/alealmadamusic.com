/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from "react";
import { motion, useScroll, useSpring, AnimatePresence } from "motion/react";
import { ThreeBackground } from "./components/ThreeBackground";
import { SetsCarousel } from "./components/SetsCarousel";
import { KineticMarquee } from "./components/KineticMarquee";
import { YoutubeExperience } from "./components/YoutubeExperience";
import { SonicCanvas } from "./components/SonicCanvas";
import { IntroGateway } from "./components/IntroGateway";
import { TechRider } from "./components/TechRider";
import { PhotoCarousel, CAROUSEL_SLIDES } from "./components/PhotoCarousel";
import { EventsSection } from "./components/EventsSection";
import { SponsorsSection } from "./components/SponsorsSection";
import { AdminPanel } from "./components/AdminPanel";
import { FloatingSonicaButton } from "./components/FloatingSonicaButton";
import { FloatingWhatsappButton } from "./components/FloatingWhatsappButton";

import { Volume2, Music, ExternalLink, Mail, Disc, ChevronDown, ChevronUp, MapPin, Radio, Users, Instagram, Youtube, Send, FileText, Globe, Lock, MessageCircle } from "lucide-react";
import { resolveImage, resolveVideo } from "./lib/imageResolver";
import { getSectionData, initDataStore } from "./lib/dataStore";

// Images (User-provided assets) - Fallbacks
const LOGO_IMG = "/logoale.png";
const SONICA_LOGO = "/logosonicaradio.png";

export default function App() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  // Parallax title offset ref
  const parallaxRef = React.useRef<HTMLDivElement>(null);
  const [activePlaySet, setActivePlaySet] = useState<string | null>(null);

  // Dynamic States managed by CRM Admin Menu
  const [heroTitle, setHeroTitle] = useState("BIENVENIDOS");
  const [heroVideo, setHeroVideo] = useState("/VIDEOSALE/videoiniciohero.mp4");
  const [heroImage, setHeroImage] = useState("/fotos/hero.jpg");
  const [bioData, setBioData] = useState({
    title: "BIOGRAFÍA",
    subtitle: "ALE ALMADA / DJ | Productor en formación | Director de Sónica Radio",
    imageUrl: "/fotos/trewa9.jpg",
    mainBio: "Ale Almada es un DJ argentino influenciado por los sonidos de los años 80, el House de los 90 y la escena electrónica actual. Sus sets cubren principalmente Progressive House, incorporando matices de Organic House and Deep House, combinando melodía, profundidad y una cuidosa selección musical.",
    residence: "SALTA, ARGENTINA",
    genres: "PROGRESSIVE - ORGANIC - DEEP HOUSE",
    radioProject: "SÓNICA RADIO (DESDE 2020)",
    influences: "HERNAN CATTANEO, GUY J, SIMON VUARAMBON",
    extendedBio: [
      "Ale Almada nació en Salta, Argentina y desde muy joven desarrolló una fuerte conexión con la música. Su primer acercamiento a los sonidos electrónicos llegó durante los años 80, influenciado por el synth-pop, el disco italo y las melodías cargadas de sintetizadores que marcaron esa década.",
      "Durante los años 90 profundizó su vínculo con la música de baile y el House, dando sus primeros pasos como DJ en fiestas de 15, eventos estudiantiles y reuniones sociales.",
      "Con el paso del tiempo, la evolución de la música electrónica lo llevó a explorar nuevas corrientes: la energía de los principales eventos internacionales, la cultura del club y artistas como Hernán Cattaneo, Guy J, Rick Ryan, Simon Vuarambon, Diego Berrondo y Alex Efe fueron dando forma a una visión cada vez más profunda y melódica de la música electrónica.",
      "Actualmente continúa su formación como productor musical, buscando desarrollar su propia identidad sonora. Además de su actividad como DJ es el fundador y director de Sónica Radio, un proyecto creado en 2020 con el propósito de difundir la cultura electrónica, apoyar a los artistas y compartir la música que lo apasiona desde hace décadas."
    ]
  });
  const [sets, setSets] = useState<{ id: string; title: string; category: string; url: string; coverImg: string; isPrincipal?: boolean; order?: number; }[]>([
    { id: "SET 001", title: "Guest Session<br>ODH RADIO", category: "PROGRESSIVE HOUSE", url: "https://soundcloud.com/alealmada-music/organic_deep_house_radio_guest_session", coverImg: "/fotosportadas/guestsessionportada.jpeg", isPrincipal: true, order: 1 },
    { id: "SET 002", title: "Live Set<br>Trewa Bar", category: "PROGRESSIVE HOUSE", url: "https://soundcloud.com/alealmada-music/ale-almada-live-set-trewa-bar", coverImg: "/fotosportadas/trewabarsession.jpeg", isPrincipal: false, order: 2 },
    { id: "SET 003", title: "Guest MIX<br>Sonido Selecto", category: "DEEP HOUSE", url: "https://soundcloud.com/alealmada-music/01-sonido-selecto-guest-mix", coverImg: "/fotosportadas/guestmixportada.jpeg", isPrincipal: false, order: 3 },
    { id: "SET 004", title: "Fragments<br>Sequence", category: "ORGANIC HOUSE", url: "https://soundcloud.com/alealmada-music/fragments_sequence?in=alealmada-music/sets/recreation", coverImg: "/fotosportadas/fragmentssequence.jpeg", isPrincipal: false, order: 4 }
  ]);

  const [showAdmin, setShowAdmin] = useState(false);

  // Live Radio and Booking Form States
  const liveTracks = [
    { artist: "Guy J", title: "State of Mind" },
    { artist: "Hernan Cattaneo & Graziano Raffa", title: "Systemic" },
    { artist: "Roy Rosenfeld", title: "Milka" },
    { artist: "Nick Warren", title: "Rivera" },
    { artist: "Sebastien Leger", title: "Kanga" },
    { artist: "Volen Sentir", title: "Heimarmene" },
    { artist: "Khen", title: "Jasmine" },
    { artist: "Ale Almada", title: "Trewa Session Intro" }
  ];
  const [trackIndex, setTrackIndex] = useState(0);
  const [isPlayingRadio, setIsPlayingRadio] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [bookingStatus, setBookingStatus] = useState<"idle" | "sending" | "success">("idle");
  const [showExtendedBio, setShowExtendedBio] = useState(false);
  
  // Ambient Sound & Intro gate states
  const [hasEntered, setHasEntered] = useState(false);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  // Load and subscribe to dynamic edits
  useEffect(() => {
    const syncDataState = () => {
      const hero = getSectionData("hero", { title: "BIENVENIDOS", videoUrl: "/videos/videoiniciohero.mp4", imageUrl: "/fotos/hero.jpg" });
      if (hero.title) setHeroTitle(hero.title);
      if (hero.videoUrl && hero.videoUrl.trim() !== "") setHeroVideo(hero.videoUrl);
      if (hero.imageUrl && hero.imageUrl.trim() !== "") setHeroImage(hero.imageUrl);

      const bio = getSectionData("bio", null);
      if (bio) setBioData(bio);

      const setsList = getSectionData("sets", null);
      if (Array.isArray(setsList)) setSets(setsList);
    };

    syncDataState();
    const unsub = initDataStore(() => syncDataState());
    window.addEventListener("storage", syncDataState);
    window.addEventListener("ale_almada_update", syncDataState);

    return () => {
      unsub();
      window.removeEventListener("storage", syncDataState);
      window.removeEventListener("ale_almada_update", syncDataState);
    };
  }, []);

  // Listen for /admin path or #admin hash or keyboard shortcut (Ctrl+Shift+A / Cmd+Shift+A / Alt+A) to trigger admin panel
  useEffect(() => {
    const checkAdminRoute = () => {
      const path = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      if (path.includes("/admin") || hash.includes("admin")) {
        setHasEntered(true);
        setShowAdmin(true);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === "A" || e.key === "a")) {
        e.preventDefault();
        openAdminPanel();
      } else if (e.altKey && (e.key === "a" || e.key === "A")) {
        e.preventDefault();
        openAdminPanel();
      }
    };

    checkAdminRoute();

    window.addEventListener("popstate", checkAdminRoute);
    window.addEventListener("hashchange", checkAdminRoute);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("popstate", checkAdminRoute);
      window.removeEventListener("hashchange", checkAdminRoute);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const openAdminPanel = () => {
    setHasEntered(true);
    setShowAdmin(true);
    if (!window.location.pathname.toLowerCase().startsWith("/admin")) {
      window.history.pushState({}, "", "/admin");
    }
  };

  const handleCloseAdmin = () => {
    setShowAdmin(false);
    if (window.location.pathname.toLowerCase().startsWith("/admin")) {
      window.history.pushState({}, "", "/");
    }
    if (window.location.hash.toLowerCase().includes("admin")) {
      window.location.hash = "";
    }
  };

  // Lock body scroll until user has entered
  useEffect(() => {
    if (!hasEntered) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [hasEntered]);

  // Track Rotation Effect (Simulated Live API updates)
  useEffect(() => {
    const interval = setInterval(() => {
      setTrackIndex((prev) => (prev + 1) % liveTracks.length);
    }, 15000); // Changes track every 15 seconds for a dynamic feel
    return () => clearInterval(interval);
  }, []);

  const toggleRadioPlay = () => {
    if (!audioRef.current) {
      // High quality house/electronic music stream
      audioRef.current = new Audio("https://secure.live-streams.nl:8244/stream");
      audioRef.current.volume = 0.5;
    }
    
    if (isPlayingRadio) {
      audioRef.current.pause();
      setIsPlayingRadio(false);
    } else {
      audioRef.current.play()
        .then(() => {
          setIsPlayingRadio(true);
        })
        .catch((err) => {
          console.warn("Audio play blocked or failed, simulating playing state:", err);
          setIsPlayingRadio(true);
        });
    }
  };

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput) return;
    setBookingStatus("sending");
    setTimeout(() => {
      setBookingStatus("success");
      setEmailInput("");
      setTimeout(() => setBookingStatus("idle"), 4000);
    }, 1200);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      const dx = (cx - e.clientX) / 40;
      const dy = (cy - e.clientY) / 40;
      if (parallaxRef.current) {
        parallaxRef.current.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  const fadeInUp = {
    initial: { opacity: 0, y: 45 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-100px" },
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
  };

  const handlePlaySet = (title: string) => {
    setActivePlaySet(title);
    // Auto clear playing modal state or show visual cue
    setTimeout(() => {
      setActivePlaySet(null);
    }, 4000);
  };

  return (
    <div className="min-h-screen text-ink bg-bg overflow-x-hidden selection:bg-glow selection:text-bg">
      {/* Immersive Gate Entrance */}
      <AnimatePresence>
        {!hasEntered && (
          <IntroGateway 
            onEnter={() => {
              setHasEntered(true);
            }}
            bgImage={heroImage}
          />
        )}
      </AnimatePresence>

      {/* Absolute Background Visuals */}
      <ThreeBackground />
      <SonicCanvas />
      <FloatingSonicaButton />

      {/* Interactive Top Progress Indicator */}
      <motion.div 
        className="fixed top-0 left-0 right-0 h-[3px] bg-glow origin-left z-[110] shadow-[0_0_12px_#ff5500]" 
        style={{ scaleX }} 
      />

      <div className="relative z-10 pl-0">
        {/* Header */}
        <header className="flex justify-between items-center px-[6%] py-8 fixed w-full top-0 left-0 bg-gradient-to-b from-[#000000d9] to-transparent backdrop-blur-md z-[90] border-b border-white/[0.03]">
          <div className="brand flex flex-col justify-center">
            <img 
              src={LOGO_IMG} 
              alt="Ale Almada Logo" 
              className="h-[28px] sm:h-[35px] w-auto object-contain filter drop-shadow-[0_0_10px_rgba(255,255,255,0.15)] opacity-95 hover:opacity-100 transition-opacity duration-300"
            />
            <span className="font-mono text-[8px] text-dim tracking-[0.25em] uppercase mt-1.5">
              DJ / Productor y Director
            </span>
          </div>

          <nav className="hidden md:flex gap-10 pr-[4%]">
            {[
              { label: "Inicio", href: "#home" },
              { label: "Eventos", href: "#events" },
              { label: "Música", href: "#music" },
              { label: "Biografía", href: "#bio" },
              { label: "Sponsors", href: "#sponsors" },
              { label: "Contacto", href: "#contact" }
            ].map((item) => (
              <a 
                key={item.label}
                href={item.href} 
                className="font-mono text-[10px] tracking-[0.22em] uppercase text-dim hover:text-glow transition-all duration-300 relative group cursor-none"
              >
                {item.label}
                <span className="absolute bottom-[-4px] left-0 w-0 h-[1px] bg-glow transition-all duration-300 group-hover:w-full" />
              </a>
            ))}
          </nav>
        </header>

        {/* HERO SECTION with Parallax Mouse Move */}
        <section id="home" className="relative min-h-screen flex flex-col justify-end items-center pt-24 pb-3 px-[6%] overflow-hidden">
          {/* Background layers: Live active cinematic video of the DJ performing */}
          <div className="absolute inset-0 z-0 pointer-events-none select-none">
            {/* Active cinematic live video of the DJ */}
            <video
              key={heroVideo}
              ref={(el) => {
                if (el) {
                  el.muted = true;
                  // Explicit play command on loaded element
                  el.play().catch((err) => console.log("Hero video autoplay status:", err));
                }
              }}
              src={resolveVideo(heroVideo)}
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              onError={(e) => {
                console.log("Video loading failed, falling back to original videoiniciohero.mp4");
                setHeroVideo("/VIDEOSALE/videoiniciohero.mp4");
              }}
              className="absolute inset-0 w-full h-full object-cover opacity-80 filter brightness-[1.1] contrast-[1.1] scale-100"
              style={{ objectPosition: "center" }}
            />
            {/* Smooth transition gradient that blends perfectly with the background dark theme */}
            <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/20 to-transparent" />
          </div>

          <div className="w-full max-w-5xl relative z-10 flex items-center justify-center mt-auto pb-0">
            <div
              ref={parallaxRef}
              className="transition-transform duration-200 ease-out will-change-transform flex flex-col items-center"
            >
              <h1 
                className="font-display font-black text-[5.5vw] sm:text-[4vw] md:text-[3vw] lg:text-[2.2vw] tracking-[0.3em] uppercase select-none text-center leading-none text-white"
              >
                {heroTitle}
              </h1>
            </div>
          </div>
        </section>

        {/* KINETIC SCROLLING TEXT */}
        <KineticMarquee words={["PROGRESSIVE", "ORGANIC", "DEEP"]} />

        {/* SETS ANTERIORES Y PRÓXIMOS SHOWS (EVENTOS) */}
        <EventsSection />

        {/* CARDS SECTION (MÚSICA - Sets Holográficos en Carrusel Responsivo) */}
        <SetsCarousel 
          sets={sets}
          activePlaySet={activePlaySet}
          onPlaySet={handlePlaySet}
        />

        {/* THE VISION & BIO SECTION (BIOGRAFÍA) */}
        <section id="bio" className="py-24 sm:py-32 px-[6%] border-t border-line relative z-10 bg-black overflow-hidden flex items-center justify-center">
          <div className="w-full max-w-6xl relative z-10">
            <motion.div 
              {...fadeInUp}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-1 md:grid-cols-12 gap-10 lg:gap-14 items-start w-full"
            >
              {/* LEFT COLUMN: Dedicated Biography Image (public/fotos/trewa9.jpg) */}
              <div className="md:col-span-5 w-full flex flex-col gap-3">
                <div className="relative w-full aspect-[3/4] sm:aspect-[4/5] md:aspect-[3/4] rounded-2xl overflow-hidden group">
                  <img 
                    src={resolveImage(bioData.imageUrl || "/fotos/trewa9.jpg", "bio")} 
                    alt="Ale Almada Biografía" 
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = "/fotos/trewa9.jpg";
                    }}
                    className="w-full h-full object-cover object-center filter brightness-[0.95] group-hover:brightness-105 group-hover:scale-105 transition-all duration-700 ease-out" 
                  />
                  {/* Subtle bottom fade to blend with background seamlessly */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                </div>
              </div>

              {/* RIGHT COLUMN: Restored elegant title & Bio content */}
              <div className="md:col-span-7 flex flex-col gap-8 text-left w-full">
                <div>
                  <span className="font-mono text-[8px] sm:text-[9px] tracking-[0.35em] text-glow uppercase mb-3.5 block font-bold">
                    PERFIL PROFESIONAL
                  </span>
                  
                  {/* Updated title as requested */}
                  <h2 className="font-brand font-black text-4xl sm:text-5xl leading-none text-white mb-2 uppercase tracking-wide">
                    {bioData.title}
                  </h2>
                  
                  <p className="font-mono text-[10px] sm:text-xs tracking-[0.2em] text-zinc-400 uppercase">
                    {bioData.subtitle}
                  </p>
                </div>
                
                {/* Main bio paragraph */}
                <div className="space-y-6">
                  <p className="font-sans text-sm sm:text-base leading-relaxed text-zinc-300 font-light tracking-wide text-justify">
                    {bioData.mainBio}
                  </p>
                </div>

                {/* Modern Frameless details section - Absolutely no boxed borders (No "encuadro") */}
                <div className="space-y-5 border-l border-white/[0.08] pl-6">
                  <div className="flex gap-4 items-start">
                    <MapPin className="w-4 h-4 text-glow shrink-0 mt-0.5" />
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[8px] font-mono tracking-[0.2em] text-zinc-500 uppercase">:: BASE // RESIDENCIA</span>
                      <span className="text-[11px] sm:text-xs font-mono text-white font-bold tracking-wider uppercase">{bioData.residence}</span>
                    </div>
                  </div>

                  <div className="flex gap-4 items-start">
                    <Music className="w-4 h-4 text-glow shrink-0 mt-0.5" />
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[8px] font-mono tracking-[0.2em] text-zinc-500 uppercase">:: CURADURÍA // GÉNEROS</span>
                      <span className="text-[11px] sm:text-xs font-mono text-white font-bold tracking-wider uppercase">{bioData.genres}</span>
                    </div>
                  </div>

                  <div className="flex gap-4 items-start">
                    <Radio className="w-4 h-4 text-glow shrink-0 mt-0.5" />
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[8px] font-mono tracking-[0.2em] text-zinc-500 uppercase">:: PROYECTO // DIFUSIÓN</span>
                      <span className="text-[11px] sm:text-xs font-mono text-white font-bold tracking-wider uppercase">{bioData.radioProject}</span>
                    </div>
                  </div>

                  <div className="flex gap-4 items-start">
                    <Users className="w-4 h-4 text-glow shrink-0 mt-0.5" />
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[8px] font-mono tracking-[0.2em] text-zinc-500 uppercase">:: REFERENTES // INFLUENCIAS</span>
                      <span className="text-[11px] sm:text-xs font-mono text-white font-bold tracking-wider uppercase">{bioData.influences}</span>
                    </div>
                  </div>
                </div>

                {/* Collapsible Extended Biography with modern frameless toggle */}
                <div className="w-full mt-2 text-left">
                  <button
                    onClick={() => setShowExtendedBio(!showExtendedBio)}
                    className="w-full flex items-center justify-between py-3.5 px-0 border-b border-white/[0.08] hover:border-glow/40 transition-all duration-300 cursor-none bg-transparent text-left group"
                  >
                    <span className="font-mono text-[10px] text-zinc-400 group-hover:text-glow transition-colors tracking-[0.22em] uppercase font-bold">
                      {showExtendedBio ? "OCULTAR BIOGRAFÍA COMPLETA" : "VER BIOGRAFÍA EXTENDIDA"}
                    </span>
                    {showExtendedBio ? (
                      <ChevronUp className="w-3.5 h-3.5 text-glow" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 text-zinc-500 group-hover:text-glow transition-colors" />
                    )}
                  </button>

                  <AnimatePresence initial={false}>
                    {showExtendedBio && (
                      <motion.div
                        key="extended-bio-p"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.4, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <div className="space-y-5 pt-6 text-[13px] font-sans font-light leading-relaxed text-zinc-400 tracking-wide text-justify">
                          {bioData.extendedBio.map((para, idx) => (
                            <p key={idx}>{para}</p>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Elegant hire action button */}
                <div className="mt-4 flex flex-wrap items-center gap-4">
                  <a 
                    href="https://wa.me/5493872200098?text=Hola%20Ale%20Almada,%20quisiera%20consultar%20por%20fechas%20y%20contrataciones" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2.5 px-6 py-3 border border-emerald-500/40 text-[9px] font-mono tracking-[0.22em] uppercase text-emerald-400 bg-emerald-950/20 hover:bg-emerald-500 hover:text-black hover:border-emerald-400 transition-all duration-300 rounded-full cursor-none shadow-[0_0_20px_rgba(37,211,102,0.15)] font-bold"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    WHATSAPP DIRECTO
                  </a>
                  <a 
                    href="#contact" 
                    className="inline-flex items-center gap-3 px-6 py-3 border border-glow/30 text-[9px] font-mono tracking-[0.25em] uppercase text-white bg-glow/5 hover:bg-glow hover:text-bg hover:border-glow transition-all duration-300 rounded-full cursor-none shadow-[0_0_15px_rgba(255,85,0,0.05)]"
                  >
                    CONTRATACIONES <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

              </div>
            </motion.div>
          </div>
        </section>

        {/* SPONSORS & MARCAS ALIADAS */}
        <SponsorsSection />

        {/* PORTFOLIO MOMENTS GALLERY (GALERÍA - PREMIUM INTERACTIVE CAROUSEL) */}
        <section id="gallery" className="py-24 px-[6%] border-t border-line bg-black relative z-10">
          <div className="max-w-5xl mx-auto">
            <PhotoCarousel />
          </div>
        </section>

        {/* FOOTER & CONTACT */}
        <footer id="contact" className="py-24 px-[6%] border-t border-line relative z-10 bg-black">
          <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-12 text-center md:text-left">
            
            {/* LEFT SIDE: LOGO ALE ALMADA 3D GIRATORIO */}
            <div className="flex flex-col items-center md:items-start gap-4">
              <div className="flex flex-col items-center md:items-start">
                <span className="font-mono text-[8px] tracking-[0.25em] text-zinc-500 uppercase mb-3 font-bold">
                  ALE ALMADA // ARTIST
                </span>
                
                {/* 3D Rotating Container with elegant perspective */}
                <div className="relative w-28 h-28 flex items-center justify-center" style={{ perspective: "1000px" }}>
                  <motion.div
                    className="w-24 h-24"
                    style={{ transformStyle: "preserve-3d" }}
                    animate={{ rotateY: 360 }}
                    transition={{ repeat: Infinity, duration: 10, ease: "linear" }}
                  >
                    <img 
                      src={LOGO_IMG} 
                      alt="Ale Almada 3D Logo" 
                      className="w-full h-full object-contain filter drop-shadow-[0_0_15px_rgba(255,85,0,0.3)]"
                    />
                  </motion.div>
                </div>
              </div>
              <div className="font-mono text-[9px] text-zinc-500 tracking-[0.1em] uppercase mt-2 flex flex-col items-center sm:items-start gap-1">
                <span className="select-none">
                  © 2027 ALE ALMADA{" "}
                  <button
                    onClick={openAdminPanel}
                    className="text-zinc-600 hover:text-zinc-400 transition-colors p-1 focus:outline-none cursor-default"
                    title=""
                    aria-label="Admin"
                  >
                    •
                  </button>{" "}
                  TODOS LOS DERECHOS RESERVADOS
                </span>
              </div>
            </div>

            {/* CENTER: ENLISTADO DE REDES SOCIALES (NO TRIPLE ROW/COLUMN - CLEAN SINGLE LIST) */}
            <div className="flex flex-col items-center gap-5">
              <span className="font-brand font-black text-[9px] text-white tracking-[0.2em] uppercase">
                CONEXIÓN DIGITAL
              </span>
              <div className="flex flex-col gap-3.5 items-center font-mono text-xs text-zinc-400">
                <a 
                  href="https://www.instagram.com/alealmada.music?igsh=aXNIdDIuYnA0ZThw"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 hover:text-glow transition-colors duration-300 group cursor-none"
                >
                  <Instagram className="w-4 h-4 text-zinc-500 group-hover:text-glow transition-colors" />
                  <span className="tracking-[0.15em] uppercase font-bold text-[10px]">INSTAGRAM</span>
                  <span className="text-zinc-600 font-normal">@alealmada.music</span>
                </a>

                <a 
                  href="https://soundcloud.com/alealmada-music"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 hover:text-glow transition-colors duration-300 group cursor-none"
                >
                  <Disc className="w-4 h-4 text-zinc-500 group-hover:text-glow transition-colors" />
                  <span className="tracking-[0.15em] uppercase font-bold text-[10px]">SOUNDCLOUD</span>
                  <span className="text-zinc-600 font-normal font-sans text-[11px]">alealmada-music</span>
                </a>

                <a 
                  href="https://www.youtube.com/@alealmadamusic"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 hover:text-glow transition-colors duration-300 group cursor-none"
                >
                  <Youtube className="w-4 h-4 text-zinc-500 group-hover:text-glow transition-colors" />
                  <span className="tracking-[0.15em] uppercase font-bold text-[10px]">YOUTUBE</span>
                  <span className="text-zinc-600 font-normal">@alealmadamusic</span>
                </a>

                <a 
                  href="mailto:contacto@alealmadamusic.com"
                  className="flex items-center gap-3 hover:text-glow transition-colors duration-300 group cursor-none"
                >
                  <Mail className="w-4 h-4 text-zinc-500 group-hover:text-glow transition-colors" />
                  <span className="tracking-[0.15em] uppercase font-bold text-[10px]">RESERVAS / EMAIL</span>
                  <span className="text-zinc-600 font-normal">contacto@alealmadamusic.com</span>
                </a>

                <a 
                  href="https://wa.me/5493872200098?text=Hola%20Ale%20Almada,%20quisiera%20consultar%20por%20fechas%20y%20contrataciones"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 hover:text-emerald-400 transition-colors duration-300 group cursor-none"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-500/70 group-hover:text-emerald-400 transition-colors" />
                  <span className="tracking-[0.15em] uppercase font-bold text-[10px] text-emerald-400">WHATSAPP</span>
                  <span className="text-emerald-500/80 font-mono font-bold text-[11px]">3872 200098</span>
                </a>
              </div>
            </div>

            {/* RIGHT SIDE: LOGO RADIO SONICA */}
            <div className="flex flex-col items-center md:items-end gap-4">
              <div className="flex flex-col items-center md:items-end">
                <span className="font-mono text-[8px] tracking-[0.25em] text-dim uppercase mb-3 font-bold">
                  RADIO PARTNER // LIVE
                </span>
                {/* Sónica Radio Logo */}
                <div className="w-24 h-24 flex items-center justify-center bg-white/[0.01] hover:bg-white/[0.03] border border-white/5 hover:border-glow/20 rounded-2xl p-3 transition-all duration-500">
                  <a 
                    href="https://sonicaradio.com.ar" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-full h-full cursor-none block"
                  >
                    <img 
                      src={SONICA_LOGO} 
                      alt="Sónica Radio Logo" 
                      className="w-full h-full object-contain filter drop-shadow-[0_0_10px_rgba(255,85,0,0.1)] hover:scale-105 transition-transform duration-300"
                    />
                  </a>
                </div>
              </div>
              <div className="flex flex-col items-center md:items-end font-mono text-[9px] text-zinc-500 tracking-[0.1em] uppercase">
                <span>SÓNICA RADIO DIGITAL</span>
                <span className="text-[8px] text-glow mt-1 font-bold animate-pulse">● VIVO ONLINE</span>
              </div>
            </div>

          </div>
        </footer>

        {/* Persistent Floating Action Buttons */}
        <FloatingSonicaButton />
        <FloatingWhatsappButton />

        {/* Admin CRM Panel Modal Overlay */}
        <AnimatePresence>
          {showAdmin && (
            <AdminPanel isOpen={showAdmin} onClose={handleCloseAdmin} />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
