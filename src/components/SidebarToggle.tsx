'use client';

import { SidebarTrigger } from '@/components/ui/sidebar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useIsMac } from '@/hooks/use-is-mac';

export function SidebarToggle({ className }: { className?: string }) {
  const isMac = useIsMac();

  return (
    <TooltipProvider delayDuration={200} skipDelayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <SidebarTrigger className={className} />
        </TooltipTrigger>
        <TooltipContent side="bottom">Toggle Sidebar ({isMac ? '⌘' : 'Ctrl'}+B)</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
