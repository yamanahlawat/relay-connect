'use client';

import { SidebarTrigger } from '@/components/ui/sidebar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useEffect, useState } from 'react';

export function SidebarToggle({ className }: { className?: string }) {
  // Initialize to false so the server and initial client render match.
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    // Now that we're on the client, detect macOS.
    setIsMac(/macintosh/i.test(navigator.userAgent));
  }, []);

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
