import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/shared/ui/shadcn/dialog';
import { Button } from '@/shared/ui/shadcn/button';

export interface GoogleConnectResult {
  email: string;
  name: string;
}

interface GoogleConnectDialogProps {
  open: boolean;
  onCancel: () => void;
  onComplete: (result: GoogleConnectResult) => void;
}

export function GoogleConnectDialog({ open, onCancel, onComplete }: GoogleConnectDialogProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const handleConnect = () => {
    if (isConnecting) return;
    setIsConnecting(true);
    setTimeout(() => {
      setIsConnecting(false);
      setIsConnected(true);
    }, 800);
  };

  const handleContinue = () => {
    setIsConnecting(false);
    onComplete({
      email: 'google.user@example.com',
      name: 'Google 사용자',
    });
    setIsConnected(false);
  };

  const handleCancel = () => {
    setIsConnecting(false);
    setIsConnected(false);
    onCancel();
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && handleCancel()}>
      <DialogContent className="max-w-sm rounded-xl p-0 [&_[data-slot='dialog-close']]:hidden">
        <DialogHeader className="px-6 pt-6 pb-3 space-y-2">
          <DialogTitle className="text-xl text-gray-900">Google 계정 연결</DialogTitle>
          <DialogDescription className="text-gray-600">
            Google 계정을 연동하면 더욱 간편하게 서비스를 이용할 수 있어요.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-6 space-y-6">
          <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-center text-sm text-gray-600">
            {isConnected
              ? 'Google 계정이 연결되었습니다. 다음 단계로 이동할 수 있어요.'
              : '연결하기 버튼을 눌러 Google 계정을 인증해 주세요.'}
          </div>

          <div className="flex flex-col gap-3">
            <Button
              type="button"
              className="w-full rounded-lg bg-gray-900 hover:bg-gray-800 text-white disabled:bg-gray-200 disabled:text-gray-400"
              onClick={handleConnect}
              disabled={isConnected || isConnecting}
            >
              {isConnecting ? '연결 중...' : isConnected ? '연결 완료' : 'Google 계정 연결하기'}
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full rounded-lg border-gray-300 text-gray-700 hover:bg-gray-50"
              onClick={handleCancel}
            >
              취소
            </Button>

            <Button
              type="button"
              className="w-full rounded-lg bg-gray-900 hover:bg-gray-800 text-white disabled:bg-gray-200 disabled:text-gray-400"
              onClick={handleContinue}
              disabled={!isConnected}
            >
              계속
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

