import React, { useState, useEffect } from "react";
import { SponsorItem } from "../types";
import { resolveImage } from "../lib/imageResolver";
import { ExternalLink, ShieldCheck, Sparkles, Building2, Layers } from "lucide-react";
import { getSectionData, initDataStore } from "../lib/dataStore";

export const DEFAULT_SPONSORS: SponsorItem[] = [
  {
    id: "sp-1",
    name: "SÓNICA RADIO DIGITAL",
    logoUrl: "/logosonicaradio.png",
    websiteUrl: "https://sonicaradio.com.ar",
    category: "Radio Partner & Media",
    order: 1
  },
  {
    id: "sp-2",
    name: "TREWA BAR",
    logoUrl: "/fotos/trewa4.jpg",
    websiteUrl: "https://instagram.com",
    category: "Venue / Club Partner",
    order: 2
  },
  {
    id: "sp-3",
    name: "ORGANIC DEEP HOUSE RADIO",
    logoUrl: "/fotosportadas/guestsessionportada.jpeg",
    websiteUrl: "https://soundcloud.com/alealmada-music",
    category: "Radio International",
    order: 3
  }
];

export const SponsorsSection: React.FC = () => {
  const [sponsors, setSponsors] = useState<SponsorItem[]>([]);

  const loadSponsors = () => {
    const list = getSectionData<SponsorItem[]>("sponsors", DEFAULT_SPONSORS);
    if (Array.isArray(list)) {
      setSponsors(list);
    }
  };

  useEffect(() => {
    loadSponsors();
    const unsub = initDataStore(() => loadSponsors());
    window.addEventListener("storage", loadSponsors);
    window.addEventListener("ale_almada_update", loadSponsors);
    return () => {
      unsub();
      window.removeEventListener("storage", loadSponsors);
      window.removeEventListener("ale_almada_update", loadSponsors);
    };
  }, []);

  if (!sponsors || sponsors.length === 0) return null;

  return (
    <section id="sponsors" className="py-20 px-[6%] border-t border-line bg-black/90 relative z-10 overflow-hidden">
      <div className="max-w-6xl mx-auto space-y-12">
        
        {/* Section Header */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <span className="font-mono text-[8px] sm:text-[9px] tracking-[0.35em] text-glow uppercase block font-bold">
            MARCAS & PARTNERS // SPONSORS
          </span>
          <h2 className="font-brand font-black text-2xl sm:text-4xl text-white uppercase tracking-wider">
            SPONSORS & MARCAS ALIADAS
          </h2>
          <p className="font-mono text-[10px] sm:text-xs text-zinc-400 uppercase tracking-widest">
            Acompañan cada presentación, producción y transmisión radial
          </p>
        </div>

        {/* Sponsor Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 items-center justify-center">
          {sponsors.map((item) => (
            <a
              key={item.id}
              href={item.websiteUrl || "#"}
              target={item.websiteUrl ? "_blank" : "_self"}
              rel="noopener noreferrer"
              className="group relative bg-[#121215] hover:bg-zinc-900/80 border border-white/10 hover:border-glow/40 rounded-2xl p-6 flex flex-col items-center justify-center text-center transition-all duration-300 hover:shadow-[0_0_25px_rgba(255,85,0,0.15)] cursor-none h-40"
            >
              {/* Image Container with Automatic PNG Adaptation */}
              <div className="relative w-full h-20 flex items-center justify-center p-2">
                <img
                  src={resolveImage(item.logoUrl)}
                  alt={item.name}
                  className="max-h-full max-w-full object-contain group-hover:scale-105 transition-all duration-300 drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = "/logosonicaradio.png";
                  }}
                />
              </div>

              {/* Sponsor Name & Category */}
              <div className="mt-3 pt-2 border-t border-white/5 w-full space-y-0.5">
                <h3 className="font-brand font-black text-xs text-white uppercase tracking-wider group-hover:text-glow transition-colors truncate">
                  {item.name}
                </h3>
                {item.category && (
                  <span className="font-mono text-[8.5px] text-zinc-500 uppercase tracking-widest block truncate">
                    {item.category}
                  </span>
                )}
              </div>

              {item.websiteUrl && (
                <div className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity text-orange-400">
                  <ExternalLink className="w-3.5 h-3.5" />
                </div>
              )}
            </a>
          ))}
        </div>

      </div>
    </section>
  );
};
