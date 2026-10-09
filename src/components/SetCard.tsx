import React from 'react';
import { Play } from 'lucide-react';
import { resolveImage, resolveVideo } from '../lib/imageResolver';

interface SetCardProps {
  id: string;
  title: string;
  category: string;
  onPlay: () => void;
  url?: string;
  coverImg: string;
  isPrincipal?: boolean;
}

export const SetCard: React.FC<SetCardProps> = ({ id, title = "", category = "", onPlay, url, coverImg = "", isPrincipal }) => {
  const handleAction = (e: React.MouseEvent) => {
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      onPlay();
    }
  };

  const safeCover = coverImg || "/fotosportadas/guestsessionportada.jpeg";
  const safeTitle = title || "SET";
  const isVideoCover = safeCover.toLowerCase().endsWith('.mp4') || safeCover.toLowerCase().includes('video');
  const resolvedCover = isVideoCover ? resolveVideo(safeCover) : resolveImage(safeCover);

  const titleLines = safeTitle.split('<br>');

  return (
    <div 
      className={`w-full cursor-none flex flex-col group transition-all duration-500 rounded-2xl p-2 bg-white/[0.01] hover:bg-white/[0.03] ${
        isPrincipal 
          ? "border border-glow/30 shadow-[0_0_25px_rgba(255,85,0,0.1)] relative" 
          : "border border-white/[0.03] hover:border-white/10"
      }`}
      onClick={handleAction}
    >
      {/* Cover Image/Video container */}
      <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-black/40 transition-all duration-500 mb-4 shadow-[0_12px_40px_rgba(0,0,0,0.65)]">
        {isVideoCover ? (
          <video
            src={resolvedCover}
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out brightness-[0.7] group-hover:brightness-[0.9]"
          />
        ) : (
          <img 
            src={resolvedCover} 
            alt={safeTitle.replace(/<br>/g, ' ')} 
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = "/fotosportadas/guestsessionportada.jpeg";
            }}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out brightness-[0.75] group-hover:brightness-[0.95]"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60" />
        
        {/* Play overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              handleAction(e);
            }}
            className="w-14 h-14 rounded-full bg-glow text-bg flex items-center justify-center transform scale-90 group-hover:scale-100 transition-transform duration-300 shadow-[0_0_20px_#ff5500] cursor-none"
          >
            <Play className="w-5 h-5 fill-current ml-0.5 text-black" />
          </button>
        </div>

        {/* Principal Badge */}
        {isPrincipal && (
          <div className="absolute top-3 right-3 bg-glow text-black px-2.5 py-1 rounded-xs font-mono text-[8px] font-black tracking-widest uppercase shadow-[0_0_12px_#ff5500]">
            ★ PRINCIPAL
          </div>
        )}
      </div>

      {/* Info Area */}
      <div className="flex flex-col gap-1.5 px-1">
        <span className="font-mono text-[9px] text-dim uppercase tracking-[0.2em]">
          {category}
        </span>
        <h3 className="font-display font-extrabold text-base sm:text-lg text-ink group-hover:text-glow transition-colors duration-300 leading-snug">
          {titleLines.map((line, i) => (
            <React.Fragment key={i}>
              {line}
              {i < titleLines.length - 1 && ' '}
            </React.Fragment>
          ))}
        </h3>
        <div className="flex items-center gap-1.5 mt-1">
          <span className="font-mono text-[9px] text-dim group-hover:text-ink transition-colors duration-300 uppercase tracking-[0.15em]">
            {url ? "Escuchar en Soundcloud ↗" : "Reproducir Set →"}
          </span>
        </div>
      </div>
    </div>
  );
};
