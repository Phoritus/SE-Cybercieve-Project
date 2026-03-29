import { vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LoginForm } from '@/src/components/login-form';

// Mock specific logic
vi.mock('@/src/api/supabaseClient', () => ({
  supabase: {
    auth: {
      // Return a promise that never resolves, so loading state persists indefinitely during test
      signInWithPassword: vi.fn(() => new Promise(() => { })),
      signInWithOAuth: vi.fn(),
    }
  }
}));

describe('LoginForm', () => {
  it('should render the login form', () => {
    render(
      <MemoryRouter>
        <LoginForm />
      </MemoryRouter>
    );

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it('first button should render Login and can click', () => {
    render(
      <MemoryRouter>
        <LoginForm />
      </MemoryRouter>
    );
    const allLoginButtons = screen.getAllByRole('button', { name: /^login/i });
    expect(allLoginButtons).toHaveLength(3);
  });
});
