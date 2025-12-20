import React from 'react';
import { UpdatePasswordForm } from '@/src/components/update-password-form';

const UpdatePassword: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-sm">
        <UpdatePasswordForm />
      </div>
    </div>
  );
};

export default UpdatePassword;
