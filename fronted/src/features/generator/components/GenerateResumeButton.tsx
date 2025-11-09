import { FileText } from 'lucide-react';
import { Button } from '@/shared/ui/shadcn/button';

interface GenerateResumeButtonProps {
  onGenerate?: () => void;
}

export function GenerateResumeButton({ onGenerate }: GenerateResumeButtonProps) {
  return (
    <Button onClick={onGenerate} className="flex items-center gap-2 rounded-xl">
      <FileText className="h-4 w-4" />
      Generate Resume
    </Button>
  );
}

