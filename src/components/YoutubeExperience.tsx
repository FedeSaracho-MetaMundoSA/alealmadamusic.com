import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Share2, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { resolveImage, resolveVideo } from '../lib/imageResolver';
import { getSectionData, initDataStore } from '../lib/dataStore';

// Import high-quality real event assets to use as video thumbnails and player posters
import IMG_ABOUT from "../assets/images/about.jpg";
import IMG_GUEST_MIX from "../assets/images/ale_almada_guest_mix_sonido_selecto.jpg";
import IMG_GUEST_SESSION from "../assets/images/ale_almada_guest_session.jpg";
import IMG_TREWA_BAR from "../assets/images/ale_almada_trewa_bar.png";
import IMG_GALLERY1 from "../assets/images/gallery-1.jpg";
import IMG_GALLERY3 from "../assets/images/gallery-3.jpg";
import IMG_DJING from "../assets/images/gallery_1_djing_1783708709435.jpg";
import IMG_CROWD from "../assets/images/gallery_2_crowd_1783708722876.jpg";
import IMG_HERO from "../assets/images/hero.jpg";
import IMG_RADIO from "../assets/images/radio.jpg";

export interface VideoItem {
  id: string;
  title: string;
  subtitle: string;
  src: string;
  duration?: string;
  poster: string;
  order?: number;
  isPrincipal?: boolean;
}

export const LOCAL_VIDEOS: VideoItem[] = [
  {
    id: 'vid-1',
    title: 'TREWA CLUB SENSATION - REGISTRO',
    subtitle: 'Trewa Club, Salta',
    src: '/videos/trewabar4.mp4',
    poster: '/fotos/trewa1.jpeg',
    order: 1,
    isPrincipal: true,
  },
  {
    id: 'vid-2',
    title: 'SÓNICA STUDIO SESSIONS - LIVE',
    subtitle: 'Estudio Central Sónica',
    src: '/videos/trewabar3.mp4',
    poster: '/fotos/trewa4.jpg',
    order: 2,
    isPrincipal: false,
  },
  {
    id: 'vid-3',
    title: 'SUNSET DJ BOOTH SELECTION',
    subtitle: 'Sunset Sessions, Salta',
    src: '/videos/videoiniciohero.mp4',
    poster: '/fotos/sunset1.jpeg',
    order: 3,
    isPrincipal: false,
  }
];

interface YoutubeExperienceProps {
  videos?: VideoItem[];
}

export const YoutubeExperience: React.FC<YoutubeExperienceProps> = ({ videos }) => {
  const sortVideos = (vids: VideoItem[]) => {
    return [...vids].sort((a, b) => {
      const orderA = a.order !== undefined ? Number(a.order) : 99;
      const orderB = b.order !== undefined ? Number(b.order) : 99;
      return orderA - orderB;
    });
  };

  const sanitizeVideos = (vids: VideoItem[]) => {
    return vids.map(v => {
      let p = v.poster || "";
      // If poster is empty or set to hero placeholder or obsolete uppercase path, map to professional live photo
      if (!p || p === "/fotos/hero.jpg" || p === "/fotos/hero-1.jpg" || p.includes('/Fotos/')) {
        if (v.src.includes("trewabar3") || v.id === "vid-1") {
          p = "/fotos/trewa4.jpg";
        } else if (v.src.includes("trewabar4") || v.id === "vid-2") {
          p = "/fotos/trewa1.jpeg";
        } else if (v.src.includes("videoinicio") || v.id === "vid-3") {
          p = "/fotos/sunset1.jpeg";
        } else {
          p = "/fotos/trewa9.jpg";
        }
      }
      return {
        ...v,
        poster: p
      };
    });
  };

  const [activeVideos, setActiveVideos] = useState<VideoItem[]>(() => {
    return sortVideos(sanitizeVideos(videos || LOCAL_VIDEOS));
  });
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [showShareNotification, setShowShareNotification] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (videos) {
      setActiveVideos(sortVideos(sanitizeVideos(videos)));
      setActiveVideoIndex(0);
    } else {
      const stored = localStorage.getItem("ale_almada_videos");
      if (stored) {
        try {
          setActiveVideos(sortVideos(sanitizeVideos(JSON.parse(stored))));
        } catch (e) {
          setActiveVideos(sortVideos(sanitizeVideos(LOCAL_VIDEOS)));
        }
      } else {
        setActiveVideos(sortVideos(sanitizeVideos(LOCAL_VIDEOS)));
      }
    }
  }, [videos]);

  // Handle local storage change event for admin edits
  useEffect(() => {
    const handleStorageChange = () => {
      if (!videos) {
        const list = getSectionData<VideoItem[]>("videos", LOCAL_VIDEOS);
        setActiveVideos(sortVideos(sanitizeVideos(Array.isArray(list) ? list : LOCAL_VIDEOS)));
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
  }, [videos]);

  const activeVideo = activeVideos[activeVideoIndex] || null;

  useEffect(() => {
    if (videoRef.current && activeVideo) {
      videoRef.current.muted = isMuted;
      videoRef.current.load();
      setIsPlaying(false);
      setProgress(0);
      
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
          })
          .catch(() => {
            setIsPlaying(false);
          });
      }
    }
  }, [activeVideoIndex, activeVideo]);

  const handlePlayPause = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play()
        .then(() => setIsPlaying(true))
        .catch((e) => console.log('Video play failed:', e));
    }
  };

  const handleMuteToggle = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const current = videoRef.current.currentTime;
    const duration = videoRef.current.duration;
    if (duration > 0) {
      setProgress((current / duration) * 100);
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const percentage = clickX / width;
    const duration = videoRef.current.duration;
    if (duration > 0) {
      videoRef.current.currentTime = percentage * duration;
      setProgress(percentage * 100);
    }
  };

  const handleFullscreen = () => {
    if (!videoRef.current) return;
    if (videoRef.current.requestFullscreen) {
      videoRef.current.requestFullscreen();
    }
  };

  const handleShareClick = () => {
    navigator.clipboard.writeText(window.location.href);
    setShowShareNotification(true);
    setTimeout(() => setShowShareNotification(false), 3000);
  };

  const scrollCarousel = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      const scrollAmount = 300;
      carouselRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  if (activeVideos.length === 0 || !activeVideo) {
    return (
      <div className="text-center py-24 bg-white/[0.01] border border-white/5 rounded-2xl text-zinc-500 font-mono text-xs flex flex-col items-center justify-center gap-3">
        <span className="w-2 h-2 bg-glow rounded-full animate-ping mb-2" />
        <span className="tracking-widest">NO HAY VIDEOS DISPONIBLES</span>
        <span className="text-zinc-600 text-[9px] tracking-wider">Agrega videos desde el panel de administración.</span>
      </div>
    );
  }

  return (
    <div className="w-full relative z-10 flex flex-col gap-8 max-w-5xl mx-auto">
      
      {/* 1. TOP BLOCK: Active Visual Video Player */}
      <div className="w-full flex flex-col gap-4">
        
        {/* Sleek Header bar */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full overflow-hidden border border-white/10 shadow-lg bg-black/40 flex items-center justify-center p-1">
              <img 
                src={resolveImage("/logoale.png")} 
                alt="Ale Almada Profile" 
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-glow rounded-full animate-ping" />
              <span className="font-mono text-[9px] text-zinc-400 tracking-widest uppercase font-bold">
                HD LIVE SESSIONS
              </span>
            </div>
          </div>
          
          <button 
            onClick={handleShareClick}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/[0.03] hover:bg-glow/10 border border-white/5 hover:border-glow/20 font-mono text-[8px] text-zinc-400 hover:text-glow transition-all duration-300 cursor-none uppercase tracking-widest"
          >
            <Share2 className="w-3 h-3" />
            <span>Compartir</span>
          </button>
        </div>

        {/* Video Frame */}
        <div 
          className="relative aspect-[16/9] w-full bg-[#050505] rounded-2xl overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.95)] group border border-white/5"
        >
          <video
            key={activeVideoIndex}
            ref={videoRef}
            src={resolveVideo(activeVideo.src)}
            poster={resolveImage(activeVideo.poster)}
            className="w-full h-full object-cover cursor-none"
            onClick={handlePlayPause}
            onTimeUpdate={handleTimeUpdate}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            playsInline
            muted={isMuted}
            autoPlay={true}
            loop
            preload="auto"
          />

          {/* Elegant dark ambient overlays */}
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none opacity-100 group-hover:opacity-100 transition-opacity" />
          <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/60 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />

          {/* Big hover play button overlay */}
          {!isPlaying && (
            <div 
              onClick={handlePlayPause}
              className="absolute inset-0 flex items-center justify-center bg-black/40 cursor-none transition-all"
            >
              <div className="w-14 h-14 rounded-full border border-white/20 bg-black/60 flex items-center justify-center hover:bg-glow hover:border-glow hover:text-bg transition-all transform scale-100 hover:scale-110">
                <Play className="w-5 h-5 fill-current text-white ml-0.5" />
              </div>
            </div>
          )}

          {/* Integrated custom player controls overlay */}
          <div className="absolute bottom-4 inset-x-4 flex flex-col gap-2.5 opacity-0 group-hover:opacity-100 transition-all duration-300 z-20">
            
            {/* Custom progress line */}
            <div 
              className="h-1.5 w-full bg-white/10 rounded-full cursor-none relative flex items-center"
              onClick={handleProgressClick}
            >
              <div 
                className="absolute left-0 top-0 bottom-0 bg-glow rounded-full shadow-[0_0_8px_#ff5500]" 
                style={{ width: `${progress}%` }}
              />
              <div 
                className="w-2.5 h-2.5 bg-white rounded-full absolute -ml-1.5 transition-transform group-hover:scale-110 shadow-lg border border-glow"
                style={{ left: `${progress}%` }}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button 
                  onClick={handlePlayPause}
                  className="text-white hover:text-glow transition-colors cursor-none"
                >
                  {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                </button>

                <button 
                  onClick={handleMuteToggle}
                  className="text-white hover:text-glow transition-colors cursor-none flex items-center gap-1.5"
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  <span className="font-mono text-[7.5px] text-zinc-400 uppercase tracking-widest font-bold">
                    {isMuted ? 'MUTED' : 'AUDIO LIVE'}
                  </span>
                </button>
              </div>

              <div className="flex items-center gap-3">
                <button 
                  onClick={handleFullscreen}
                  className="text-white hover:text-glow transition-colors cursor-none"
                >
                  <Maximize className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2.5 py-1 bg-black/80 backdrop-blur-md rounded-full border border-white/5">
            <span className="w-1.5 h-1.5 bg-glow rounded-full animate-ping" />
            <span className="font-mono text-[7px] uppercase tracking-widest text-white font-bold">VIVO</span>
          </div>
        </div>
      </div>

      {/* 2. BOTTOM CAROUSEL SECTION (Horizontal Posters Slider) */}
      <div className="w-full flex flex-col gap-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <span className="font-brand font-black text-[9px] text-white tracking-[0.2em] uppercase">
              SELECCIÓN DE SESIONES
            </span>
            <span className="font-mono text-[9px] text-zinc-600">• {activeVideos.length} SETS</span>
          </div>
          
          {/* Slider controls */}
          <div className="flex items-center gap-1.5">
            <button 
              onClick={() => scrollCarousel('left')}
              className="w-7 h-7 rounded-full bg-white/[0.02] hover:bg-white/[0.08] border border-white/5 hover:border-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-none"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button 
              onClick={() => scrollCarousel('right')}
              className="w-7 h-7 rounded-full bg-white/[0.02] hover:bg-white/[0.08] border border-white/5 hover:border-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-none"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Carousel track */}
        <div 
          ref={carouselRef}
          className="flex gap-4 overflow-x-auto pb-4 scroll-smooth scrollbar-none snap-x snap-mandatory"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {activeVideos.map((video, idx) => {
            const isActive = idx === activeVideoIndex;
            return (
              <button
                key={video.id}
                onClick={() => setActiveVideoIndex(idx)}
                className="snap-start flex-none w-[200px] sm:w-[240px] flex flex-col gap-2.5 text-left cursor-none group focus:outline-none"
              >
                {/* Poster Frame */}
                <div 
                  className={`relative aspect-[16/9] w-full rounded-xl overflow-hidden bg-zinc-950 border transition-all duration-300 ${
                    isActive 
                      ? 'border-glow shadow-[0_8px_20px_rgba(255,85,0,0.15)] scale-98' 
                      : 'border-white/5 group-hover:border-white/20'
                  }`}
                >
                  <img 
                    src={resolveImage(video.poster)} 
                    alt={video.title} 
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = "/fotos/trewa4.jpg";
                    }}
                    className="absolute inset-0 w-full h-full object-cover transition-all duration-500 group-hover:scale-105 brightness-[0.85] group-hover:brightness-100"
                  />
                  
                  {/* Subtle dark bottom gradient */}
                  <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />

                  {/* Play icon overlay */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/35 z-10">
                    <div className="w-9 h-9 rounded-full bg-glow text-bg flex items-center justify-center">
                      <Play className="w-3.5 h-3.5 fill-current" />
                    </div>
                  </div>

                  {/* Active playing indicator badge */}
                  {isActive && (
                    <div className="absolute top-2 left-2 bg-glow text-bg font-mono text-[6.5px] font-black uppercase tracking-[0.15em] px-2 py-0.5 rounded-full flex items-center gap-1 shadow-md z-10">
                      <span className="w-1.5 h-1.5 bg-bg rounded-full animate-pulse" />
                      VIVO
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Elegant Toast notification when copying share url */}
      <AnimatePresence>
        {showShareNotification && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.9 }}
            className="fixed bottom-8 right-8 bg-[#0a0a0a]/95 border border-glow/30 text-glow px-5 py-3 rounded-xl shadow-[0_15px_35px_rgba(0,0,0,0.8)] z-[99999] flex items-center gap-2.5 font-mono text-xs backdrop-blur-md"
          >
            <div className="w-2 h-2 bg-glow rounded-full animate-ping" />
            <span>¡ENLACE COPIADO AL PORTAPAPELES!</span>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
