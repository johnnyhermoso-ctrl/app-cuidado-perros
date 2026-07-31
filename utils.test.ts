'use client';

import { FormEvent, ReactNode, useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';
import { StatusMessage } from './StatusMessage';

export function AuthGate({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setLoading(false);
    });

    return () => data.subscription.unsubscribe();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSigningIn(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) setError('No se ha podido iniciar sesión. Revisa el correo y la contraseña.');
    setSigningIn(false);
  }

  if (loading) {
    return <main className="authPage"><p>Comprobando sesión…</p></main>;
  }

  if (!session) {
    return (
      <main className="authPage">
        <section className="card authCard">
          <div className="brand authBrand">🐶 Perros App</div>
          <h1>Acceso al panel</h1>
          <p className="muted">Solo pueden acceder usuarios creados por el administrador.</p>
          <form className="formGrid oneColumn" onSubmit={handleSubmit}>
            <label>
              Correo electrónico
              <input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
            </label>
            <label>
              Contraseña
              <input type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} />
            </label>
            <button className="button primary" disabled={signingIn}>
              {signingIn ? 'Accediendo…' : 'Entrar'}
            </button>
            {error ? <StatusMessage type="error" message={error} /> : null}
          </form>
        </section>
      </main>
    );
  }

  return <>{children}</>;
}
