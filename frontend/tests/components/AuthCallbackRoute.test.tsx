import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AuthCallback from '@/src/pages/AuthCallback';
import api from '@/src/api/axios';
import { supabase } from '@/src/api/supabaseClient';

// Mock dependencies
vi.mock('@/src/api/supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(),
    },
  },
}));

vi.mock('@/src/context/AuthContext', () => ({
  useAuth: () => ({ login: vi.fn() }),
}));

vi.mock('@/src/api/axios', () => ({
  default: {
    post: vi.fn(),
  },
}));

const { mockedNavigate } = vi.hoisted(() => {
  return { mockedNavigate: vi.fn() }
});

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockedNavigate,
  };
});

describe('AuthCallback Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('syncs user and redirects to dashboard on session', async () => {
    const mockSession = {
      user: {
        id: '123',
        email: 'test@example.com',
        user_metadata: { full_name: 'Test User' },
      },
      access_token: 'fake-token',
    };

    vi.mocked(supabase.auth.getSession).mockResolvedValue({ data: { session: mockSession } } as any);
    vi.mocked(supabase.auth.onAuthStateChange).mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } } as any);
    (api.post as any).mockResolvedValue({});

    render(
      <MemoryRouter initialEntries={['/auth/callback']}>
        <Routes>
          <Route path="/auth/callback" element={<AuthCallback />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Processing Login...')).toBeInTheDocument();

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/register', expect.objectContaining({
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
      }));
      expect(mockedNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });
});
