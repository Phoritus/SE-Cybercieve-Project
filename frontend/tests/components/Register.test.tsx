import { render, screen } from '@testing-library/react';
import { SignUpForm } from '@/src/components/sign-up-form';

describe('RegisterForm', () => {
  it('should render the register form', () => {
    render(<SignUpForm />);
    
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    screen.debug();
    
    expect(screen.getByLabelText(/repeat password/i)).toBeInTheDocument();
    const allSignUpButtons = screen.getAllByRole('button', { name: /sign up/i });
    expect(allSignUpButtons).toHaveLength(3);

  });
});