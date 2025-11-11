import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/shared/ui/shadcn/dialog';
import { Checkbox } from '@/shared/ui/shadcn/checkbox';
import { Button } from '@/shared/ui/shadcn/button';
import { ChevronRight } from 'lucide-react';

const TERMS = [
  { id: 'over14', label: '(필수) 만 14세 이상입니다', required: true },
  { id: 'service', label: '(필수) 서비스 이용약관', required: true },
  { id: 'privacy', label: '(필수) 개인정보 수집 및 이용에 대한 안내', required: true },
  { id: 'privacyOptional', label: '(선택) 개인정보 수집 및 이용에 대한 안내', required: false },
  { id: 'marketing', label: '(선택) 스카웃 제안 등 맞춤 혜택/정보 수신', required: false },
] as const;

type TermsId = (typeof TERMS)[number]['id'];

interface TermsConsentDialogProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const INITIAL_AGREEMENTS = TERMS.reduce(
  (acc, term) => {
    acc[term.id] = false;
    return acc;
  },
  {} as Record<TermsId, boolean>,
);

export function TermsConsentDialog({ open, onConfirm, onCancel }: TermsConsentDialogProps) {
  const [agreements, setAgreements] = useState<Record<TermsId, boolean>>(INITIAL_AGREEMENTS);

  useEffect(() => {
    if (!open) {
      setAgreements(INITIAL_AGREEMENTS);
    }
  }, [open]);

  const allChecked = useMemo(() => TERMS.every((term) => agreements[term.id]), [agreements]);
  const requiredChecked = useMemo(
    () => TERMS.filter((term) => term.required).every((term) => agreements[term.id]),
    [agreements],
  );

  const handleToggleAll = () => {
    const next = !allChecked;
    setAgreements(
      TERMS.reduce(
        (acc, term) => {
          acc[term.id] = next;
          return acc;
        },
        {} as Record<TermsId, boolean>,
      ),
    );
  };

  const toggleAgreement = (id: TermsId, value: boolean) => {
    setAgreements((prev) => ({ ...prev, [id]: value }));
  };

  const handleConfirm = () => {
    if (!requiredChecked) return;
    onConfirm();
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onCancel()}>
      <DialogContent
        className="max-w-md rounded-xl p-0 [&_[data-slot='dialog-close']]:hidden"
        onInteractOutside={(event) => event.preventDefault()}
      >
        <DialogHeader className="px-6 pt-6 pb-3">
          <DialogTitle className="text-xl text-gray-900">넥스트미 이용약관</DialogTitle>
          <DialogDescription className="text-gray-600">
            서비스 이용을 위해 약관에 동의해 주세요
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-6 space-y-6">
          <button
            type="button"
            onClick={handleToggleAll}
            className={`w-full flex items-center justify-between rounded-lg border px-4 py-3 text-left ${
              allChecked
                ? 'border-gray-900 bg-gray-900 text-white'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            } transition-colors`}
          >
            <div className="flex items-center gap-3">
              <Checkbox
                checked={allChecked}
                onCheckedChange={() => handleToggleAll()}
                className={allChecked ? 'bg-white text-gray-900' : ''}
              />
              <span className={`text-sm font-medium ${allChecked ? 'text-white' : 'text-gray-900'}`}>
                모두 동의합니다
              </span>
            </div>
          </button>

          <div className="space-y-2">
            {TERMS.map((term) => {
              const checked = agreements[term.id];
              return (
                <div
                  key={term.id}
                  className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(checkedState: boolean | 'indeterminate') =>
                        toggleAgreement(term.id, checkedState === true)
                      }
                    />
                    <span className="text-sm text-gray-900">{term.label}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </div>
              );
            })}
          </div>

          <Button
            onClick={handleConfirm}
            disabled={!requiredChecked}
            className="w-full rounded-lg bg-gray-900 hover:bg-gray-800 text-white disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
          >
            다음
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}



