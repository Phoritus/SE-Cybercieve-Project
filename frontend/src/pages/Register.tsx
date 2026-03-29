import React from 'react';

import { SignUpForm } from '@/src/components/sign-up-form';
import logoHome from '@/src/assets/logo_navbar.svg';
import { SimpleNavbar } from '@/src/components/navbar';

const Register: React.FC = () => {
  return (
    <div
      className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100"
      style={{ fontFamily: '"Afacad", "Segoe UI", sans-serif' }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(59,130,246,0.16),transparent_45%),radial-gradient(circle_at_80%_80%,rgba(30,64,175,0.16),transparent_40%)]" />

      <SimpleNavbar isSticky={false} />
      <main className="relative z-10 flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-10">
        <div className="w-full max-w-2xl text-center">
          <img
            src={logoHome}
            alt="CyberSieve logo"
            style={{ width: '55px', height: '64.25px' }}
            className="mx-auto mb-5 drop-shadow-[0_0_24px_rgba(65,128,227,0.8)]"
          />

          <h1 className="text-4xl font-semibold tracking-tight text-slate-50 sm:text-[2.75rem]">
            <span className="text-blue-500">Sign</span> up
          </h1>
          <p className="mt-2.5 text-base text-slate-300">Create a new account</p>

          <div className="mx-auto mt-6 w-full max-w-[430px]">
            <SignUpForm />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Register;
