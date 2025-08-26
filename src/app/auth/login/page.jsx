'use client';

import { useState } from 'react';
import { supabase } from '@/utils/supabase/client'; // your client.js singleton
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function LoginPage() {
  const [mode, setMode] = useState('sign-in'); // 'sign-in' | 'sign-up'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setErr(''); setMsg('');

    if (mode === 'sign-in') {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setErr(error.message);
      else window.location.href = '/dashboard';
    } else {
      const { error, data } = await supabase.auth.signUp({
        email,
        password,
        // If email confirmations are enabled, Supabase may require verification
        options: { emailRedirectTo: `${location.origin}/` }
      });
      if (error) setErr(error.message);
      else setMsg(data.user?.confirmed_at ? 'Account created. Redirecting…' : 'Sign-up successful. Check your email to confirm.');
      if (data.user?.confirmed_at) window.location.href = '/dashboard';
    }
  }

  return (
    <main className="min-h-dvh grid place-items-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{mode === 'sign-in' ? 'Sign in' : 'Create account'}</CardTitle>
            <Button
              variant="ghost"
              type="button"
              onClick={() => setMode(m => (m === 'sign-in' ? 'sign-up' : 'sign-in'))}
            >
              {mode === 'sign-in' ? 'Need an account?' : 'Have an account?'}
            </Button>
          </div>
          <CardDescription>
            {mode === 'sign-in'
              ? 'Use your email and password.'
              : 'Register with email and a strong password.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required value={email} onChange={e=>setEmail(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" minLength={6} required value={password} onChange={e=>setPassword(e.target.value)} />
            </div>
            {err && <p className="text-sm text-red-600">{err}</p>}
            {msg && <p className="text-sm text-green-600">{msg}</p>}
            <Button type="submit">{mode === 'sign-in' ? 'Sign in' : 'Sign up'}</Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
