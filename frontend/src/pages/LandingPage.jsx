import { useNavigate } from 'react-router';
import { Button } from '@/components/ui/button';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="landing-page min-h-screen relative overflow-hidden text-white">
      <div className="landing-page__flow" />
      <div className="landing-page__shape" />
      <div className="landing-page__shape landing-page__shape--alt" />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-20">
        <div className="mx-auto max-w-3xl rounded-[2rem] border border-white/15 bg-black/90 px-8 py-14 text-center shadow-2xl shadow-black/30">
          <div className="mb-8 inline-flex rounded-full bg-white/10 px-4 py-2 text-xs uppercase tracking-[0.35em] text-white/80">
            ENTERPRISE POS</div>
          <h1 className="text-4xl font-black uppercase leading-tight tracking-tight sm:text-5xl md:text-6xl">
            Start you <span className="text-[#d44744]">ENTERPRISE</span> NOW
          </h1>
          <p className="mt-6 max-w-2xl text-sm text-slate-200 sm:text-base">
            Launch your multi-tenant point-of-sale and ERP system with fast checkout, branch-aware access, and tenant security.
          </p>
          <div className="mt-10 flex justify-center">
            <Button onClick={() => navigate('/signup')} className="rounded-full bg-black px-8 py-3 text-base font-semibold text-white shadow-lg shadow-black/30 transition hover:bg-white hover:text-black">
              Sign Up
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
