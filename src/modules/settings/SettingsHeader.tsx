'use client';

import { Button } from '@/components/ui/button';
import { settingsNav, type SettingsNavItem } from '@/modules/settings/settingsData';
import { Plus } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';

export function SettingsHeader() {
  const pathname = usePathname();
  const router = useRouter();

  // Determine active tab based on current path
  const getActiveTab = () => {
    if (pathname.includes('/providers')) return 'providers';
    if (pathname.includes('/models')) return 'models';
    if (pathname.includes('/mcp-servers')) return 'mcp-servers';
    return 'general';
  };

  // Add a timestamp to ensure the URL is always different when clicked
  const handleAddClick = () => {
    router.push(`${pathname}?add=true&t=${Date.now()}`);
  };

  const activeTab = getActiveTab();
  const activeItem = settingsNav.find((item: SettingsNavItem) => item.id === activeTab);

  return (
    <div className="bg-background/95 sticky top-0 z-10 border-b backdrop-blur-sm">
      <div className="flex items-center justify-between px-8 py-6">
        <div className="flex flex-col">
          <div className="mb-1.5 flex items-center gap-2.5">
            {activeItem?.icon && <activeItem.icon className="text-primary/80 h-5 w-5" />}
            <h1 className="text-xl font-semibold tracking-tight">{activeItem?.label}</h1>
          </div>
          <p className="text-muted-foreground text-sm">{activeItem?.description}</p>
        </div>

        {activeTab !== 'general' && (
          <Button size="sm" className="gap-1.5 px-3 py-2 whitespace-nowrap" onClick={handleAddClick}>
            <Plus className="h-4 w-4" />
            {activeTab === 'providers' && 'Add Provider'}
            {activeTab === 'models' && 'Add Model'}
            {activeTab === 'mcp-servers' && 'Add Server'}
          </Button>
        )}
      </div>
    </div>
  );
}
