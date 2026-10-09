import React from 'react';
import { motion } from 'motion/react';
import { resolveImage } from '../lib/imageResolver';

const SONICA_LOGO = "/logosonicaradio.png";

export const FloatingSonicaButton: React.FC = () => {
  return (
    <motion.a
      id="floating-sonica-btn"
      href="https://sonicaradio.com.ar"
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 left-6 lg:left-8 z-[9999] flex flex-col items-center gap-1 select-none cursor-pointer pointer-events-auto group"
      initial={{ opacity: 0, scale: 0.8, y: 40 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay: 0.8, type: 'spring', stiffness: 200, damping: 20 }}
      whileHover={{ scale: 1.1, y: -4 }}
      whileTap={{ scale: 0.95 }}
    >
      {/* "RADIO" pre-description with Unbounded brand typography (live logo style) */}
      <span className="font-brand font-black text-[6.5px] sm:text-[7.5px] tracking-[0.35em] text-zinc-500 group-hover:text-glow uppercase leading-none transition-colors duration-300">
        RADIO
      </span>
      
      {/* Logo Image Container with dynamic glow shadows */}
      <div className="w-16 h-16 sm:w-20 sm:h-20 filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)] group-hover:drop-shadow-[0_8px_20px_rgba(255,85,0,0.3)] transition-all duration-300">
        <img 
          src={resolveImage(SONICA_LOGO)} 
          alt="Sónica Radio Logo" 
          className="w-full h-full object-contain pointer-events-none"
        />
      </div>
    </motion.a>
  );
};

