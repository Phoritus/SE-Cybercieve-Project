import React from 'react';
import { Link } from 'react-router-dom';
import logoHome from '../assets/logo_home.svg';
import logoNavbar from '../assets/logo_navbar.svg';

const Home: React.FC = () => {
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
              className="rounded-md px-3 py-1.5 font-medium text-slate-400 transition-colors hover:text-slate-200"
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

      <main className="relative z-10 flex min-h-[calc(100vh-4rem)] items-center justify-center px-6">
        <section className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <img src={logoHome} alt="CyberSieve logo" className="mb-8 h-24 w-24 sm:h-28 sm:w-28 drop-shadow-[0_0_24px_rgba(59,130,246,0.35)]" />

          <h1 className="max-w-3xl text-3xl font-semibold tracking-tight text-slate-50 sm:text-5xl">
            Scan Files &amp; URLs for Malware
            <br className="hidden sm:block" />
            Get Actionable Advice Instantly
          </h1>

          <p className="mt-5 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">
            Detect malware, ransomware, and suspicious files
            <br className="hidden sm:block" />
            No installation • Fast • Privacy-first
          </p>

          <Link
            to="/login"
            className="mt-10 inline-flex items-center rounded-lg bg-blue-500 px-8 py-3 text-base font-medium text-white shadow-[0_10px_30px_rgba(59,130,246,0.35)] transition hover:-translate-y-0.5 hover:bg-blue-400"
          >
            Scan Now
          </Link>
        </section>
      </main>
    </div>
  );
};

export default Home;
