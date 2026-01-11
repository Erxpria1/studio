'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function IntroAnimation({ onComplete }: { onComplete: () => void }) {
  const [fadingOut, setFadingOut] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mainCubeRef = useRef<HTMLDivElement>(null);
  
  const rotationRef = useRef({ x: -15, y: 45 });
  const isDraggingRef = useRef(false);
  const previousMousePositionRef = useRef({ x: 0, y: 0 });

  const handleComplete = () => {
    setFadingOut(true);
    setTimeout(onComplete, 500); // Wait for fade out animation
  };

  // Auto skip timer
  useEffect(() => {
    const timer = setTimeout(() => {
      handleComplete();
    }, 8000); // Increased time for the new animation
    return () => clearTimeout(timer);
  }, [onComplete]);

  // Matrix Rain Effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;
    const cols = Math.floor(width / 20);
    const ypos = Array(cols).fill(0);
    const chars = 'NSLAB0123456789ABCDEF@#$%&ｦｧｨｩｪｫｬｭｮｯｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ';
    
    let animationFrameId: number;

    function matrix() {
      ctx.fillStyle = 'rgba(5, 5, 5, 0.05)';
      ctx.fillRect(0, 0, width, height);
      ctx.font = '14pt monospace';

      ypos.forEach((y, i) => {
        const hue = Math.floor(Math.random() * 360);
        ctx.fillStyle = `hsl(${hue}, 100%, 60%)`;
        const text = chars[Math.floor(Math.random() * chars.length)];
        const x = i * 20;
        ctx.fillText(text, x, y);
        if (y > 100 + Math.random() * 10000) ypos[i] = 0;
        else ypos[i] = y + 20;
      });
      animationFrameId = requestAnimationFrame(matrix);
    }
    matrix();

    const handleResize = () => {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Cube Drag Logic
  useEffect(() => {
    const mainCube = mainCubeRef.current;
    if (!mainCube) return;
    
    const updateCubeRotation = () => {
        mainCube.style.transform = `rotateX(${rotationRef.current.x}deg) rotateY(${rotationRef.current.y}deg)`;
    };
    
    updateCubeRotation();

    const handleMouseDown = (e: MouseEvent) => {
        isDraggingRef.current = true;
        previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
        document.body.style.cursor = 'grabbing';
    };

    const handleMouseUp = () => {
        isDraggingRef.current = false;
        document.body.style.cursor = 'grab';
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (isDraggingRef.current) {
            const deltaMove = {
                x: e.clientX - previousMousePositionRef.current.x,
                y: e.clientY - previousMousePositionRef.current.y
            };
            rotationRef.current.y += deltaMove.x * 0.5;
            rotationRef.current.x -= deltaMove.y * 0.5;
            updateCubeRotation();
            previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
        }
    };
    
    const handleTouchStart = (e: TouchEvent) => {
        isDraggingRef.current = true;
        previousMousePositionRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };
    
    const handleTouchEnd = () => {
        isDraggingRef.current = false;
    };
    
    const handleTouchMove = (e: TouchEvent) => {
        if (isDraggingRef.current) {
            const deltaMove = {
                x: e.touches[0].clientX - previousMousePositionRef.current.x,
                y: e.touches[0].clientY - previousMousePositionRef.current.y
            };
            rotationRef.current.y += deltaMove.x * 0.5;
            rotationRef.current.x -= deltaMove.y * 0.5;
            updateCubeRotation();
            previousMousePositionRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }
    };

    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchend', handleTouchEnd);
    document.addEventListener('touchmove', handleTouchMove, { passive: true });

    return () => {
        document.removeEventListener('mousedown', handleMouseDown);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('touchstart', handleTouchStart);
        document.removeEventListener('touchend', handleTouchEnd);
        document.removeEventListener('touchmove', handleTouchMove);
        document.body.style.cursor = 'default';
    };
  }, []);

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-40 flex items-center justify-center bg-transparent transition-opacity duration-500",
          fadingOut ? "opacity-0" : "opacity-100"
        )}
        style={{ perspective: '1500px', cursor: 'grab' }}
      >
        <canvas id="matrixCanvas" ref={canvasRef} className="absolute top-0 left-0 w-full h-full -z-10"></canvas>
        
        <Button
          onClick={(e) => {
            e.stopPropagation();
            handleComplete();
          }}
          className="absolute top-4 right-4 z-50 bg-accent/80 text-accent-foreground font-bold font-code border-2 border-accent shadow-[0_0_10px_theme(colors.accent),0_0_20px_theme(colors.accent)] hover:bg-accent hover:text-black hover:shadow-[0_0_15px_theme(colors.accent),0_0_30px_theme(colors.accent)] transition-all duration-300"
        >
          GEÇ
        </Button>

        <main className="scene">
            <div className="cube" ref={mainCubeRef}>
                <div className="cube-face front"></div>
                <div className="cube-face back"></div>
                <div className="cube-face right"></div>
                <div className="cube-face left"></div>
                <div className="cube-face top"></div>
                <div className="cube-face bottom"></div>
            </div>

            <div className="orbit-cubes">
                <div className="mini-cube m1"></div>
                <div className="mini-cube m2"></div>
                <div className="mini-cube m3"></div>
                <div className="mini-cube m4"></div>
                <div className="mini-cube m5"></div>
                <div className="mini-cube m6"></div>
            </div>

            <div className="text-container">
                <h1 className="nslab-title">MathCyber</h1>
            </div>
        </main>
        
        <div className="system-log">
            <span className="log-line">YAĞMUR HER ZAMAN <span className="log-highlight">AÇIK</span></span>
            <span className="log-line">MOD <span className="log-highlight">RENKLİ</span></span>
            <span className="log-line">DÖNÜŞÜ <span className="log-highlight">KULLANICI DÖNDÜRÜR</span></span>
        </div>

      </div>

      <style jsx>{`
        :root {
            --bg-color: #050505;
            --cube-border: rgba(0, 255, 255, 0.2);
            --text-color: #ffffff;
            --accent-color-glow: hsl(var(--accent));
        }
        .scene {
            position: relative;
            width: 400px;
            height: 400px;
            transform-style: preserve-3d;
            transition: transform 0.1s ease-out; 
        }
        .cube {
            width: 100%;
            height: 100%;
            position: absolute;
            transform-style: preserve-3d;
        }
        .cube-face {
            position: absolute;
            width: 400px;
            height: 400px;
            border: 2px solid var(--cube-border);
            background: rgba(0, 0, 0, 0.15);
            box-shadow: 0 0 15px rgba(0, 255, 255, 0.1) inset;
            display: flex;
            justify-content: center;
            align-items: center;
            backface-visibility: visible;
        }
        .front  { transform: rotateY(0deg) translateZ(200px); }
        .back   { transform: rotateY(180deg) translateZ(200px); }
        .right  { transform: rotateY(90deg) translateZ(200px); }
        .left   { transform: rotateY(-90deg) translateZ(200px); }
        .top    { transform: rotateX(90deg) translateZ(200px); }
        .bottom { transform: rotateX(-90deg) translateZ(200px); }
        .orbit-cubes {
            position: absolute;
            width: 100%;
            height: 100%;
            transform-style: preserve-3d;
            animation: rotateOrbit 60s linear infinite; 
        }
        .mini-cube {
            position: absolute;
            width: 40px;
            height: 40px;
            top: 50%;
            left: 50%;
            margin-top: -20px;
            margin-left: -20px;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.4);
            box-shadow: 0 0 10px rgba(255,255,255,0.2);
        }
        .m1 { transform: rotateY(0deg) translateZ(300px); }
        .m2 { transform: rotateY(60deg) translateZ(300px); }
        .m3 { transform: rotateY(120deg) translateZ(300px); }
        .m4 { transform: rotateY(180deg) translateZ(300px); }
        .m5 { transform: rotateY(240deg) translateZ(300px); }
        .m6 { transform: rotateY(300deg) translateZ(300px); }
        .text-container {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) translateZ(50px);
            text-align: center;
            z-index: 10;
            pointer-events: none;
        }
        .nslab-title {
            font-family: 'Space Grotesk', sans-serif;
            font-size: 5rem;
            font-weight: 700;
            color: #ffffff;
            letter-spacing: 4px;
            line-height: 1;
            text-shadow: 
                0 0 5px #fff,
                0 0 10px #fff,
                0 0 20px var(--accent-color-glow),
                0 0 40px var(--accent-color-glow),
                0 0 80px var(--accent-color-glow);
            animation: textPulse 3s infinite ease-in-out;
        }
        .system-log {
            position: fixed;
            bottom: 20px;
            right: 20px;
            font-family: 'Source Code Pro', monospace;
            color: rgba(255, 255, 255, 0.7);
            font-size: 0.75rem;
            text-align: right;
            line-height: 1.5;
            z-index: 100;
            pointer-events: none;
            background: rgba(0,0,0,0.3);
            padding: 10px;
            border-left: 2px solid var(--accent-color-glow);
        }
        .log-line { display: block; }
        .log-highlight {
            color: var(--accent-color-glow);
            font-weight: bold;
        }
        @keyframes rotateOrbit {
            0% { transform: rotateX(0deg) rotateY(0deg); }
            100% { transform: rotateX(-360deg) rotateY(-360deg); }
        }
        @keyframes textPulse {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.05); opacity: 0.9; }
        }
        @media (max-width: 600px) {
            .nslab-title { font-size: 3.5rem; }
            .cube, .cube-face { width: 280px; height: 280px; }
            .front  { transform: rotateY(0deg) translateZ(140px); }
            .back   { transform: rotateY(180deg) translateZ(140px); }
            .right  { transform: rotateY(90deg) translateZ(140px); }
            .left   { transform: rotateY(-90deg) translateZ(140px); }
            .top    { transform: rotateX(90deg) translateZ(140px); }
            .bottom { transform: rotateX(-90deg) translateZ(140px); }
            .m1, .m2, .m3, .m4, .m5, .m6 { display: none; }
        }
      `}</style>
    </>
  );
}
