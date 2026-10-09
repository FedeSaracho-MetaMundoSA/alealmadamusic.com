import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sliders, Disc, Volume2, Usb, Clock, AlertTriangle, Check, Copy, Download } from "lucide-react";

export function TechRider() {
  const [copied, setCopied] = useState(false);

  const riderText = `RIDER TÉCNICO - ALE ALMADA
===========================
REQUERIMIENTOS DE EQUIPOS Y ESPECIFICACIONES MÍNIMAS PARA PRESENTACIÓN EN VIVO

1. REPRODUCTORES: 2x Pioneer CDJ o XDJ-rr (Mínimo)
2. MIXER: Pioneer DJM-750 o DJM-900 (O Superior)
3. MONITOREO: Booth monitor activo con control de volumen independiente en cabina
4. CONEXIONES: Cables USB provistos por el venue, compatibles con el equipo indicado
5. SOUNDCHECK: 30 minutos previos a la presentación

* Ante cualquier duda o variación del equipo disponible, contactar con anticipación para coordinar alternativas.`;

  const handleCopy = () => {
    navigator.clipboard.writeText(riderText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const specifications = [
    {
      icon: <Disc className="w-5 h-5 text-glow" />,
      title: "REPRODUCTORES",
      desc: "2x Pioneer CDJ o XDJ-rr (Mínimo)",
      detail: "Soporte para Rekordbox USB, firmware actualizado."
    },
    {
      icon: <Sliders className="w-5 h-5 text-glow" />,
      title: "MIXER",
      desc: "Pioneer DJM-750 o DJM-900 (O SUPERIOR)",
      detail: "Canales limpios, faders y potenciómetros en perfecto estado operativo."
    },
    {
      icon: <Volume2 className="w-5 h-5 text-glow" />,
      title: "MONITOREO",
      desc: "Booth monitor activo con control de volumen independiente",
      detail: "Ubicado a la altura del oído en cabina, libre de distorsión."
    },
    {
      icon: <Usb className="w-5 h-5 text-glow" />,
      title: "CONEXIONES",
      desc: "Cables USB provistos por el venue",
      detail: "Total compatibilidad y enlace seguro con el equipamiento indicado."
    },
    {
      icon: <Clock className="w-5 h-5 text-glow" />,
      title: "SOUNDCHECK",
      desc: "30 minutos previos a la presentación",
      detail: "Prueba técnica obligatoria para calibración acústica de sala."
    }
  ];

  return (
    <section id="rider" className="py-24 px-[6%] border-t border-line bg-black/65 relative z-10">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-glow mb-3 block">
              REQUERIMIENTOS EN VIVO
            </span>
            <h3 className="font-brand font-black text-2xl sm:text-4xl text-ink uppercase tracking-wide">
              RIDER TÉCNICO
            </h3>
            <p className="font-sans text-xs sm:text-sm text-dim max-w-xl mt-2 font-light">
              Especificaciones técnicas mínimas requeridas para garantizar la máxima fidelidad acústica y performance durante la presentación.
            </p>
          </div>
          
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-2.5 px-5 py-2.5 border border-white/10 hover:border-glow/50 bg-white/[0.02] hover:bg-glow/5 rounded text-[10px] font-mono uppercase text-ink hover:text-glow tracking-widest transition-all duration-300 cursor-none self-start md:self-auto"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-glow animate-bounce" /> COPIADO!
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" /> COPIAR ESPECIFICACIONES
              </>
            )}
          </button>
        </div>

        {/* Disclaimer Warning */}
        <div className="flex items-start gap-4 p-5 rounded border border-glow/20 bg-glow/5 mb-8">
          <AlertTriangle className="w-5 h-5 text-glow shrink-0 mt-0.5 animate-pulse" />
          <p className="font-mono text-xs text-ink/90 leading-relaxed uppercase tracking-wider">
            IMPORTANTE: Ante cualquier duda o variación del equipo disponible, contactar con anticipación para coordinar alternativas y asegurar la compatibilidad del set.
          </p>
        </div>

        {/* Visual Equipment Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* List of Specs */}
          <div className="space-y-4">
            {specifications.map((spec, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="flex items-start gap-4 p-5 rounded border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-all duration-300"
              >
                <div className="p-2.5 rounded bg-glow/5 border border-glow/15 shrink-0 mt-0.5">
                  {spec.icon}
                </div>
                <div>
                  <div className="text-[10px] font-mono tracking-widest text-glow uppercase mb-1">
                    {spec.title}
                  </div>
                  <h4 className="text-sm font-brand font-bold text-ink uppercase tracking-wide leading-snug">
                    {spec.desc}
                  </h4>
                  <p className="text-xs font-mono text-dim mt-1.5 leading-relaxed">
                    {spec.detail}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Interactive DJ Booth Visualizer */}
          <div className="rounded border border-white/5 bg-black/80 p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden">
            {/* Background wireframe atmosphere */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
              <div className="w-full h-full bg-[radial-gradient(#ff5500_1px,transparent_1px)] [background-size:16px_16px]" />
            </div>

            <div>
              <div className="text-[10px] font-mono tracking-widest text-dim uppercase mb-4">
                CONFIGURACIÓN EN CABINA (ESQUEMA)
              </div>
              
              {/* Visual mockup of the setup */}
              <div className="relative aspect-[16/9] border border-white/5 rounded bg-black/90 p-4 flex flex-col justify-center items-center gap-4">
                
                {/* Speakers */}
                <div className="absolute top-4 left-4 flex flex-col items-center">
                  <Volume2 className="w-5 h-5 text-glow animate-pulse" />
                  <span className="text-[7px] font-mono text-dim mt-1 uppercase">L-Booth</span>
                </div>
                <div className="absolute top-4 right-4 flex flex-col items-center">
                  <Volume2 className="w-5 h-5 text-glow animate-pulse" />
                  <span className="text-[7px] font-mono text-dim mt-1 uppercase">R-Booth</span>
                </div>

                {/* Booth Console mockup */}
                <div className="w-full max-w-[320px] bg-white/[0.02] border border-white/10 rounded-lg p-3 flex justify-between items-stretch gap-2 aspect-[4/2]">
                  {/* CDJ 1 */}
                  <div className="flex-1 border border-white/5 bg-black/60 rounded flex flex-col justify-between p-2 relative">
                    <div className="w-full h-2 bg-white/10 rounded-sm flex items-center justify-center">
                      <div className="w-1/2 h-full bg-glow/30 rounded-sm" />
                    </div>
                    <div className="w-8 h-8 rounded-full border border-white/10 mx-auto flex items-center justify-center animate-[spin_6s_linear_infinite]">
                      <div className="w-3.5 h-3.5 rounded-full bg-white/5 border border-glow/30" />
                    </div>
                    <div className="text-[6px] font-mono text-center text-glow">PIONEER CDJ</div>
                  </div>

                  {/* MIXER */}
                  <div className="w-[80px] border border-glow/25 bg-glow/5 rounded flex flex-col justify-between p-2">
                    <div className="flex justify-between gap-1">
                      <div className="w-1.5 h-6 bg-white/5 rounded-full relative overflow-hidden">
                        <div className="absolute bottom-0 left-0 right-0 h-4 bg-glow/40" />
                      </div>
                      <div className="w-1.5 h-6 bg-white/5 rounded-full relative overflow-hidden">
                        <div className="absolute bottom-0 left-0 right-0 h-5 bg-glow/50" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-1 my-1">
                      <div className="h-1 bg-white/20 rounded-full" />
                      <div className="h-1 bg-white/20 rounded-full" />
                      <div className="h-1 bg-glow/50 rounded-full" />
                      <div className="h-1 bg-white/20 rounded-full" />
                    </div>
                    <div className="text-[6px] font-mono text-center text-ink font-bold">DJM MIXER</div>
                  </div>

                  {/* CDJ 2 */}
                  <div className="flex-1 border border-white/5 bg-black/60 rounded flex flex-col justify-between p-2 relative">
                    <div className="w-full h-2 bg-white/10 rounded-sm flex items-center justify-center">
                      <div className="w-1/2 h-full bg-glow/30 rounded-sm" />
                    </div>
                    <div className="w-8 h-8 rounded-full border border-white/10 mx-auto flex items-center justify-center animate-[spin_6s_linear_infinite]">
                      <div className="w-3.5 h-3.5 rounded-full bg-white/5 border border-glow/30" />
                    </div>
                    <div className="text-[6px] font-mono text-center text-glow">PIONEER CDJ</div>
                  </div>
                </div>

                <div className="text-[8px] font-mono text-dim tracking-widest uppercase">
                  MONITOREO ALINEADO AL OÍDO EN CABINA
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-white/5">
              <div className="flex items-center gap-3">
                <Usb className="w-4 h-4 text-glow shrink-0" />
                <p className="font-mono text-[9px] text-dim leading-relaxed uppercase tracking-wider">
                  LINK CAT5e / SWITCH INTEGRADO PARA REPRODUCTORES COMPARTIDOS.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
