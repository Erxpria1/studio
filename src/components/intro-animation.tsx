'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function IntroAnimation({ onComplete }: { onComplete: () => void }) {
  const [showSkip, setShowSkip] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);

  const handleComplete = () => {
    setFadingOut(true);
    setTimeout(onComplete, 500); // Wait for fade out animation
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      handleComplete();
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const handleInteraction = () => {
    if (!showSkip) {
      setShowSkip(true);
    }
  };

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center bg-background transition-opacity duration-500",
        fadingOut ? "opacity-0" : "opacity-100"
      )}
      onClick={handleInteraction}
    >
      {showSkip && !fadingOut && (
        <Button
          onClick={(e) => {
            e.stopPropagation(); // Prevent parent div's onClick
            handleComplete();
          }}
          className="absolute top-4 right-4 z-10 bg-accent text-accent-foreground hover:bg-accent/80"
        >
          Geç
        </Button>
      )}

      <div className="relative flex h-48 w-48 items-center justify-center">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="absolute h-full w-full rounded-full border-primary"
            style={{
              borderWidth: `${2 + i * 2}px`,
              animation: `pulse 2s ease-in-out infinite ${i * 0.2}s`,
              opacity: 0.8 - i * 0.2,
            }}
          />
        ))}
        <div className="font-headline text-lg text-primary animate-pulse">
          MathCyber
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            transform: scale(0.8);
            opacity: 0.5;
          }
          50% {
            transform: scale(1.1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
