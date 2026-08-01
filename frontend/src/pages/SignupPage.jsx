import { useEffect, useState } from 'react';
import RouteLoader from '@/components/ui/RouteLoader';
import { useDispatch, useSelector } from 'react-redux';
import { signup } from '@/features/auth/authSlice';
import { Button } from '@/components/ui/button';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router';

export default function SignupPage() {
  const dispatch = useDispatch();
  const auth = useSelector((state) => state.auth);
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [showLoader, setShowLoader] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (auth.status === 'succeeded' && auth.token) {
      if (auth.user) {
        try { localStorage.setItem('user', JSON.stringify(auth.user)); } catch (err) { void err; }
      }
      toast.success('Admin account created');
      navigate('/app/pos');
    }
    if (auth.status === 'failed') {
      toast.error(auth.error || 'Signup failed');
    }
  }, [auth.status, auth.token, auth.user, auth.error, navigate]);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!name.trim()) {
      toast.error('Full name is required');
      return;
    }
    if (!email.trim().toLowerCase().endsWith('@admin.com')) {
      toast.error('Use an email ending with @admin.com for the initial admin signup');
      return;
    }
    if (!password.trim()) {
      toast.error('Password is required');
      return;
    }

    dispatch(signup({ fullName: name.trim(), email: email.trim(), password, role: 'ROLE_ADMIN' }));
  }

  const loading = auth.status === 'loading';

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#d44744] px-4 py-12">
      <form onSubmit={handleSubmit} className="w-full max-w-md rounded-3xl border border-white/15 bg-black/90 p-8 text-white shadow-2xl shadow-black/30">
        <h3 className="text-2xl font-black mb-6">Create your admin account</h3>
        <label className="mb-4 block text-sm text-white/80">
          <span className="mb-2 block">Full name</span>
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-white/40"
            placeholder="Jane Doe"
            required
          />
        </label>
        <label className="mb-4 block text-sm text-white/80">
          <span className="mb-2 block">Email</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-white/40"
            placeholder="name@admin.com"
            required
          />
        </label>
        <p className="mb-6 text-xs text-white/60">
          Only the initial administrator can sign up here. After login, you can create managers and cashiers from the Employees route.
        </p>
        <label className="mb-6 block text-sm text-white/80">
          <span className="mb-2 block">Password</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-white/40"
            placeholder="Create a password"
            required
          />
        </label>
        <Button type="submit" disabled={loading} className="w-full rounded-full bg-white px-4 py-3 font-semibold text-black transition hover:bg-slate-100">
          {loading ? 'Creating account...' : 'Sign Up'}
        </Button>
        <div className="mt-6 text-center text-sm text-slate-200">
          Already have an account?{' '}
          <button type="button" className="font-semibold text-white underline" onClick={() => setShowLoader(true)}>
            Sign in
          </button>
        </div>

      </form>

      {/* Route transition loader shown when user clicks "Sign in" */}
      <RouteLoader
        open={showLoader}
        initialBg={"radial-gradient(circle at 0 0, #ffffff29, #0000 18%), radial-gradient(circle at 100% 100%, #ffffff1a, #0000 20%), #d44744"}
        targetBg={'oklch(0.527 0.154 150.069)'}
        onComplete={() => { setShowLoader(false); navigate('/login'); }}
      />
      </form>
    </div>
  );
}
