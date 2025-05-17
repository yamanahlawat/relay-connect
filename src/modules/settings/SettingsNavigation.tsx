'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { settingsNav } from './settingsData';

export function SettingsNavigation() {
  const pathname = usePathname();

  // Determine active tab based on current path
  const getActiveTab = () => {
    if (pathname.includes('/providers')) return 'providers';
    if (pathname.includes('/models')) return 'models';
    if (pathname.includes('/mcp-servers')) return 'mcp-servers';
    return 'general';
  };

  const activeTab = getActiveTab();

  return (
    <div className="bg-background/60 w-full md:w-72 md:border-r">
      <div className="flex h-14 items-center border-b px-6">
        <span className="text-sm font-semibold">Settings</span>
      </div>
      <nav className="flex overflow-x-auto px-4 py-6 md:flex-col md:space-y-1.5 md:overflow-x-hidden md:overflow-y-auto">
        {settingsNav.map((item) => (
          <Button
            key={item.id}
            variant="ghost"
            size="sm"
            asChild
            className={cn(
              'w-full justify-start rounded-md px-3 py-2',
              item.id === activeTab
                ? 'bg-primary/10 text-primary hover:bg-primary/15 font-medium'
                : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground font-normal'
            )}
          >
            <Link href={item.href} className="flex items-center">
              <item.icon
                className={cn('mr-2.5 h-4 w-4', item.id === activeTab ? 'text-primary' : 'text-muted-foreground')}
              />
              <span>{item.label}</span>
            </Link>
          </Button>
        ))}
      </nav>

      <div className="hidden p-4 pt-0 md:block">{/* Removed spacing at bottom */}</div>
    </div>
  );
}

// Export the navigation items for use in other components
export { settingsNav };
