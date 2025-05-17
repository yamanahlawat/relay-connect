'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { LucideIcon, Monitor, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

function ThemeItem({ theme, icon: Icon, label }: { theme: string; icon: LucideIcon; label: string }) {
  const { theme: currentTheme, setTheme } = useTheme();
  const isActive = currentTheme === theme;

  return (
    <Button
      onClick={() => setTheme(theme)}
      variant="ghost"
      className={cn(
        'flex-1 items-center justify-center gap-2 rounded-md border px-3 py-2.5',
        isActive
          ? 'bg-primary/10 border-primary/20 text-primary font-medium'
          : 'bg-background border-border text-muted-foreground hover:bg-muted/30 hover:text-foreground'
      )}
    >
      <Icon className={cn('h-4 w-4', isActive ? 'text-primary' : 'text-muted-foreground')} />
      <span>{label}</span>
    </Button>
  );
}

export function GeneralSettings() {
  // State to track if component has mounted (client-side only)
  const [mounted, setMounted] = useState(false);

  // Set mounted to true on client-side only
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-muted-foreground mb-2 text-sm font-medium">Theme</h3>
        {/* Only render theme options after client-side mount to prevent hydration mismatch */}
        {mounted ? (
          <div className="flex gap-1 rounded-lg p-1">
            <ThemeItem theme="light" icon={Sun} label="Light" />
            <ThemeItem theme="dark" icon={Moon} label="Dark" />
            <ThemeItem theme="system" icon={Monitor} label="System" />
          </div>
        ) : (
          <div className="flex h-[42px] gap-1 rounded-lg p-1" aria-hidden="true">
            {/* Skeleton placeholders with same dimensions to prevent layout shift */}
            <div className="flex-1 rounded-md" />
            <div className="flex-1 rounded-md" />
            <div className="flex-1 rounded-md" />
          </div>
        )}
      </div>
    </div>
  );
}
