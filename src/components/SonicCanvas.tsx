import React, { useEffect, useRef } from 'react';

export const SonicCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    let animationFrameId: number;
    
    const drawSonic = (time: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      
      // Let's draw 6 concentric morphing sonic soundwave circles
      for (let i = 0; i < 6; i++) {
        // Safe radius bounds
        const radius = 100 + Math.sin(time / 1200 + i * 0.8) * 200 + i * 110;
        ctx.beginPath();
        ctx.arc(centerX, centerY, Math.max(1, radius), 0, Math.PI * 2);
        
        // Pulse intensity
        const opacity = Math.max(0, 0.12 - i * 0.018);
        ctx.strokeStyle = `rgba(0, 242, 255, ${opacity})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
      
      animationFrameId = requestAnimationFrame(drawSonic);
    };

    animationFrameId = requestAnimationFrame(drawSonic);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      id="sonic-canvas" 
      className="fixed inset-0 w-full h-full pointer-events-none z-[1]"
      style={{ opacity: 0.55 }}
    />
  );
};
