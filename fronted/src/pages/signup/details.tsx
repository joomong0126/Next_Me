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
  const [requiresEmailConfirmation, setRequiresEmailConfirmation] = useState(false);
  const [signupEmail, setSignupEmail] = useState<string | null>(null);

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
    setRequiresEmailConfirmation(false);
    try {
      const result = await api.auth.signup(payload);
      setRecentUser(result.user);
      persistProfile(result.user);
      await queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
      setIsComplete(true);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '회원가입에 실패했습니다.';
      
      // 회원가입 성공했지만 자동 로그인에 실패한 경우
      // 수동 로그인을 자동으로 시도
      if (
        errorMessage.includes('자동 로그인에 실패') ||
        errorMessage.includes('로그인을 시도해주세요') ||
        errorMessage.includes('로그인 페이지에서 직접 로그인')
      ) {
        // 회원가입은 성공했지만 세션이 없는 경우
        // 자동으로 로그인을 시도합니다 (여러 번 재시도)
        let loginSuccess = false;
        for (let attempt = 1; attempt <= 3 && !loginSuccess; attempt++) {
          try {
            console.log(`[signup] Attempting manual login (${attempt}/3)...`);
            
            // 약간의 지연 시간
            if (attempt > 1) {
              await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
            }
            
            const loginResult = await api.auth.login({
              email: payload.email,
              password: payload.password || '',
            });
            
            // 로그인 성공!
            console.log('[signup] ✅ Manual login successful!');
            setRecentUser(loginResult.user);
            persistProfile(loginResult.user);
            await queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
            setIsComplete(true);
            loginSuccess = true;
            break;
          } catch (loginError) {
            console.warn(`[signup] Login attempt ${attempt} failed:`, loginError);
            if (attempt === 3) {
              // 모든 시도 실패 - 이메일 확인 안내 표시
              setSubmitError(null);
              setRequiresEmailConfirmation(true);
              setSignupEmail(payload.email);
              setIsComplete(true);
            }
          }
        }
        
        if (loginSuccess) {
          // 로그인 성공했으므로 더 이상 처리할 필요 없음
          return;
        }
      } else if (
        errorMessage.includes('이메일 확인이 필요') ||
        errorMessage.includes('이메일을 확인하고 링크를 클릭') ||
        errorMessage.includes('이메일을 확인하고 링크를 클릭하여 계정을 활성화')
      ) {
        // 이메일 확인이 필요한 경우
        setSubmitError(null);
        setRequiresEmailConfirmation(true);
        setSignupEmail(payload.email);
        setIsComplete(true);
      } else {
        setSubmitError(errorMessage);
      }
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
    // 이메일 확인이 필요한 경우 로그인 페이지로 이동, 아니면 앱으로 이동
    if (requiresEmailConfirmation) {
      navigate('/login', { replace: true });
    } else {
      navigate('/app', { replace: true });
    }
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
        requiresEmailConfirmation={requiresEmailConfirmation}
        email={signupEmail}
      />
    </div>
  );
}