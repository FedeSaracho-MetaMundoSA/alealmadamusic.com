import React from 'react';
import { motion } from 'motion/react';

interface KineticMarqueeProps {
  words: string[];
}

export const KineticMarquee: React.FC<KineticMarqueeProps> = ({ words }) => {
  // We duplicate the array to guarantee seamless wrapping in the infinite marquee
  const items = [...words, ...words, ...words, ...words];

  return (
    <div className="w-full overflow-hidden border-y border-line bg-black py-8 relative z-10 select-none">
      <motion.div 
        className="flex whitespace-nowrap gap-12"
        animate={{ x: ["0%", "-50%"] }}
        transition={{
          repeat: Infinity,
          ease: "linear",
          duration: 25
        }}
      >
        {items.map((word, index) => (
          <span 
            key={index} 
            className={`font-display text-4xl sm:text-6xl md:text-7xl font-extrabold uppercase tracking-wider ${
              index % 2 === 0 
                ? 'text-ink' 
                : 'text-transparent [-webkit-text-stroke:1px_rgba(255,255,255,0.7)]'
            }`}
          >
            {word}
          </span>
        ))}
      </motion.div>
    </div>
  );
};
