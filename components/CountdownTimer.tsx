'use client';

import { useEffect, useState } from 'react';
import { REVALIDATE_TIME } from '@/lib/constants';

function getSecondsUntilNextUpdate(): number {
  const now = new Date();
  const elapsed = (now.getMinutes() * 60 + now.getSeconds()) % REVALIDATE_TIME;
  return REVALIDATE_TIME - elapsed;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function CountdownTimer() {
  const [seconds, setSeconds] = useState<number | null>(null);

  useEffect(() => {
    setSeconds(getSecondsUntilNextUpdate());
    const timer = setInterval(() => {
      setSeconds(getSecondsUntilNextUpdate());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (seconds === null) return null;

  return (
    <div className="mt-2 flex items-center gap-1 text-xs text-orange-600 font-medium">
      <span>⏰</span>
      <span>更新まで {formatTime(seconds)}</span>
    </div>
  );
}
