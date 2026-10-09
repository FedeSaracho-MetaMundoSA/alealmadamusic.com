import React from 'react';
import { motion } from 'motion/react';
import { resolveImage } from '../lib/imageResolver';
import { getSectionData } from '../lib/dataStore';

const LOGO_IMG = "/logoale.png";

interface IntroGatewayProps {
  onEnter: () => void;
  bgImage?: string;
}

export const IntroGateway: React.FC<IntroGatewayProps> = ({ onEnter, bgImage }) => {
  const dynamicHero = getSectionData("hero", null);
  const initialBg = bgImage || dynamicHero?.imageUrl || dynamicHero?.bgImage || "/fotos/hero.jpg";
  const [bgSrc, setBgSrc] = React.useState<string>(initialBg);
  const [fallbackIndex, setFallbackIndex] = React.useState<number>(0);

  // Update background if prop changes
  React.useEffect(() => {
    if (bgImage) {
      setBgSrc(bgImage);
    }
  }, [bgImage]);

  const fallbackPaths = [
    bgImage || "",
    "/fotos/hero.jpg",
    "/hero_inicio.png",
    "/hero.jpg",
    "/hero.png",
    "/logoale.png"
  ].filter(Boolean);

  const handleImageError = () => {
    if (fallbackIndex < fallbackPaths.length) {
      setBgSrc(fallbackPaths[fallbackIndex]);
      setFallbackIndex(prev => prev + 1);
    }
  };

  return (
    <motion.div
      id="intro-screen"
      initial={{ y: 0 }}
      exit={{ y: '-100%' }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-0 z-[99999] bg-black flex flex-col items-center justify-center select-none overflow-hidden"
    >
      {/* Background layers: Static Hero Image with multiple fallback resolutions */}
      <div className="absolute inset-0 z-0 pointer-events-none select-none">
        <img 
          src={resolveImage(bgSrc)} 
          alt="Ale Almada Hero Background" 
          onError={handleImageError}
          className="absolute inset-0 w-full h-full object-cover opacity-75 filter brightness-[0.8] contrast-[1.1] transition-all duration-700" 
        />
      </div>

      {/* Vignette and soft gradient overlay to keep text ultra-readable */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/25 to-black/65 pointer-events-none z-[2]" />

      <div className="relative text-center mb-12 px-4 z-10 w-full max-w-[90vw] flex flex-col items-center">
        {/* Glowing backdrop shadow */}
        <div className="absolute inset-0 bg-glow/20 rounded-full blur-[120px] opacity-80 scale-75 pointer-events-none" />
        
        {/* Massive premium logo */}
        <img 
          src={resolveImage(LOGO_IMG)} 
          alt="Ale Almada Logo" 
          className="w-full max-w-[240px] sm:max-w-[320px] md:max-w-[400px] h-auto object-contain filter drop-shadow-[0_0_25px_rgba(255,255,255,0.2)] opacity-95"
        />
        
        <div className="mt-8 font-mono text-[10px] sm:text-[12px] text-glow tracking-[0.4em] uppercase opacity-90 animate-pulse">
          DJ | PRODUCTOR
        </div>
      </div>

      {/* Access Button */}
      <motion.button
        id="enter-btn"
        onClick={onEnter}
        whileHover={{ scale: 1.05, boxShadow: '0 0 35px var(--color-glow)' }}
        whileTap={{ scale: 0.98 }}
        className="relative z-10 px-10 py-5 bg-black/60 border border-glow/30 hover:border-glow hover:bg-glow hover:text-bg text-ink font-mono text-xs tracking-[0.25em] uppercase transition-all duration-300 rounded-sm cursor-none"
      >
        INGRESAR A LA EXPERIENCIA
      </motion.button>


    </motion.div>
  );
};

