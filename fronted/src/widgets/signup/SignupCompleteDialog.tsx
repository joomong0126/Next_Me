import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/shared/ui/shadcn/dialog';
import { Button } from '@/shared/ui/shadcn/button';
import { api } from '@/shared/api';

interface SignupCompleteDialogProps {
  open: boolean;
  onProceed: () => void;
  onClose: () => void;
  userName?: string | null;
  requiresEmailConfirmation?: boolean;
  email?: string | null;
}

export function SignupCompleteDialog({
  open,
  onProceed,
  onClose,
  userName,
  requiresEmailConfirmation = false,
  email,
}: SignupCompleteDialogProps) {
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendError, setResendError] = useState<string | null>(null);

  const handleResendEmail = async () => {
    if (!email) return;
    setIsResending(true);
    setResendError(null);
    setResendSuccess(false);
    try {
      await api.auth.resendEmailConfirmation(email);
      setResendSuccess(true);
    } catch (error) {
      setResendError(error instanceof Error ? error.message : '이메일 재전송에 실패했습니다.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <Dialog open={open}>
      <DialogContent
        className="max-w-sm rounded-2xl p-8 text-center space-y-6 [&_[data-slot='dialog-close']]:hidden"
        onInteractOutside={(event: Event) => event.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="sr-only">회원가입 완료</DialogTitle>
        </DialogHeader>

        {requiresEmailConfirmation ? (
          <>
            <div className="space-y-3">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                <svg
                  className="w-8 h-8 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <p className="text-xl font-semibold text-gray-900">이메일 확인이 필요합니다</p>
              <DialogDescription className="text-gray-600 space-y-2">
                <div>
                  <strong>{email}</strong>로 확인 이메일을 발송했습니다.
                </div>
                <div className="text-sm text-gray-500 mt-3 space-y-1 text-left bg-gray-50 rounded-lg p-3">
                  <p className="font-medium text-gray-700">이메일이 보이지 않나요?</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>스팸함 또는 광고함을 확인해주세요</li>
                    <li>2-3분 정도 기다려보세요</li>
                    <li>이메일 주소가 정확한지 확인해주세요</li>
                    <li>여전히 오지 않으면 아래 "이메일 재전송" 버튼을 클릭해주세요</li>
                  </ul>
                </div>
                <div className="text-sm text-gray-700 mt-2">
                  이메일의 링크를 클릭하여 계정을 활성화해주세요.
                </div>
              </DialogDescription>
            </div>

            {resendSuccess && (
              <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-700">
                <p className="font-medium mb-1">이메일이 재전송되었습니다!</p>
                <p className="text-xs">받은편지함(및 스팸함)을 확인해주세요. 몇 분 정도 걸릴 수 있습니다.</p>
              </div>
            )}

            {resendError && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">{resendError}</div>
            )}

            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full rounded-lg border-gray-300 text-gray-700 hover:bg-gray-50"
                onClick={handleResendEmail}
                disabled={isResending || !email}
              >
                {isResending ? '전송 중...' : '이메일 재전송'}
              </Button>
              <Button
                className="w-full rounded-lg bg-gray-900 hover:bg-gray-800 text-white"
                onClick={onClose}
              >
                로그인으로 이동
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="space-y-2">
              <p className="text-xl font-semibold text-gray-900">반갑습니다{userName ? `, ${userName}` : ''}!</p>
              <p className="text-sm text-gray-600">회원가입이 완료되었습니다.</p>
            </div>

            <p className="text-lg font-medium text-gray-900 leading-relaxed">
              지금 바로 당신의 강점과 잠재력을 발견해보세요!
            </p>

            <div className="flex gap-3">
              <Button
                className="flex-1 rounded-lg bg-gray-900 hover:bg-gray-800 text-white"
                onClick={onProceed}
              >
                대시보드로 이동
              </Button>
              <Button
                variant="outline"
                className="flex-1 rounded-lg border-gray-300 text-gray-900 hover:bg-gray-50"
                onClick={onClose}
              >
                닫기
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}