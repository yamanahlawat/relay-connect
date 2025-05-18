'use client';

import { Button } from '@/components/ui/button';
import { Settings2 } from 'lucide-react';
import Link from 'next/link';

export function SettingsButton() {
  return (
    <Link href="/settings">
      <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
        <Settings2 className="h-5 w-5" />
        <span className="sr-only">Settings</span>
      </Button>
    </Link>
  );
}
