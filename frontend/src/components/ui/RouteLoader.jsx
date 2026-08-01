import React, { useEffect, useState } from 'react';
import { LoaderIcon } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

// Full-screen route transition loader
export default function RouteLoader({
  open = false,
  initialBg = "radial-gradient(circle at 0 0, #ffffff29, #0000 18%), radial-gradient(circle at 100% 100%, #ffffff1a, #0000 20%), #d44744",
  targetBg = 'oklch(0.527 0.154 150.069)',
  onComplete = () => {},
  duration = 1200,
}) {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState(0); // 0=start,1=transition,2=done

  useEffect(() => {
    if (!open) return;
    setProgress(0);
    setPhase(0);

    const start = Date.now();
    const tick = 30;
    const timer = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min(100, Math.round((elapsed / duration) * 100));
      setProgress(pct);
      // kick phase at 40% and 85% to stagger background fades
      if (pct >= 40 && phase === 0) setPhase(1);
      if (pct >= 85 && phase < 2) setPhase(2);
      if (pct >= 100) {
        clearInterval(timer);
        // small delay to allow final fade
        setTimeout(() => {
          onComplete();
        }, 120);
      }
    }, tick);

    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  // overlay opacities based on phase
  const gradientOpacity = phase === 0 ? 1 : phase === 1 ? 0.6 : 0.15;
  const solidOpacity = phase === 0 ? 0 : phase === 1 ? 0.35 : 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Background layers */}
      <div
        aria-hidden
        className="absolute inset-0 transition-opacity duration-700"
        style={{
          background: initialBg,
          opacity: gradientOpacity,
          transitionProperty: 'opacity, background',
          transitionDuration: '700ms, 1200ms',
        }}
      />
      <div
        aria-hidden
        className="absolute inset-0 transition-opacity duration-900"
        style={{
          background: targetBg,
          opacity: solidOpacity,
          transitionProperty: 'opacity, background',
          transitionDuration: '900ms, 1200ms',
        }}
      />

      {/* Center content */}
      <div className="relative z-10 flex flex-col items-center gap-6">
        <LoaderIcon
          role="status"
          aria-label="Loading"
          className="w-40 h-40 text-white/95 animate-spin"
        />

        <div className="w-full flex justify-center">
          <div className="w-[60%] max-w-xl">
            <Progress value={progress} className="h-2 rounded-full bg-white/20" />
          </div>
        </div>
      </div>

      {/* subtle overlay to darken edges */}
      <div className="pointer-events-none absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.04), rgba(0,0,0,0.08))' }} />
    </div>
  );
}
