'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase';
import { HU } from '@/lib/design';
import { Btn, Icon, FoodImg } from '@/components/ui';

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'register'>('register');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (mode === 'register') {
      const { error: err } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name },
          emailRedirectTo: `${window.location.origin}/`,
        },
      });
      if (err) { setError(err.message); }
      else {
        // Auto-login después del registro (si no requiere confirmación de email)
        const { error: loginErr } = await supabase.auth.signInWithPassword({ email, password });
        if (!loginErr) {
          window.location.href = '/onboarding';
          return;
        }
        setSuccess('Revisa tu email para confirmar tu cuenta.');
      }
    } else {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password });
      if (err) { setError(err.message); }
      else { window.location.href = '/'; }
    }

    setLoading(false);
  }

  return (
    <div style={{ minHeight: '100vh', background: HU.cream, display: 'flex', flexDirection: 'column' }}>
      {/* Hero */}
      <div style={{ position: 'relative', height: 280, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(100% 80% at 50% 20%, ${HU.leaf}33, transparent), linear-gradient(180deg, ${HU.creamWarm}, ${HU.cream})` }} />
        <div style={{ position: 'absolute', top: 60, left: 30, width: 140, height: 140, borderRadius: '50%', overflow: 'hidden', boxShadow: '0 20px 60px rgba(30,58,95,.15)' }}>
          <FoodImg label="bowl" tone="leaf" ratio="1/1" />
        </div>
        <div style={{ position: 'absolute', top: 40, right: 20, width: 100, height: 100, borderRadius: '50%', overflow: 'hidden', boxShadow: '0 10px 30px rgba(30,58,95,.12)' }}>
          <FoodImg label="salad" tone="sun" ratio="1/1" />
        </div>
        <div style={{ position: 'absolute', top: 170, right: 60, width: 80, height: 80, borderRadius: '50%', overflow: 'hidden' }}>
          <FoodImg tone="coral" ratio="1/1" />
        </div>
      </div>

      {/* Form */}
      <div style={{ padding: '0 28px 40px', flex: 1 }}>
        <div style={{ fontFamily: HU.mono, fontSize: 11, letterSpacing: 1.2, color: HU.leaf, textTransform: 'uppercase', marginBottom: 12 }}>
          {mode === 'register' ? 'Bienvenida a Health Up' : 'Bienvenida de vuelta'}
        </div>
        <h1 style={{ fontFamily: HU.display, fontSize: 34, fontWeight: 500, color: HU.ink, lineHeight: 1.05, letterSpacing: -1, margin: '0 0 8px' }}>
          Comer bien con <em style={{ fontStyle: 'italic', color: HU.leaf }}>tu</em> GLP-1.
        </h1>
        <p style={{ fontFamily: HU.sans, fontSize: 14, color: HU.mute, lineHeight: 1.5, margin: '0 0 24px' }}>
          Plan semanal, recetas y tracking de dosis — todo calibrado a tu cuerpo.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {mode === 'register' && (
            <input
              type="text" placeholder="Tu nombre" value={name} onChange={e => setName(e.target.value)}
              required
              style={{
                height: 48, padding: '0 16px', borderRadius: 14, border: `1px solid ${HU.line}`,
                background: HU.paper, fontFamily: HU.sans, fontSize: 15, color: HU.ink, outline: 'none',
              }}
            />
          )}
          <input
            type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)}
            required
            style={{
              height: 48, padding: '0 16px', borderRadius: 14, border: `1px solid ${HU.line}`,
              background: HU.paper, fontFamily: HU.sans, fontSize: 15, color: HU.ink, outline: 'none',
            }}
          />
          <input
            type="password" placeholder="Contraseña (min 6 caracteres)" value={password}
            onChange={e => setPassword(e.target.value)}
            required minLength={6}
            style={{
              height: 48, padding: '0 16px', borderRadius: 14, border: `1px solid ${HU.line}`,
              background: HU.paper, fontFamily: HU.sans, fontSize: 15, color: HU.ink, outline: 'none',
            }}
          />

          {error && (
            <div style={{ fontFamily: HU.sans, fontSize: 13, color: HU.coral, padding: '8px 12px', background: `${HU.coral}14`, borderRadius: 10 }}>
              {error}
            </div>
          )}
          {success && (
            <div style={{ fontFamily: HU.sans, fontSize: 13, color: HU.leafDeep, padding: '8px 12px', background: `${HU.leaf}14`, borderRadius: 10 }}>
              {success}
            </div>
          )}

          <Btn type="submit" variant="primary" size="lg" loading={loading} style={{ width: '100%', marginTop: 8 }}>
            {mode === 'register' ? 'Crear cuenta' : 'Entrar'}
          </Btn>
        </form>

        <div
          onClick={() => { setMode(mode === 'register' ? 'login' : 'register'); setError(''); }}
          style={{ textAlign: 'center', fontFamily: HU.sans, fontSize: 13, color: HU.mute, marginTop: 16, cursor: 'pointer' }}
        >
          {mode === 'register' ? 'Ya tengo cuenta · ' : '¿No tienes cuenta? · '}
          <span style={{ color: HU.ink, fontWeight: 600 }}>
            {mode === 'register' ? 'Entrar' : 'Crear cuenta'}
          </span>
        </div>
      </div>
    </div>
  );
}
