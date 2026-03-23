'use client';

import { useEffect, useState } from 'react';

function getSecondsUntilNextUpdate(): number {
  const now = new Date();
  const next = new Date();
  next.setHours(6, 0, 0, 0);
  if (now >= next) next.setDate(next.getDate() + 1);
  return Math.floor((next.getTime() - now.getTime()) / 1000);
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
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
