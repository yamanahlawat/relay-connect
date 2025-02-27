import { Button } from '@/components/ui/button';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  buttonText: string;
  onButtonClick: () => void;
  Icon?: LucideIcon;
}

export function EmptyState({ title, description, buttonText, onButtonClick, Icon }: EmptyStateProps) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg">
      <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
        <h3 className="mt-4 text-lg font-semibold">{title}</h3>
        <p className="mb-4 mt-2 text-sm text-muted-foreground">{description}</p>
        <Button onClick={onButtonClick}>
          {Icon && <Icon className="mr-2 h-4 w-4" />}
          {buttonText}
        </Button>
      </div>
    </div>
  );
}
