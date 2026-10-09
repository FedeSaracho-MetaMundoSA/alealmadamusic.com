import React, { useEffect, useRef } from 'react';

export const ThreeBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Track mouse coordinates with interpolation
    let mouseX = width / 2;
    let mouseY = height / 2;
    let targetMouseX = width / 2;
    let targetMouseY = height / 2;

    const handleMouseMove = (e: MouseEvent) => {
      targetMouseX = e.clientX;
      targetMouseY = e.clientY;
    };

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('resize', handleResize);

    // 3D Projected Particle Stars/Nodes for massive speed and space depth
    const particlesCount = 40;
    const particles: Array<{
      x: number; // 3D coordinates
      y: number;
      z: number;
      px: number; // Projected screen coordinates
      py: number;
      size: number;
      color: string;
      alpha: number;
      speedZ: number;
    }> = [];

    for (let i = 0; i < particlesCount; i++) {
      particles.push({
        x: (Math.random() - 0.5) * 2000,
        y: (Math.random() - 0.5) * 2000,
        z: Math.random() * 2000,
        px: 0,
        py: 0,
        size: Math.random() * 1.5 + 0.5,
        color: i % 4 === 0 ? 'rgba(0, 242, 255, 0.8)' : 'rgba(255, 255, 255, 0.7)',
        alpha: Math.random() * 0.5 + 0.3,
        speedZ: -1.2 - Math.random() * 1.5, // Drift towards screen
      });
    }

    const draw = () => {
      // Smoothly interpolate mouse coordinate lag
      mouseX += (targetMouseX - mouseX) * 0.04;
      mouseY += (targetMouseY - mouseY) * 0.04;

      // Deep dark futuristic black background
      ctx.fillStyle = '#030303';
      ctx.fillRect(0, 0, width, height);

      // Draw high-tech subtle grid lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.01)';
      ctx.lineWidth = 1;
      const gridSize = 120;
      const xOffset = (mouseX - width / 2) * 0.03;
      const yOffset = (mouseY - height / 2) * 0.03;

      for (let x = 0; x < width + gridSize; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x - gridSize + xOffset, 0);
        ctx.lineTo(x - gridSize + xOffset, height);
        ctx.stroke();
      }
      for (let y = 0; y < height + gridSize; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y - gridSize + yOffset);
        ctx.lineTo(width, y - gridSize + yOffset);
        ctx.stroke();
      }

      // Draw massive beautiful dynamic interactive digital auroras (Glow zones)
      // Glow 1: Cyber Cyan glow tracking the mouse with inertia
      const glowCyan = ctx.createRadialGradient(mouseX, mouseY, 0, mouseX, mouseY, 300);
      glowCyan.addColorStop(0, 'rgba(0, 242, 255, 0.05)');
      glowCyan.addColorStop(0.5, 'rgba(0, 136, 255, 0.015)');
      glowCyan.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = glowCyan;
      ctx.beginPath();
      ctx.arc(mouseX, mouseY, 300, 0, Math.PI * 2);
      ctx.fill();

      // Glow 2: Organic deep violet/blue ambient glow orbiting at center
      const centerX = width / 2 + Math.sin(Date.now() * 0.0003) * 120;
      const centerY = height / 2 + Math.cos(Date.now() * 0.0002) * 120;
      const glowIndigo = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 400);
      glowIndigo.addColorStop(0, 'rgba(255, 0, 242, 0.03)');
      glowIndigo.addColorStop(0.6, 'rgba(0, 136, 255, 0.008)');
      glowIndigo.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = glowIndigo;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 400, 0, Math.PI * 2);
      ctx.fill();

      // Project, Update & Draw 3D space particles
      const fov = 400; // Camera perspective field of view
      const cx = width / 2;
      const cy = height / 2;

      particles.forEach((p) => {
        // Move towards observer (on Z axis)
        p.z += p.speedZ;

        // Reset if behind the camera
        if (p.z <= 0) {
          p.z = 2000;
          p.x = (Math.random() - 0.5) * 2000;
          p.y = (Math.random() - 0.5) * 2000;
        }

        // Project to 2D screen coordinates
        const scale = fov / (fov + p.z);
        // Add smooth mouse influence
        const mxInfluence = (mouseX - cx) * 0.1 * (1 - p.z / 2000);
        const myInfluence = (mouseY - cy) * 0.1 * (1 - p.z / 2000);

        p.px = cx + p.x * scale + mxInfluence;
        p.py = cy + p.y * scale + myInfluence;

        // Render if within viewport
        if (p.px >= 0 && p.px <= width && p.py >= 0 && p.py <= height) {
          const depthAlpha = p.alpha * (1 - p.z / 2000);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = depthAlpha;
          ctx.beginPath();
          // Scale size according to distance
          ctx.arc(p.px, p.py, p.size * scale * 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none bg-[#030303]"
      style={{ display: 'block' }}
    />
  );
};
