import React from 'react';
import { Link } from 'react-router-dom';
import { LoginForm } from '@/src/components/login-form';
import logoHome from '@/src/assets/logo_home.svg';
import logoNavbar from '@/src/assets/logo_navbar.svg';

const Login: React.FC = () => {
  return (
    <div
      className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100"
      style={{ fontFamily: '"Afacad", "Segoe UI", sans-serif' }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(59,130,246,0.16),transparent_45%),radial-gradient(circle_at_80%_80%,rgba(30,64,175,0.16),transparent_40%)]" />

      <header className="relative z-10 border-b border-slate-800 bg-slate-950/80 backdrop-blur-sm">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-medium text-slate-100">
            <img src={logoNavbar} alt="CyberSieve logo" className="h-5 w-5" />
            <h1 className="text-xl font-bold tracking-tight">
              <span className="text-blue-400">Cyber</span>Sieve
            </h1>
          </Link>

          <nav className="flex items-center gap-2 text-sm">
            <Link
              to="/login"
              className="rounded-md px-3 py-1.5 font-medium text-blue-400"
            >
              Log in
            </Link>
            <Link
              to="/register"
              className="rounded-md bg-blue-500 px-3 py-1.5 font-medium text-white shadow-[0_0_0_1px_rgba(255,255,255,0.1)_inset] transition hover:bg-blue-400"
            >
              Sign up
            </Link>
          </nav>
        </div>
      </header>

      <main className="relative z-10 flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-10">
        <div className="w-full max-w-2xl text-center">
          <img
            src={logoHome}
            alt="CyberSieve logo"
            className="mx-auto mb-5 h-12 w-12 sm:h-14 sm:w-14 drop-shadow-[0_0_16px_rgba(59,130,246,0.26)]"
          />

          <h1 className="text-4xl font-semibold tracking-tight text-slate-50 sm:text-[2.75rem]">
            <span className="text-blue-500">Welcome</span> Back
          </h1>
          <p className="mt-2.5 text-base text-slate-300">Enter your email below to login to your account</p>

          <div className="mx-auto mt-6 w-full max-w-[430px]">
            <LoginForm />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Login;
