import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { SignupDetailsForm, SignupDetailsFormValues } from '@/features/auth/signup-details';
import type { SignupContinuationPayload } from '@/features/auth/signup-method';
import { SignupCompleteDialog } from '@/widgets/signup';
import { api } from '@/shared/api';
import type { AuthUser, SignupInput } from '@/shared/api/contracts';

export default function SignupDetailsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { state } = useLocation() as { state?: SignupContinuationPayload };
  const method = state?.method ?? null;
  const googleProfile = state?.googleProfile;
  const [isComplete, setIsComplete] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recentUser, setRecentUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    if (!method) {
      navigate('/signup', { replace: true });
      return;
    }
    if (method === 'google' && !googleProfile) {
      navigate('/signup', { replace: true });
    }
  }, [method, googleProfile, navigate]);

  const persistProfile = (user: AuthUser) => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('userProfile', JSON.stringify(user));
    window.localStorage.setItem('onboardingCompleted', 'true');
  };

  const handleSubmit = async (values: SignupDetailsFormValues) => {
    if (!values.method) {
      return;
    }
    if (!values.email && !googleProfile?.email) {
      setSubmitError('이메일 정보가 필요합니다.');
      return;
    }
    if (!values.status) {
      setSubmitError('현재 상태를 선택해 주세요.');
      return;
    }

    const payload: SignupInput = {
      method: values.method,
      email: values.email ?? googleProfile?.email ?? '',
      password: values.password,
      name: values.name,
      phone: values.phone,
      status: values.status,
      goals: values.goals,
    };

    setSubmitError(null);
    setIsSubmitting(true);
    try {
      const result = await api.auth.signup(payload);
      setRecentUser(result.user);
      persistProfile(result.user);
      await queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
      setIsComplete(true);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : '회원가입에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDialogStart = () => {
    setIsComplete(false);
    navigate('/app', { replace: true });
  };

  const handleDialogClose = () => {
    setIsComplete(false);
    navigate('/app', { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center p-4">
      <SignupDetailsForm
        defaultMethod={method}
        defaultEmail={googleProfile?.email}
        defaultName={googleProfile?.name}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        submitError={submitError}
      />
      <SignupCompleteDialog
        open={isComplete}
        onProceed={handleDialogStart}
        onClose={handleDialogClose}
        userName={recentUser?.name}
      />
    </div>
  );
}