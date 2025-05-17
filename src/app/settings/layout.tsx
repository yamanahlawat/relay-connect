import { Button } from '@/components/ui/button';
import { SettingsHeader } from '@/modules/settings/SettingsHeader';
import { SettingsNavigation } from '@/modules/settings/SettingsNavigation';
import { cn } from '@/lib/utils';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { ReactNode } from 'react';

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-full flex-col">
      {/* Centered container for the entire layout */}
      <div className="mx-auto w-full max-w-6xl px-4 pt-6 pb-16 sm:px-6 sm:pt-8 lg:px-8">
        {/* Header with back button - outside the card */}
        <div className="mb-4 flex">
          <Button variant="ghost" size="sm" asChild className="-ml-2 px-2">
            <Link href="/" className="flex items-center gap-1.5 text-sm">
              <ChevronLeft className="h-4 w-4" />
              Back
            </Link>
          </Button>
        </div>

        {/* Main layout - card with full border radius */}
        <div className={cn('flex flex-col overflow-hidden md:flex-row', 'bg-card rounded-lg border shadow-sm')}>
          {/* Navigation sidebar */}
          <SettingsNavigation />

          {/* Content area */}
          <div className="flex flex-1 flex-col overflow-auto">
            <SettingsHeader />
            <div className="flex-1 p-6">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
