import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { login } from '@/features/auth/authSlice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router';

export default function LoginPage() {
  const dispatch = useDispatch();
  const auth = useSelector((state) => state.auth);
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (auth.status === 'succeeded' && auth.token) {
      if (auth.user) {
        try { localStorage.setItem('user', JSON.stringify(auth.user)); } catch (err) { void err; }
      }
      toast.success('Logged in');
      navigate('/app/pos');
    }
    if (auth.status === 'failed') {
      toast.error(auth.error || 'Login failed');
    }
  }, [auth.status, auth.token, auth.user, auth.error, navigate]);

  async function handleSubmit(event) {
    event.preventDefault();
    dispatch(login({ email: email.trim(), password }));
  }

  const loading = auth.status === 'loading';

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f7f2f2] px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-3xl border bg-white p-8 shadow-lg">
        <h3 className="text-2xl font-black mb-4">Sign in</h3>
        <div className="mb-4 space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" />
        </div>
        <div className="mb-6 space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="••••••" />
        </div>
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'Signing in...' : 'Sign in'}
        </Button>
      </form>
    </div>
  );
}
