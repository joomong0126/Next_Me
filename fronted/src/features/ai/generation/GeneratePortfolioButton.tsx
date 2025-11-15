import { Briefcase } from 'lucide-react';
import { Button } from '@/shared/ui/shadcn/button';

interface GeneratePortfolioButtonProps {
  onGenerate?: () => void;
}

export function GeneratePortfolioButton({ onGenerate }: GeneratePortfolioButtonProps) {
  return (
    <Button onClick={onGenerate} variant="outline" className="flex items-center gap-2 rounded-xl">
      <Briefcase className="h-4 w-4" />
      Generate Portfolio
    </Button>
  );
}

