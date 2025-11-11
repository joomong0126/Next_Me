import { Dialog, DialogContent } from '@/shared/ui/shadcn/dialog';
import { Button } from '@/shared/ui/shadcn/button';

interface SignupCompleteDialogProps {
  open: boolean;
  onProceed: () => void;
  onClose: () => void;
  userName?: string | null;
}

export function SignupCompleteDialog({ open, onProceed, onClose, userName }: SignupCompleteDialogProps) {
  return (
    <Dialog open={open}>
      <DialogContent
        className="max-w-sm rounded-2xl p-8 text-center space-y-6 [&_[data-slot='dialog-close']]:hidden"
        onInteractOutside={(event: Event) => event.preventDefault()}
      >
        <div className="space-y-2">
          <p className="text-xl font-semibold text-gray-900">
            반갑습니다{userName ? `, ${userName}` : ''}!
          </p>
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
      </DialogContent>
    </Dialog>
  );
}