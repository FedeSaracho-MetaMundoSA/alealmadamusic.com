import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Calendar, MapPin, Search, Grid, List as ListIcon, Calendar as CalendarIcon, 
  ChevronLeft, ChevronRight, ExternalLink, Star, ArrowRight, X, Clock,
  Ticket, Disc, Radio, Check
} from "lucide-react";
import { EventItem } from "../types";
import { resolveImage } from "../lib/imageResolver";
import { getSectionData, initDataStore } from "../lib/dataStore";

export const DEFAULT_EVENTS: EventItem[] = [
  {
    id: "evt-1",
    title: "TREWA BAR",
    type: "past",
    date: "2026-06-13",
    formattedDate: "SÁB, 13 JUN 2026",
    year: "2026",
    venue: "TREWA BAR",
    city: "TREWA BAR, 1127",
    coverImg: "/fotos/trewa4.jpg",
    linkUrl: "https://soundcloud.com/alealmada-music/ale-almada-live-set-trewa-bar",
    description: "Live Performance grabada en vivo en Trewa Bar. Curaduría de Progressive y Organic House.",
    isStarred: true
  },
  {
    id: "evt-2",
    title: "SUNSET",
    type: "past",
    date: "2025-11-21",
    formattedDate: "VIE, 21 NOV 2025",
    year: "2025",
    venue: "Secret Location",
    city: "SECRET LOCATION, LEEDS",
    coverImg: "/fotos/sunset1.jpeg",
    linkUrl: "https://soundcloud.com/alealmada-music",
    description: "Open Air Sunset Session en Secret Location con sonido melódico e influencias de los 80s y 90s.",
    isStarred: false
  },
  {
    id: "evt-3",
    title: "SÓNICA NIGHTS / OPEN AIR",
    type: "upcoming",
    date: "2026-08-22",
    formattedDate: "SÁB, 22 AGO 2026",
    year: "2026",
    venue: "Sónica Club",
    city: "SALTA, ARGENTINA",
    coverImg: "/fotosportadas/guestsessionportada.jpeg",
    linkUrl: "https://wa.me/5493872200098?text=Hola%20Ale%20Almada,%20quisiera%20reservar%20entradas%20para%20Sonica%20Nights",
    description: "Próximo show principal de temporada. Reserva de mesas y entradas anticipadas vía WhatsApp.",
    isStarred: true
  },
  {
    id: "evt-4",
    title: "TREWA BAR",
    type: "upcoming",
    date: "2026-08-22",
    formattedDate: "SÁB, 22 AGO 2026",
    subtitle: "",
    year: "2026",
    venue: "TREWA BAR",
    city: "SALTA, ARGENTINA",
    coverImg: "/fotos/trewa4.jpg",
    linkUrl: "https://wa.me/5493872200098?text=Hola%20Ale%20Almada,%20quisiera%20reservar%20una%20mesa%20en%20Trewa%20Bar%20para%20el%2022%20de%20Agosto",
    description: "Show exclusivo en Trewa Bar. Link directo para reserva de mesas.",
    isStarred: true
  }
];

export const EventsSection: React.FC = () => {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [filter, setFilter] = useState<"all" | "upcoming" | "past">("all");
  const [viewMode, setViewMode] = useState<"grid" | "list" | "calendar">("grid");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  
  // Calendar month state
  const [currentDate, setCurrentDate] = useState(new Date(2026, 6, 1)); // July 2026 as per screenshot

  // Load events from dataStore
  const loadEvents = () => {
    const list = getSectionData<EventItem[]>("events", DEFAULT_EVENTS);
    if (Array.isArray(list)) {
      setEvents(list);
    }
  };

  useEffect(() => {
    loadEvents();
    const unsub = initDataStore(() => loadEvents());
    window.addEventListener("storage", loadEvents);
    window.addEventListener("ale_almada_update", loadEvents);
    return () => {
      unsub();
      window.removeEventListener("storage", loadEvents);
      window.removeEventListener("ale_almada_update", loadEvents);
    };
  }, []);

  // Current date for comparison (local time)
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  // Helper to check if event is upcoming based on date or explicit flag
  const isEventUpcoming = (e: EventItem) => {
    if (e.type === "past") return false;
    if (e.date && /^\d{4}-\d{2}-\d{2}/.test(e.date.trim())) {
      const cleanDate = e.date.trim().substring(0, 10);
      return cleanDate >= todayStr;
    }
    return e.type === "upcoming";
  };

  const getEventTimestamp = (e: EventItem) => {
    if (!e.date) return 0;
    const parts = e.date.trim().split("-");
    if (parts.length === 3) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const d = parseInt(parts[2], 10);
      if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
        return new Date(y, m, d).getTime();
      }
    }
    const t = new Date(e.date).getTime();
    return isNaN(t) ? 0 : t;
  };

  // Sort events: upcoming first (closest date to today comes FIRST), then past events (newest date first)
  const sortedEvents = [...events].sort((a, b) => {
    const aUpcoming = isEventUpcoming(a);
    const bUpcoming = isEventUpcoming(b);

    if (aUpcoming && !bUpcoming) return -1;
    if (!aUpcoming && bUpcoming) return 1;

    const tA = getEventTimestamp(a);
    const tB = getEventTimestamp(b);

    if (aUpcoming && bUpcoming) {
      // Ascending for upcoming (closest date to today comes FIRST)
      if (tA !== tB) return tA - tB;
      return (a.date || "").localeCompare(b.date || "");
    } else {
      // Descending for past (most recent past event comes FIRST)
      if (tA !== tB) return tB - tA;
      return (b.date || "").localeCompare(a.date || "");
    }
  });

  // Filter events by search & tab selection
  const filteredEvents = sortedEvents.filter((e) => {
    const titleStr = (e.title || "").toLowerCase();
    const venueStr = (e.venue || "").toLowerCase();
    const cityStr = (e.city || "").toLowerCase();
    const term = (searchTerm || "").toLowerCase();
    const matchesSearch = 
      titleStr.includes(term) ||
      venueStr.includes(term) ||
      cityStr.includes(term);
    
    if (!matchesSearch) return false;

    const upcoming = isEventUpcoming(e);

    if (filter === "upcoming") return upcoming;
    if (filter === "past") return !upcoming;

    // Filter "all" (Default mode): Show all events
    return true;
  });

  const upcomingCount = events.filter((e) => isEventUpcoming(e)).length;
  const pastCount = events.filter((e) => !isEventUpcoming(e)).length;

  // Central Hero Banner logic:
  // 1. Closest upcoming show is #1 priority for the Central Banner
  // 2. If no upcoming show exists, use the event marked as isStarred (Destacado)
  // 3. Fallback to the most recent past show
  const upcomingList = sortedEvents.filter((e) => isEventUpcoming(e));
  const pastList = sortedEvents.filter((e) => !isEventUpcoming(e));

  const featuredNextEvent = 
    upcomingList[0] || 
    events.find((e) => e.isStarred) || 
    pastList[0] || 
    sortedEvents[0];

  const isHeroBannerVisible = Boolean(
    featuredNextEvent && (filter === "all" || filter === "upcoming") && !searchTerm
  );

  // Exclude featuredNextEvent from the list/carousel below to prevent duplicating the hero show
  const displayEvents = filteredEvents.filter((e) => {
    if (isHeroBannerVisible && featuredNextEvent && e.id === featuredNextEvent.id) {
      return false;
    }
    return true;
  });

  const carouselRef = useRef<HTMLDivElement>(null);

  const scrollCarousel = (direction: "left" | "right") => {
    if (carouselRef.current) {
      const container = carouselRef.current;
      const cardWidth = container.firstElementChild?.clientWidth || 320;
      const gap = 24;
      const scrollAmount = direction === "left" ? -(cardWidth + gap) : (cardWidth + gap);
      container.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  // Calendar helpers
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", 
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 is Sunday
  // Convert Sunday=0 to Monday=0 indexing: Mon=0, Tue=1, ..., Sun=6
  const adjustedFirstDay = (firstDayOfMonth + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };
  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  return (
    <section id="events" className="py-24 px-[6%] border-t border-line bg-black relative z-10">
      <div className="max-w-6xl mx-auto space-y-10">
        
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 text-left">
          <div>
            <span className="font-mono text-[8px] sm:text-[9px] tracking-[0.35em] text-glow uppercase mb-2 block font-bold">
              CALENDARIO // ACTUACIONES
            </span>
            <h2 className="font-brand font-black text-3xl sm:text-5xl leading-none text-white uppercase tracking-wider">
              PRÓXIMOS SHOWS
            </h2>
            <p className="font-mono text-[10px] sm:text-xs text-zinc-400 uppercase tracking-widest mt-2">
              CALENDARIO DE CONCIERTOS EN VIVOS , FESTIVALES Y SETS ,
            </p>
          </div>

          <a 
            href="https://wa.me/5493872200098?text=Hola%20Ale%20Almada,%20quisiera%20consultar%20disponibilidad%20para%20un%20evento" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-orange-500 text-black hover:bg-orange-400 font-mono text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-[0_0_20px_rgba(255,85,0,0.25)] cursor-none shrink-0"
          >
            <Ticket className="w-3.5 h-3.5" />
            <span>CONTRATAR / SOLICITAR FECHA</span>
          </a>
        </div>

        {/* TOOLBAR: SEARCH, TAB FILTERS & VIEW MODE TOGGLE */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-zinc-950/80 p-3 rounded-2xl border border-white/10">
          
          {/* SEARCH BAR */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input 
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar eventos por club, venue o ciudad..."
              className="w-full bg-black/80 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 font-mono text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 transition-all"
            />
          </div>

          {/* TAB FILTERS (Próximos / Pasados / Todos) */}
          <div className="flex items-center gap-2 bg-black/60 p-1.5 rounded-xl border border-white/10 self-start lg:self-auto overflow-x-auto">
            <button
              onClick={() => setFilter("all")}
              className={`px-3.5 py-1.5 rounded-lg font-mono text-[10px] uppercase font-bold tracking-wider transition-all cursor-none ${
                filter === "all"
                  ? "bg-white text-black shadow-md"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              TODOS ({events.length})
            </button>
            <button
              onClick={() => setFilter("upcoming")}
              className={`px-3.5 py-1.5 rounded-lg font-mono text-[10px] uppercase font-bold tracking-wider transition-all cursor-none flex items-center gap-1.5 ${
                filter === "upcoming"
                  ? "bg-orange-500 text-black shadow-md"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <Clock className="w-3 h-3" />
              PRÓXIMOS ({upcomingCount})
            </button>
            <button
              onClick={() => setFilter("past")}
              className={`px-3.5 py-1.5 rounded-lg font-mono text-[10px] uppercase font-bold tracking-wider transition-all cursor-none flex items-center gap-1.5 ${
                filter === "past"
                  ? "bg-orange-500/80 text-black shadow-md"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <Disc className="w-3 h-3" />
              EVENTOS PASADOS ({pastCount})
            </button>
          </div>

          {/* VIEW MODE TOGGLE (Carrusel / Lista / Calendario) */}
          <div className="flex items-center gap-1 bg-black/60 p-1.5 rounded-xl border border-white/10 shrink-0 self-end lg:self-auto">
            <button
              onClick={() => setViewMode("grid")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-[9px] uppercase font-bold tracking-wider transition-all cursor-none ${
                viewMode === "grid"
                  ? "bg-zinc-800 text-white border border-white/20"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Carrusel</span>
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-[9px] uppercase font-bold tracking-wider transition-all cursor-none ${
                viewMode === "list"
                  ? "bg-zinc-800 text-white border border-white/20"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <ListIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Lista</span>
            </button>
            <button
              onClick={() => setViewMode("calendar")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-[9px] uppercase font-bold tracking-wider transition-all cursor-none ${
                viewMode === "calendar"
                  ? "bg-zinc-800 text-white border border-white/20"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Calendario</span>
            </button>
          </div>

        </div>

        {/* FEATURED CLOSEST SHOW BANNER (SHOW MÁS CERCANO A HOY / DESTACADO) */}
        {featuredNextEvent && (filter === "all" || filter === "upcoming") && !searchTerm && (
          <div className="bg-gradient-to-r from-orange-950/60 via-zinc-900 to-black border border-orange-500/40 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-[0_0_40px_rgba(255,85,0,0.15)] text-left flex flex-col md:flex-row items-center gap-8">
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
            
            {/* Poster Thumbnail */}
            <div className="w-full md:w-2/5 aspect-[16/10] bg-black rounded-2xl overflow-hidden border border-white/20 shrink-0 relative group">
              <img 
                src={resolveImage(featuredNextEvent.coverImg, "event")} 
                alt={featuredNextEvent.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = "/fotos/trewa4.jpg";
                }}
              />
              <div className="absolute top-3 left-3 flex items-center gap-2">
                <span className="px-3 py-1 bg-orange-500 text-black font-mono text-[9px] font-black uppercase tracking-widest rounded-lg shadow-lg flex items-center gap-1.5">
                  <Star className="w-3 h-3 fill-black" />
                  <span>{isEventUpcoming(featuredNextEvent) ? "PRÓXIMO SHOW MÁS CERCANO" : "★ DESTACADO ALE ALMADA"}</span>
                </span>
              </div>
            </div>

            {/* Event Info */}
            <div className="flex-1 space-y-4 z-10 w-full">
              <div className="space-y-1">
                <span className="text-[10px] font-mono tracking-[0.2em] text-orange-400 uppercase font-bold flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{featuredNextEvent.formattedDate || featuredNextEvent.date}</span>
                </span>
                <h3 className="font-brand font-black text-2xl sm:text-4xl text-white uppercase tracking-wider">
                  {featuredNextEvent.title}
                </h3>
                {featuredNextEvent.subtitle && (
                  <p className="text-sm font-sans font-semibold text-orange-400 tracking-wide">
                    {featuredNextEvent.subtitle}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-zinc-300">
                <span className="flex items-center gap-1.5 bg-black/60 px-3 py-1.5 rounded-lg border border-white/10">
                  <MapPin className="w-3.5 h-3.5 text-orange-400" />
                  <span>{featuredNextEvent.venue} — {featuredNextEvent.city}</span>
                </span>
              </div>

              {featuredNextEvent.description && (
                <p className="text-xs font-sans text-zinc-300 font-light leading-relaxed max-w-2xl">
                  {featuredNextEvent.description}
                </p>
              )}

              <div className="pt-2 flex flex-wrap gap-3">
                <button
                  onClick={() => setSelectedEvent(featuredNextEvent)}
                  className="px-6 py-3 bg-orange-500 hover:bg-orange-400 text-black font-mono text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-[0_0_20px_rgba(255,85,0,0.3)] cursor-none flex items-center gap-2"
                >
                  <Ticket className="w-4 h-4" />
                  <span>VER DETALLES & RESERVAS</span>
                </button>

                {featuredNextEvent.linkUrl && (
                  <a
                    href={featuredNextEvent.linkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-5 py-3 bg-white/10 hover:bg-white/20 text-white border border-white/20 font-mono text-xs font-bold uppercase tracking-widest rounded-xl transition-all cursor-none flex items-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>ENLACE OFICIAL</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 1. GRID / CAROUSEL VIEW (CARRUSEL DE SHOWS - 2 A 3 CARDS POR VISTA) */}
        {viewMode === "grid" && (
          <div className="space-y-4 text-left">
            {displayEvents.length === 0 ? (
              <div className="py-16 text-center text-zinc-500 font-mono text-xs uppercase bg-zinc-950/40 border border-white/5 rounded-2xl">
                No se encontraron eventos con los filtros seleccionados
              </div>
            ) : (
              <div className="relative group/carousel">
                {/* Controles del carrusel */}
                <div className="flex items-center justify-between mb-3 px-1">
                  <span className="text-[10px] font-mono tracking-[0.2em] text-zinc-400 uppercase font-bold flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                    <span>SHOWS DISPONIBLES ({displayEvents.length})</span>
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => scrollCarousel("left")}
                      className="p-2 rounded-xl bg-zinc-900 border border-white/10 text-white hover:bg-orange-500 hover:text-black hover:border-orange-500 transition-all cursor-none"
                      title="Anterior"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => scrollCarousel("right")}
                      className="p-2 rounded-xl bg-zinc-900 border border-white/10 text-white hover:bg-orange-500 hover:text-black hover:border-orange-500 transition-all cursor-none"
                      title="Siguiente"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Pista del Carrusel con Snap (3 en desktop, 2 en tablet, 1 en mobile) */}
                <div 
                  ref={carouselRef}
                  className="flex gap-6 overflow-x-auto snap-x snap-mandatory scrollbar-none scroll-smooth pb-4 pt-1 px-1 -mx-1"
                >
                  {displayEvents.map((item) => (
                    <div
                      key={item.id}
                      className="w-[88vw] sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] shrink-0 snap-start bg-[#18181b] border border-white/10 rounded-2xl overflow-hidden hover:border-glow/40 transition-all duration-300 flex flex-col group text-left shadow-lg hover:shadow-[0_0_30px_rgba(255,85,0,0.1)]"
                    >
                      {/* Poster Image */}
                      <div className="relative aspect-[16/10] bg-black overflow-hidden">
                        <img 
                          src={resolveImage(item.coverImg, "event")} 
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 filter brightness-[0.9]"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = "/fotos/trewa4.jpg";
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#18181b] via-transparent to-transparent pointer-events-none" />

                        {/* Badge: Upcoming or Past */}
                        <div className="absolute top-3 left-3 flex items-center gap-2">
                          <span className={`px-2.5 py-1 rounded-md font-mono text-[8.5px] font-black uppercase tracking-wider shadow-md ${
                            isEventUpcoming(item) 
                              ? "bg-orange-500 text-black shadow-orange-500/20" 
                              : "bg-zinc-900/90 border border-white/20 text-orange-400"
                          }`}>
                            {isEventUpcoming(item) ? "PRÓXIMO SHOW" : "EVENTO PASADO"}
                          </span>
                        </div>

                        {item.isStarred && (
                          <div className="absolute top-3 right-3 p-1.5 bg-black/60 backdrop-blur-md border border-amber-400/40 text-amber-300 rounded-lg">
                            <Star className="w-3.5 h-3.5 fill-amber-300" />
                          </div>
                        )}
                      </div>

                      {/* Body Content */}
                      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                        <div className="space-y-2">
                          <h3 className="font-brand font-black text-xl text-white uppercase tracking-wider group-hover:text-glow transition-colors">
                            {item.title}
                          </h3>
                          {item.subtitle && (
                            <p className="text-xs font-sans font-bold text-orange-400">
                              {item.subtitle}
                            </p>
                          )}

                          <div className="space-y-1.5 text-xs font-mono">
                            <div className="flex items-center gap-2 text-orange-400 font-bold uppercase text-[10.5px]">
                              <Calendar className="w-3.5 h-3.5 shrink-0" />
                              <span>{item.formattedDate || item.date}</span>
                            </div>

                            <div className="flex items-center gap-2 text-zinc-400 uppercase text-[10.5px]">
                              <MapPin className="w-3.5 h-3.5 shrink-0 text-zinc-500" />
                              <span className="truncate">{item.city || item.venue}</span>
                            </div>
                          </div>

                          {item.description && (
                            <p className="text-[11px] font-sans text-zinc-400 font-light line-clamp-2 pt-1">
                              {item.description}
                            </p>
                          )}
                        </div>

                        {/* Card Footer Action */}
                        <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                          <button
                            onClick={() => setSelectedEvent(item)}
                            className="text-[10px] font-mono tracking-widest text-zinc-300 group-hover:text-white uppercase font-bold flex items-center gap-1.5 hover:underline"
                          >
                            <span>VER DETALLES</span>
                          </button>

                          <button
                            onClick={() => setSelectedEvent(item)}
                            className="w-9 h-9 rounded-xl bg-orange-500 text-black hover:bg-orange-400 flex items-center justify-center transition-all duration-300 group-hover:scale-110 shadow-[0_0_15px_rgba(255,85,0,0.3)] cursor-none"
                            title="Ver detalles del evento"
                          >
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>

                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 2. LIST VIEW (LISTA COMPACTA ESTILO MAVELPOINT) */}
        {viewMode === "list" && (
          <div className="bg-[#121215] border border-white/10 rounded-2xl overflow-hidden shadow-2xl text-left">
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono">
                <thead>
                  <tr className="border-b border-white/10 bg-black/60 text-[9px] uppercase tracking-widest text-zinc-400">
                    <th className="py-3.5 px-5">EVENTO / FECHA</th>
                    <th className="py-3.5 px-5 hidden sm:table-cell">VENUE / LUGAR</th>
                    <th className="py-3.5 px-5">CIUDAD / UBICACIÓN</th>
                    <th className="py-3.5 px-5 text-right">ACCIONES</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-xs">
                  {displayEvents.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-12 text-center text-zinc-500 uppercase text-xs">
                        No hay eventos grabados en esta categoría
                      </td>
                    </tr>
                  ) : (
                    displayEvents.map((item) => (
                      <tr 
                        key={item.id} 
                        className="hover:bg-white/[0.03] transition-colors group cursor-pointer"
                        onClick={() => setSelectedEvent(item)}
                      >
                        {/* Evento & Año */}
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-3.5">
                            <div className="w-11 h-11 bg-zinc-900 border border-white/10 rounded-xl flex items-center justify-center text-center font-bold text-[10px] text-zinc-300 shrink-0">
                              <span>{item.year || item.date.substring(0, 4)}</span>
                            </div>
                            <div>
                              <span className="font-brand font-black text-sm text-white uppercase group-hover:text-glow transition-colors block">
                                {item.title}
                              </span>
                              {item.subtitle && (
                                <span className="text-[10.5px] text-amber-400 font-sans font-semibold block">
                                  {item.subtitle}
                                </span>
                              )}
                              <span className="text-[10px] text-orange-400 lowercase block font-sans">
                                {item.formattedDate || item.date}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Venue */}
                        <td className="py-4 px-5 text-zinc-300 font-medium hidden sm:table-cell uppercase text-[11px]">
                          {item.venue}
                        </td>

                        {/* Ciudad */}
                        <td className="py-4 px-5 text-zinc-400 text-[11px] uppercase">
                          {item.city}
                        </td>

                        {/* Acciones */}
                        <td className="py-4 px-5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {item.isStarred && (
                              <Star className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedEvent(item);
                              }}
                              className="px-3 py-1.5 bg-orange-500/10 border border-orange-500/30 hover:bg-orange-500 hover:text-black text-orange-400 font-mono text-[9px] font-bold uppercase rounded-lg transition-all cursor-none"
                            >
                              Ver Evento
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 3. CALENDAR VIEW (VISTA CALENDARIO MENSUAL) */}
        {viewMode === "calendar" && (
          <div className="bg-[#121215] border border-white/10 rounded-2xl p-6 shadow-2xl space-y-6 text-left">
            {/* Calendar Controls */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="font-brand font-black text-xl text-white uppercase tracking-wider flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-orange-400" />
                <span>{monthNames[month]} {year}</span>
              </h3>

              <div className="flex items-center gap-2">
                <button
                  onClick={prevMonth}
                  className="p-2 bg-black border border-white/10 rounded-lg hover:border-white/30 text-white transition-all cursor-none"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={nextMonth}
                  className="p-2 bg-black border border-white/10 rounded-lg hover:border-white/30 text-white transition-all cursor-none"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Calendar Grid Header */}
            <div className="grid grid-cols-7 text-center font-mono text-[10px] text-zinc-400 uppercase font-bold py-2 border-b border-white/5">
              <span>Lun</span>
              <span>Mar</span>
              <span>Mié</span>
              <span>Jue</span>
              <span>Vie</span>
              <span>Sáb</span>
              <span>Dom</span>
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1.5 font-mono text-xs">
              {/* Empty padding slots before day 1 */}
              {Array.from({ length: adjustedFirstDay }).map((_, idx) => (
                <div key={`empty-${idx}`} className="h-20 bg-black/20 border border-white/5 rounded-xl opacity-30" />
              ))}

              {/* Days of the month */}
              {Array.from({ length: daysInMonth }).map((_, idx) => {
                const dayNum = idx + 1;
                const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
                
                // Find matching events on this day
                const dayEvents = events.filter((e) => e.date.startsWith(dateStr));
                const isToday = dayNum === 28 && month === 6 && year === 2026; // Highlight active day

                return (
                  <div
                    key={`day-${dayNum}`}
                    className={`h-20 p-2 rounded-xl border flex flex-col justify-between transition-all ${
                      isToday
                        ? "border-orange-500/80 bg-orange-950/20 font-bold"
                        : "border-white/5 bg-black/40 hover:border-white/20"
                    }`}
                  >
                    <span className={`text-[11px] ${isToday ? "text-orange-400 font-black" : "text-zinc-400"}`}>
                      {String(dayNum).padStart(2, "0")}
                    </span>

                    {/* Day Events indicator */}
                    <div className="space-y-1">
                      {dayEvents.map((evt) => (
                        <button
                          key={evt.id}
                          onClick={() => setSelectedEvent(evt)}
                          className="w-full text-left text-[8.5px] px-1.5 py-0.5 rounded bg-orange-500 text-black font-black truncate uppercase shadow cursor-none block"
                          title={evt.title}
                        >
                          {evt.title}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* MODAL EVENT DETAILS OVERLAY */}
        <AnimatePresence>
          {selectedEvent && (
            <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-[#18181b] border border-white/20 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl relative text-left"
              >
                {/* Close Button */}
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-black/70 border border-white/20 text-white hover:text-orange-400 flex items-center justify-center transition-colors cursor-none"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* Poster Cover */}
                <div className="relative aspect-[16/9] bg-black">
                  <img 
                    src={resolveImage(selectedEvent.coverImg)} 
                    alt={selectedEvent.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#18181b] via-transparent to-transparent" />
                </div>

                {/* Info Content */}
                <div className="p-6 space-y-4">
                  <div>
                    <span className={`px-2.5 py-0.5 rounded font-mono text-[9px] font-black uppercase ${
                      selectedEvent.type === "upcoming" ? "bg-orange-500 text-black" : "bg-orange-500/80 text-black"
                    }`}>
                      {selectedEvent.type === "upcoming" ? "Próximo Show en Vivo" : "Set Grabado"}
                    </span>
                    <h3 className="font-brand font-black text-2xl text-white uppercase tracking-wider mt-2">
                      {selectedEvent.title}
                    </h3>
                    {selectedEvent.subtitle && (
                      <p className="text-sm font-sans font-bold text-orange-400 mt-1">
                        {selectedEvent.subtitle}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2 font-mono text-xs">
                    <div className="flex items-center gap-2 text-orange-400 font-bold uppercase">
                      <Calendar className="w-4 h-4 shrink-0" />
                      <span>{selectedEvent.formattedDate || selectedEvent.date}</span>
                    </div>

                    <div className="flex items-center gap-2 text-zinc-300 uppercase">
                      <MapPin className="w-4 h-4 shrink-0 text-orange-400" />
                      <span>{selectedEvent.venue} — {selectedEvent.city}</span>
                    </div>
                  </div>

                  {selectedEvent.description && (
                    <p className="text-xs font-sans text-zinc-300 leading-relaxed pt-2 border-t border-white/10">
                      {selectedEvent.description}
                    </p>
                  )}

                  {/* Actions */}
                  <div className="pt-4 border-t border-white/10 flex flex-wrap gap-3">
                    {selectedEvent.linkUrl && (
                      <a
                        href={selectedEvent.linkUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 bg-orange-500 hover:bg-orange-400 text-black font-mono text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-[0_0_15px_rgba(255,85,0,0.3)] cursor-none"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>{selectedEvent.type === "upcoming" ? "Entradas / Info" : "Escuchar Set"}</span>
                      </a>
                    )}
                    <button
                      onClick={() => setSelectedEvent(null)}
                      className="px-5 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-mono text-xs uppercase font-bold rounded-xl transition-all cursor-none"
                    >
                      Cerrar
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </section>
  );
};
