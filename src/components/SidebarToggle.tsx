'use client';

import { SidebarTrigger } from '@/components/ui/sidebar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export function SidebarToggle({ className }: { className?: string }) {
  const isMac = typeof window !== 'undefined' && navigator.platform.includes('Mac');

  return (
    <TooltipProvider delayDuration={200} skipDelayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <SidebarTrigger className={className} />
        </TooltipTrigger>
        <TooltipContent side="bottom">Toggle sidebar ({isMac ? '⌘' : 'Ctrl'}+B)</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
