import React from 'react';
import { Link } from 'react-router-dom';
import logoHome from '../assets/logo_navbar.svg';
import { HomeNavbar } from '../components/navbar';

const Home: React.FC = () => {
  return (
    <div
      className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100"
      style={{ fontFamily: '"Afacad", "Segoe UI", sans-serif' }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(59,130,246,0.16),transparent_45%),radial-gradient(circle_at_80%_80%,rgba(30,64,175,0.16),transparent_40%)]" />
      <HomeNavbar isSticky={false} />

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
