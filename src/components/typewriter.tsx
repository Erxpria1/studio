"use client";

import { useState, useEffect } from "react";

type TypewriterProps = {
  text: string;
  speed?: number;
  onComplete?: () => void;
  className?: string;
};

export function Typewriter({ text, speed = 20, onComplete, className }: TypewriterProps) {
  const [displayedText, setDisplayedText] = useState("");

  useEffect(() => {
    let isMounted = true;
    if (!text) {
        if (onComplete) onComplete();
        return;
    };
    
    // Only start typing if the displayed text is not the full text yet.
    if (displayedText.length === text.length) {
      if(onComplete) onComplete();
      return;
    }
    
    let i = displayedText.length;
    const intervalId = setInterval(() => {
      if (!isMounted) {
        clearInterval(intervalId);
        return;
      }

      if (i < text.length) {
        setDisplayedText((prev) => prev + text.charAt(i));
        i++;
      } else {
        clearInterval(intervalId);
        if (onComplete) {
          onComplete();
        }
      }
    }, speed);

    return () => {
        isMounted = false;
        clearInterval(intervalId);
    }
  }, [text, speed, onComplete, displayedText.length]);

  return (
    <div className={className}>
      <p className="whitespace-pre-wrap font-code">
        {displayedText}
      </p>
    </div>
  );
}
