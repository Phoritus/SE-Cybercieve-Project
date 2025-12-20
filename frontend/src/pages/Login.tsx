import React from 'react';
import { LoginForm } from '@/src/components/login-form';

const Login: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-sm">
        <LoginForm />
      </div>
    </div>
  );
};

export default Login;
