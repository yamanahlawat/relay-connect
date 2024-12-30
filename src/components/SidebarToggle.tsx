'use client';

import { SidebarTrigger } from '@/components/ui/sidebar';

export function SidebarToggle({ className }: { className?: string }) {
  const isMac = typeof window !== 'undefined' && navigator.platform.includes('Mac');
  return <SidebarTrigger className={className} title={`Toggle sidebar (${isMac ? '⌘' : 'Ctrl'}+B)`} />;
}
