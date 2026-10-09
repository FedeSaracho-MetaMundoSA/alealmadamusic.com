import React, { useRef, useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, ChevronRight, Volume2, Radio, ExternalLink, Disc3 } from 'lucide-react';
import { SetCard } from './SetCard';
import { SetItem } from '../types';

interface SetsCarouselProps {
  sets: SetItem[];
  activePlaySet: string | null;
  onPlaySet: (title: string) => void;
}

export const SetsCarousel: React.FC<SetsCarouselProps> = ({
  sets,
  activePlaySet,
  onPlaySet,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);

  // Drag to scroll states
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftState, setScrollLeftState] = useState(0);
  const [hasMovedDuringDrag, setHasMovedDuringDrag] = useState(false);

  // Sorted sets by order
  const sortedSets = React.useMemo(() => {
    return [...sets].sort((a, b) => {
      const orderA = a.order !== undefined ? Number(a.order) : 99;
      const orderB = b.order !== undefined ? Number(b.order) : 99;
      return orderA - orderB;
    });
  }, [sets]);

  // Update scroll boundaries & progress
  const updateScrollState = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;

    const { scrollLeft, scrollWidth, clientWidth } = el;
    const maxScroll = scrollWidth - clientWidth;

    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < maxScroll - 10);

    if (maxScroll > 0) {
      const progress = Math.min(100, Math.max(0, (scrollLeft / maxScroll) * 100));
      setScrollProgress(progress);
    } else {
      setScrollProgress(100);
    }

    // Determine currently centered/active item index
    if (sortedSets.length > 0) {
      const cardWidth = el.querySelector<HTMLElement>('[data-set-card]')?.offsetWidth || 300;
      const gap = 24; // 1.5rem
      const itemSpan = cardWidth + gap;
      const idx = Math.round(scrollLeft / itemSpan);
      setActiveIndex(Math.max(0, Math.min(sortedSets.length - 1, idx)));
    }
  }, [sortedSets.length]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    updateScrollState();
    el.addEventListener('scroll', updateScrollState, { passive: true });
    window.addEventListener('resize', updateScrollState);

    return () => {
      el.removeEventListener('scroll', updateScrollState);
      window.removeEventListener('resize', updateScrollState);
    };
  }, [updateScrollState]);

  // Scroll smoothly by delta or page
  const handleScroll = (direction: 'left' | 'right') => {
    const el = containerRef.current;
    if (!el) return;

    const cardWidth = el.querySelector<HTMLElement>('[data-set-card]')?.offsetWidth || 320;
    const scrollAmount = cardWidth * (window.innerWidth < 640 ? 1 : 1.5);
    
    el.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
  };

  // Scroll to a specific item index
  const scrollToIndex = (index: number) => {
    const el = containerRef.current;
    if (!el) return;

    const cards = el.querySelectorAll<HTMLElement>('[data-set-card]');
    if (cards[index]) {
      cards[index].scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center'
      });
    }
  };

  // Mouse Drag to Scroll handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    const el = containerRef.current;
    if (!el) return;

    setIsDragging(true);
    setHasMovedDuringDrag(false);
    setStartX(e.pageX - el.offsetLeft);
    setScrollLeftState(el.scrollLeft);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    e.preventDefault();
    const x = e.pageX - containerRef.current.offsetLeft;
    const walk = (x - startX) * 1.5; // Drag sensitivity
    if (Math.abs(walk) > 4) {
      setHasMovedDuringDrag(true);
    }
    containerRef.current.scrollLeft = scrollLeftState - walk;
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  return (
    <section id="music" className="py-24 sm:py-32 px-[4%] sm:px-[6%] relative z-10 bg-black overflow-hidden select-none">
      <div className="max-w-6xl mx-auto">
        
        {/* SECTION HEADER BANNER */}
        <div className="w-full mb-8 sm:mb-12">
          <div className="relative w-full overflow-hidden bg-white/[0.02] border-y border-white/[0.08] backdrop-blur-md py-5 px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-sm shadow-[0_4px_30px_rgba(0,0,0,0.4)] hover:border-glow/20 transition-colors duration-300">
            <div className="absolute top-0 left-0 w-1 h-full bg-glow" />
            
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-glow/10 border border-glow/30 flex items-center justify-center shrink-0">
                <Disc3 className="w-4 h-4 text-glow animate-[spin_8s_linear_infinite]" />
              </div>
              <div className="text-left">
                <span className="font-mono text-[8.5px] sm:text-[9.5px] text-glow uppercase tracking-[0.25em] block font-bold">
                  CATÁLOGO OFICIAL • SOUNDCLOUD & STREAMING
                </span>
                <h2 className="font-display font-extrabold text-xs sm:text-sm md:text-base lg:text-lg tracking-[0.12em] sm:tracking-[0.18em] text-ink uppercase leading-none whitespace-nowrap">
                  Live Sets <span className="text-glow">/</span> Radio Shows <span className="text-glow">/</span> Guest Mixes <span className="text-glow">/</span> Podcasts
                </h2>
              </div>
            </div>

            {/* Top Direct SoundCloud Link CTA */}
            <a
              href="https://soundcloud.com/alealmada-music"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.03] hover:bg-[#ff5500]/15 border border-white/10 hover:border-glow/40 text-zinc-300 hover:text-glow font-mono text-[9px] sm:text-[10px] tracking-wider uppercase transition-all duration-300 group cursor-none shrink-0 shadow-[0_0_15px_rgba(0,0,0,0.5)]"
            >
              <Radio className="w-3.5 h-3.5 text-glow group-hover:scale-110 transition-transform" />
              <span>Ver Perfil en SoundCloud</span>
              <ExternalLink className="w-3 h-3 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
            </a>
          </div>
        </div>

        {/* ACTIVE PLAYING CUE */}
        {activePlaySet && (
          <motion.div 
            initial={{ opacity: 0, y: -15, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -15 }}
            className="mb-8 p-4 bg-gradient-to-r from-glow/15 via-glow/5 to-transparent border-l-4 border-l-glow border-y border-r border-white/10 rounded-r-xl flex items-center justify-between gap-4 backdrop-blur-md shadow-[0_0_30px_rgba(255,85,0,0.15)]"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-glow text-black flex items-center justify-center shadow-[0_0_15px_#ff5500]">
                <Volume2 className="w-4 h-4 fill-current animate-pulse" />
              </div>
              <div>
                <span className="font-mono text-[9px] text-glow tracking-widest uppercase font-bold block">
                  TRANSMISIÓN SELECCIONADA
                </span>
                <span className="font-display font-bold text-xs sm:text-sm text-white uppercase">
                  {activePlaySet.replace(/<br>/g, " ")}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {[40, 75, 55, 90, 60, 85, 45, 95, 70, 50].map((h, i) => (
                <span 
                  key={i} 
                  className="w-0.5 bg-glow rounded-full animate-pulse" 
                  style={{ height: `${h}%`, animationDelay: `${i * 0.1}s`, animationDuration: '0.8s' }} 
                />
              ))}
            </div>
          </motion.div>
        )}

        {/* CAROUSEL CONTROLS BAR (NAV ARROWS + STATUS COUNTER) */}
        <div className="flex items-center justify-between gap-4 mb-6 px-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] sm:text-xs text-zinc-400 uppercase tracking-widest">
              Sesión <strong className="text-white font-black">{String(activeIndex + 1).padStart(2, '0')}</strong> / {String(sortedSets.length).padStart(2, '0')}
            </span>
            <span className="hidden sm:inline-block text-zinc-600 font-mono">•</span>
            <span className="hidden sm:inline-block font-mono text-[9px] text-zinc-500 uppercase tracking-wider">
              Desliza horizontalmente o usa las flechas
            </span>
          </div>

          {/* Navigation Arrow Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleScroll('left')}
              disabled={!canScrollLeft}
              aria-label="Anterior set"
              className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all duration-300 cursor-none ${
                canScrollLeft 
                  ? 'bg-white/[0.04] hover:bg-glow/20 border-white/20 hover:border-glow text-white hover:text-glow hover:scale-105 shadow-[0_0_15px_rgba(255,85,0,0.1)] active:scale-95' 
                  : 'bg-transparent border-white/5 text-zinc-700 cursor-not-allowed opacity-40'
              }`}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <button
              onClick={() => handleScroll('right')}
              disabled={!canScrollRight}
              aria-label="Siguiente set"
              className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all duration-300 cursor-none ${
                canScrollRight 
                  ? 'bg-white/[0.04] hover:bg-glow/20 border-white/20 hover:border-glow text-white hover:text-glow hover:scale-105 shadow-[0_0_15px_rgba(255,85,0,0.1)] active:scale-95' 
                  : 'bg-transparent border-white/5 text-zinc-700 cursor-not-allowed opacity-40'
              }`}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* HORIZONTAL CAROUSEL TRACK */}
        <div 
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUpOrLeave}
          onMouseLeave={handleMouseUpOrLeave}
          className={`flex gap-5 sm:gap-6 overflow-x-auto pb-6 pt-2 scroll-smooth select-none cursor-grab active:cursor-grabbing no-scrollbar ${
            isDragging ? 'scroll-auto' : ''
          }`}
          style={{
            scrollSnapType: isDragging ? 'none' : 'x mandatory',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }}
        >
          {sortedSets.map((set, idx) => (
            <div
              key={set.id || idx}
              data-set-card
              style={{ scrollSnapAlign: 'start' }}
              className="w-[82vw] max-w-[290px] sm:w-[300px] lg:w-[310px] xl:w-[330px] shrink-0"
              onClickCapture={(e) => {
                // If user dragged more than a tiny threshold, prevent accidental card click action
                if (hasMovedDuringDrag) {
                  e.stopPropagation();
                }
              }}
            >
              <SetCard
                id={set.id}
                title={set.title}
                category={set.category}
                onPlay={() => onPlaySet(set.title)}
                url={set.url}
                coverImg={set.coverImg}
                isPrincipal={set.isPrincipal || set.order === 1}
              />
            </div>
          ))}
        </div>

        {/* BOTTOM PROGRESS BAR & INTERACTIVE INDICATOR PILLS */}
        <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-white/[0.04]">
          {/* Visual Progress Bar */}
          <div className="w-full sm:w-64 h-1 bg-white/[0.06] rounded-full overflow-hidden relative">
            <div 
              className="h-full bg-gradient-to-r from-glow to-[#ff7733] transition-all duration-300 rounded-full shadow-[0_0_10px_#ff5500]"
              style={{ width: `${Math.max(10, scrollProgress)}%` }}
            />
          </div>

          {/* Pagination Pill Dots */}
          <div className="flex items-center gap-1.5 flex-wrap justify-center">
            {sortedSets.map((_, dotIdx) => (
              <button
                key={dotIdx}
                onClick={() => scrollToIndex(dotIdx)}
                aria-label={`Ir a la sesión ${dotIdx + 1}`}
                className={`transition-all duration-300 rounded-full cursor-none ${
                  activeIndex === dotIdx 
                    ? 'w-6 h-1.5 bg-glow shadow-[0_0_8px_#ff5500]' 
                    : 'w-1.5 h-1.5 bg-white/20 hover:bg-white/40'
                }`}
              />
            ))}
          </div>

          {/* Quick badge on right */}
          <div className="hidden sm:flex items-center gap-2">
            <span className="font-mono text-[9px] text-zinc-500 uppercase tracking-widest">
              Total: <span className="text-zinc-300 font-bold">{sortedSets.length} Sesiones</span>
            </span>
          </div>
        </div>

      </div>
    </section>
  );
};
