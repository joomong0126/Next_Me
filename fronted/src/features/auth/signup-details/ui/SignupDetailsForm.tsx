import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/shadcn/card';
import { Button } from '@/shared/ui/shadcn/button';
import { Input } from '@/shared/ui/shadcn/input';
import { Label } from '@/shared/ui/shadcn/label';
import { Badge } from '@/shared/ui/shadcn/badge';
import type { SignupMethod } from '@/features/auth/signup-method';

const STATUS_OPTIONS = ['대학생', '취업준비생', '직장인', '프리랜서'] as const;
const GOAL_OPTIONS = ['마케터', '개발자 백엔드', '개발자 프론트'] as const;

type StatusOption = (typeof STATUS_OPTIONS)[number];
type GoalOption = (typeof GOAL_OPTIONS)[number];

export interface SignupDetailsFormValues {
  method: SignupMethod | null;
  email?: string;
  password?: string;
  name: string;
  phone: string;
  status: StatusOption | null;
  goals: GoalOption[];
}

interface SignupDetailsFormProps {
  defaultMethod: SignupMethod | null;
  defaultEmail?: string;
  defaultName?: string;
  onSubmit: (values: SignupDetailsFormValues) => void;
  isSubmitting?: boolean;
  submitError?: string | null;
}

const EMAIL_MOCK_VALUES = {
  email: 'mock.user@example.com',
  password: 'mockpass123',
  confirmPassword: 'mockpass123',
};

const COMMON_MOCK_VALUES = {
  name: '모크 유저',
  phone: '010-1234-5678',
  status: '직장인' as StatusOption,
  goals: ['마케터'] as GoalOption[],
};

export function SignupDetailsForm({
  defaultMethod,
  defaultEmail,
  defaultName,
  onSubmit,
  isSubmitting = false,
  submitError,
}: SignupDetailsFormProps) {
  const isGoogleSignup = defaultMethod === 'google';

  const [email, setEmail] = useState(defaultEmail ?? '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState(defaultName ?? '');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState<StatusOption | null>(null);
  const [goals, setGoals] = useState<GoalOption[]>([]);
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [phoneVerificationError, setPhoneVerificationError] = useState<string | null>(null);

  useEffect(() => {
    if (isGoogleSignup && defaultEmail) {
      setEmail(defaultEmail);
    }
  }, [isGoogleSignup, defaultEmail]);

  const toggleGoal = (goal: GoalOption) => {
    setGoals((prev) => (prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal]));
  };

  const applyMockValues = () => {
    if (!isGoogleSignup) {
      setEmail(EMAIL_MOCK_VALUES.email);
      setPassword(EMAIL_MOCK_VALUES.password);
      setConfirmPassword(EMAIL_MOCK_VALUES.confirmPassword);
    } else {
      setPassword('');
      setConfirmPassword('');
    }
    setName(defaultName ?? COMMON_MOCK_VALUES.name);
    setPhone(COMMON_MOCK_VALUES.phone);
    setStatus(COMMON_MOCK_VALUES.status);
    setGoals(COMMON_MOCK_VALUES.goals);
    setIsPhoneVerified(true);
    setPhoneVerificationError(null);
  };

  const confirmFilled = confirmPassword.trim() !== '';
  const passwordsMatch = isGoogleSignup || !confirmFilled ? true : password === confirmPassword;

  const handlePhoneVerify = () => {
    if (phone.trim() === '') {
      setIsPhoneVerified(false);
      setPhoneVerificationError('전화번호를 입력한 후 인증을 진행해 주세요.');
      return;
    }

    setIsPhoneVerified(true);
    setPhoneVerificationError(null);
  };

  const credentialsValid = useMemo(() => {
    if (isGoogleSignup) return true;
    return (
      email.trim() !== '' &&
      password.trim().length >= 6 &&
      confirmPassword.trim() !== '' &&
      password === confirmPassword
    );
  }, [isGoogleSignup, email, password, confirmPassword]);

  const canProceed = useMemo(() => {
    return (
      credentialsValid &&
      name.trim() !== '' &&
      phone.trim() !== '' &&
      status !== null &&
      goals.length > 0 &&
      isPhoneVerified
    );
  }, [credentialsValid, name, phone, status, goals, isPhoneVerified]);

  const handleSubmit = () => {
    if (!canProceed || isSubmitting) return;
    onSubmit({
      method: defaultMethod,
      email: isGoogleSignup ? email || defaultEmail || 'google.user@example.com' : email,
      password: isGoogleSignup ? undefined : password,
      name,
      phone,
      status,
      goals,
    });
  };

  return (
    <Card className="w-full max-w-2xl shadow-lg rounded-xl border-gray-200">
      <CardHeader className="space-y-3 pt-8 pb-6">
        <CardTitle className="text-gray-900 text-2xl font-semibold">회원 정보 입력</CardTitle>
        <CardDescription className="text-gray-600">
          맞춤 서비스를 제공하기 위해 기본 정보를 입력해 주세요.
        </CardDescription>
        {defaultMethod && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Badge variant="secondary" className="rounded-lg bg-gray-100 text-gray-700">
              {isGoogleSignup ? 'Google 계정' : '이메일 계정'}
            </Badge>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-6 pb-8">
        <div className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-lg border-gray-300 text-gray-600 hover:bg-gray-50"
            onClick={applyMockValues}
          >
            목업 데이터로 채우기
          </Button>
        </div>

        {isGoogleSignup ? (
          <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
            <p className="font-medium text-gray-900">연결된 Google 계정</p>
            <p>{email || defaultEmail || 'google-user@example.com'}</p>
            <p className="text-xs text-gray-500 mt-1">이메일은 Google 계정에서 자동으로 가져옵니다.</p>
          </div>
        ) : null}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {!isGoogleSignup && (
            <div className="space-y-2">
              <Label htmlFor="email">이메일</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-lg"
              />
            </div>
          )}
          {!isGoogleSignup && (
            <div className="space-y-2">
              <Label htmlFor="password">비밀번호</Label>
              <Input
                id="password"
                type="password"
                placeholder="6자 이상 입력하세요"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="rounded-lg"
              />
            </div>
          )}
          {!isGoogleSignup && (
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">비밀번호 확인</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="비밀번호를 다시 입력하세요"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="rounded-lg"
              />
              {confirmFilled && !passwordsMatch && (
                <p className="text-xs text-red-500">비밀번호가 일치하지 않습니다.</p>
              )}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="name">이름</Label>
            <Input
              id="name"
              placeholder="홍길동"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-lg"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">전화번호</Label>
            <div className="flex gap-2">
              <Input
                id="phone"
                type="tel"
                placeholder="010-0000-0000"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  setIsPhoneVerified(false);
                  setPhoneVerificationError(null);
                }}
                className="rounded-lg"
              />
              <Button
                type="button"
                variant="outline"
                className="rounded-lg border-gray-300 text-gray-700 hover:bg-gray-50"
                onClick={handlePhoneVerify}
              >
                {isPhoneVerified ? '재인증' : '인증하기'}
              </Button>
            </div>
            {phoneVerificationError ? (
              <p className="text-xs text-red-500">{phoneVerificationError}</p>
            ) : (
              <p className={`text-xs ${isPhoneVerified ? 'text-emerald-600' : 'text-gray-500'}`}>
                {isPhoneVerified ? '전화번호 인증이 완료되었습니다.' : '인증하기 버튼을 눌러 전화번호를 확인해주세요.'}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-gray-900 text-sm font-medium">현재 상태</Label>
          </div>
          <div className="flex flex-wrap gap-2">
            {STATUS_OPTIONS.map((option) => (
              <Button
                key={option}
                type="button"
                variant={status === option ? 'default' : 'outline'}
                className={`rounded-lg ${
                  status === option
                    ? 'bg-gray-900 hover:bg-gray-800 text-white'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
                onClick={() => setStatus(option)}
              >
                {option}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-gray-900 text-sm font-medium">목표 직무</Label>
            <span className="text-xs text-gray-500">현재 활성화된 직무 3개</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {GOAL_OPTIONS.map((goal) => {
              const selected = goals.includes(goal);
              return (
                <Button
                  key={goal}
                  type="button"
                  variant={selected ? 'default' : 'outline'}
                  className={`rounded-lg ${
                    selected
                      ? 'bg-gray-900 hover:bg-gray-800 text-white'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                  onClick={() => toggleGoal(goal)}
                >
                  {goal}
                </Button>
              );
            })}
          </div>
          {goals.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {goals.map((goal) => (
                <Badge key={goal} variant="secondary" className="rounded-lg bg-accent text-accent-foreground">
                  {goal}
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div className="pt-4 space-y-2">
          <Button
            onClick={handleSubmit}
            disabled={!canProceed || isSubmitting}
            className="w-full rounded-lg bg-gray-900 hover:bg-gray-800 text-white disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
          >
            {isSubmitting ? '저장 중...' : '다음'}
          </Button>
          {submitError ? <p className="text-sm text-red-500 text-center">{submitError}</p> : null}
          <p className="text-xs text-gray-500 text-center">입력하신 정보는 온보딩 과정에서 활용됩니다.</p>
        </div>
      </CardContent>
    </Card>
  );
}

