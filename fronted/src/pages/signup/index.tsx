import { useNavigate } from 'react-router-dom';
import { SignupIntroCard } from '@/widgets/signup';
import type { SignupContinuationPayload } from '@/features/auth/signup-method';

export default function SignupPage() {
  const navigate = useNavigate();

  const handleContinue = (payload: SignupContinuationPayload) => {
    navigate('/signup/details', { state: payload });
  };

  const handleLoginNavigate = () => {
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center p-4">
      <SignupIntroCard onContinue={handleContinue} onLoginClick={handleLoginNavigate} />
    </div>
  );
}

