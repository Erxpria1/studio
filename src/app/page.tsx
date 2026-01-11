'use client';

import { useState } from 'react';
import { MathTerminal } from '@/components/math-terminal';
import { IntroAnimation } from '@/components/intro-animation';

export default function Home() {
  const [introComplete, setIntroComplete] = useState(false);

  if (!introComplete) {
    return <IntroAnimation onComplete={() => setIntroComplete(true)} />;
  }

  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-background p-4 font-headline">
      <MathTerminal />
    </main>
  );
}
