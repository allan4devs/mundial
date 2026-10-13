'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Building2, Bus, CheckCircle2, Chrome, Compass, Hotel, Shield, Sparkles, UtensilsCrossed } from 'lucide-react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

const highlights = [
  'Reservas y disponibilidad en tiempo real para tours y excursiones',
  'Coordinación en un mismo panel para hoteles, restaurantes y transporte',
  'Automatizaciones para cadenas de partners turísticos y equipos comerciales',
];

const partnerSegments = [
  { icon: Hotel, label: 'Hoteles' },
  { icon: UtensilsCrossed, label: 'Restaurantes' },
  { icon: Bus, label: 'Transporte' },
  { icon: Building2, label: 'Agencias' },
];

export default function AuthLanding() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuth0Available, setIsAuth0Available] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadProviders() {
      try {
        const response = await fetch('/api/auth/providers', { cache: 'no-store' });
        if (!response.ok) {
          return;
        }

        const providers = (await response.json()) as Record<string, unknown>;
        if (isMounted) {
          setIsAuth0Available(Boolean(providers?.auth0));
        }
      } catch {
        // Keep default state to avoid blocking users when provider discovery fails.
      }
    }

    loadProviders();

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleCredentialsSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (mode === 'register') {
        const registerResponse = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password }),
        });

        if (!registerResponse.ok) {
          const data = await registerResponse.json().catch(() => ({}));
          setError(data.error ?? 'No se pudo crear la cuenta.');
          setIsSubmitting(false);
          return;
        }
      }

      const loginResult = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (loginResult?.error) {
        setError('Credenciales inválidas.');
        return;
      }

      router.push('/dashboard');
      router.refresh();
    } catch {
      setError('No fue posible completar la autenticación.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleAuth0GoogleLogin() {
    if (!isAuth0Available) {
      setError('Acceso con Google no disponible temporalmente. Inicia con correo y contraseña.');
      return;
    }

    await signIn('auth0', {
      callbackUrl: '/dashboard',
    });
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(34,197,94,0.3),transparent_40%),radial-gradient(circle_at_80%_0%,rgba(59,130,246,0.25),transparent_45%),radial-gradient(circle_at_50%_80%,rgba(16,185,129,0.2),transparent_50%)]" />
      <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-3xl" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-between px-5 py-6 sm:px-8 sm:py-8 lg:px-12">
        <header className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-base font-semibold tracking-tight text-slate-200 transition hover:text-white"
          >
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-400/20 text-emerald-300">
              <Sparkles className="h-4 w-4" />
            </span>
            La Vieja Adventures
          </Link>
          <Link
            href="/tours"
            className="hidden items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm text-slate-100 transition hover:border-white/40 hover:bg-white/10 sm:inline-flex"
          >
            Explorar tours
            <ArrowRight className="h-4 w-4" />
          </Link>
        </header>

        <section className="grid items-center gap-8 py-10 md:grid-cols-2 md:gap-12 lg:py-14">
          <div className="space-y-6 text-left">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-xs font-medium uppercase tracking-[0.18em] text-emerald-200">
              <Shield className="h-3.5 w-3.5" />
              Plataforma segura B2B/B2C
            </span>

            <h1 className="text-balance text-4xl font-semibold leading-tight text-white sm:text-5xl lg:text-6xl">
              Conecta tu ecosistema turístico en una sola plataforma.
            </h1>

            <p className="max-w-xl text-pretty text-base text-slate-300 sm:text-lg">
              Impulsa ventas y operación diaria para experiencias turísticas, cadenas hoteleras, restaurantes y
              aliados de transporte, con una experiencia de acceso moderna y confiable.
            </p>

            <div className="grid grid-cols-2 gap-3 sm:max-w-lg">
              {partnerSegments.map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-slate-100"
                >
                  <Icon className="h-4 w-4 text-emerald-300" />
                  <span>{label}</span>
                </div>
              ))}
            </div>

            <ul className="space-y-3">
              {highlights.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-slate-200 sm:text-base">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-3xl border border-white/15 bg-gradient-to-b from-white/15 to-white/5 p-5 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-7">
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.2em] text-emerald-200/90">Acceso partner</p>
                <h2 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">Entra a tu hub de reservas</h2>
              </div>

              <p className="text-sm text-slate-300 sm:text-base">
                Accede con correo o Google para centralizar disponibilidad, confirmaciones y coordinación con toda tu
                cadena turística.
              </p>

              <div className="grid grid-cols-3 gap-2 rounded-2xl border border-white/10 bg-slate-900/40 p-3 text-center text-xs text-slate-300">
                <div>
                  <p className="text-lg font-semibold text-emerald-300">24/7</p>
                  <p>Operación</p>
                </div>
                <div>
                  <p className="text-lg font-semibold text-sky-300">+1K</p>
                  <p>Reservas</p>
                </div>
                <div>
                  <p className="text-lg font-semibold text-cyan-300">360°</p>
                  <p>Partners</p>
                </div>
              </div>

              <form className="space-y-3" onSubmit={handleCredentialsSubmit}>
                {mode === 'register' && (
                  <input
                    type="text"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Nombre completo"
                    required
                    className="w-full rounded-xl border border-white/20 bg-black/20 px-4 py-3 text-sm text-white placeholder:text-slate-400 focus:border-emerald-300 focus:outline-none"
                  />
                )}
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Email"
                  required
                  className="w-full rounded-xl border border-white/20 bg-black/20 px-4 py-3 text-sm text-white placeholder:text-slate-400 focus:border-emerald-300 focus:outline-none"
                />
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Contraseña"
                  required
                  minLength={8}
                  className="w-full rounded-xl border border-white/20 bg-black/20 px-4 py-3 text-sm text-white placeholder:text-slate-400 focus:border-emerald-300 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex w-full items-center justify-center gap-3 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <Compass className="h-5 w-5" />
                  {isSubmitting
                    ? 'Procesando...'
                    : mode === 'register'
                      ? 'Crear cuenta e ingresar'
                      : 'Iniciar sesión con correo'}
                </button>
              </form>

              <button
                onClick={handleAuth0GoogleLogin}
                disabled={!isAuth0Available}
                className="inline-flex w-full items-center justify-center gap-3 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 disabled:cursor-not-allowed disabled:opacity-70 sm:text-base"
              >
                <Chrome className="h-5 w-5" />
                {isAuth0Available
                  ? 'Continuar con Google (Auth0)'
                  : 'Google (Auth0) no configurado'}
              </button>

              {error && <p className="text-sm text-rose-300">{error}</p>}

              <button
                onClick={() => {
                  setMode(mode === 'login' ? 'register' : 'login');
                  setError(null);
                }}
                className="block w-full text-center text-sm text-emerald-200 underline-offset-4 transition hover:text-emerald-100 hover:underline"
              >
                {mode === 'login' ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
              </button>

              <Link
                href="/auth/recover-password"
                className="block text-center text-sm text-emerald-200 underline-offset-4 transition hover:text-emerald-100 hover:underline"
              >
                ¿Olvidaste tu contraseña?
              </Link>

              <Link
                href="/b2b/login"
                className="block text-center text-sm text-emerald-200 underline-offset-4 transition hover:text-emerald-100 hover:underline"
              >
                ¿Eres operador? Inicia sesión en el portal B2B
              </Link>
            </div>
          </div>
        </section>

        <footer className="pt-2 text-center text-xs text-slate-400 sm:text-sm">
          © {new Date().getFullYear()} La Vieja Adventures. Todos los derechos reservados.
        </footer>
      </div>
    </main>
  );
}
