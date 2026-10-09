import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, PhoneCall, X } from 'lucide-react';

export const FloatingWhatsappButton: React.FC = () => {
  const [showTooltip, setShowTooltip] = useState(true);
  const whatsappUrl = "https://wa.me/5493872200098?text=Hola%20Ale%20Almada,%20quisiera%20consultar%20por%20fechas%20y%20contrataciones";

  return (
    <div className="fixed bottom-6 right-6 lg:right-8 z-[9999] flex flex-col items-end gap-2 pointer-events-auto">
      {/* Call To Action Badge / Tooltip */}
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ delay: 1, duration: 0.4 }}
            className="relative bg-zinc-950/90 backdrop-blur-md border border-emerald-500/30 text-white px-3.5 py-2 rounded-2xl shadow-[0_8px_25px_rgba(0,0,0,0.8)] flex items-center gap-2.5 max-w-[220px] sm:max-w-none group"
          >
            <button 
              onClick={() => setShowTooltip(false)}
              className="text-zinc-500 hover:text-white transition-colors cursor-none p-0.5 -ml-1"
              title="Cerrar mensaje"
            >
              <X className="w-3 h-3" />
            </button>
            <a 
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 font-mono text-[9.5px] uppercase tracking-wider text-emerald-400 font-bold hover:text-emerald-300 transition-colors cursor-none"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>CONTACTO WPP: 3872 200098</span>
            </a>
            {/* Arrow pointing down-right */}
            <div className="absolute -bottom-1.5 right-6 w-3 h-3 bg-zinc-950 border-r border-b border-emerald-500/30 transform rotate-45" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Button */}
      <motion.a
        id="floating-whatsapp-btn"
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="relative group flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-zinc-950 border border-emerald-500/40 text-emerald-400 shadow-[0_4px_25px_rgba(37,211,102,0.25)] hover:shadow-[0_8px_35px_rgba(37,211,102,0.45)] hover:border-emerald-400 hover:bg-emerald-950/40 transition-all duration-300 cursor-none"
        initial={{ opacity: 0, scale: 0.8, y: 40 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ delay: 0.9, type: 'spring', stiffness: 200, damping: 20 }}
        whileHover={{ scale: 1.08, y: -3 }}
        whileTap={{ scale: 0.92 }}
        title="Contactar por WhatsApp: 3872 200098"
      >
        {/* Pulsing ring around button */}
        <span className="absolute inset-0 rounded-full border border-emerald-500/40 animate-ping opacity-30 pointer-events-none" />

        {/* WhatsApp Icon */}
        <MessageCircle className="w-7 h-7 sm:w-8 sm:h-8 text-emerald-400 group-hover:scale-110 transition-transform duration-300 fill-emerald-400/10" />
      </motion.a>
    </div>
  );
};
