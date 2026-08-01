import React, { useEffect, useState } from 'react';
import { LoaderIcon } from 'lucide-react';

export default function MainContentLoader({ open = false, duration = 800 }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!open) {
      setProgress(0);
      return;
    }
    setProgress(5);
    const start = Date.now();
    const tick = 50;
    const timer = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min(95, Math.round((elapsed / duration) * 100));
      setProgress(pct);
    }, tick);
    return () => clearInterval(timer);
  }, [open, duration]);

  if (!open) return null;

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
      <div className="w-full h-full bg-transparent flex items-center justify-center">
        <div className="relative z-30 flex flex-col items-center gap-4 p-4">
          <LoaderIcon className="w-24 h-24 text-black animate-spin" role="status" aria-label="Loading" />
          <div className="w-[60%] max-w-lg">
            <div className="w-full h-2 rounded-full bg-black/10 overflow-hidden">
              <div className="h-full bg-black" style={{ width: `${progress}%`, transition: 'width 120ms linear' }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
