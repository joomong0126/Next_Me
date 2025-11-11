import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/shadcn/card';
import { SignupMethodSelector, type SignupContinuationPayload } from '@/features/auth/signup-method';

interface SignupIntroCardProps {
  onContinue: (payload: SignupContinuationPayload) => void;
  onLoginClick: () => void;
}

export function SignupIntroCard({ onContinue, onLoginClick }: SignupIntroCardProps) {
  return (
    <Card className="w-full max-w-md shadow-lg rounded-xl border-gray-200">
      <CardHeader className="space-y-2 text-center pt-8 pb-6">
        <CardTitle className="text-gray-900 text-2xl font-semibold">회원가입</CardTitle>
        <CardDescription className="text-gray-600">
          간편하게 시작하고 맞춤 커리어 서비스를 경험하세요.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <SignupMethodSelector onContinue={onContinue} />

        <div className="text-center text-sm text-gray-600">
          기존에 넥스트미를 사용하셨나요?{' '}
          <button type="button" className="text-gray-900 hover:underline" onClick={onLoginClick}>
            로그인
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

