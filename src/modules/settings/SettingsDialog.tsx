import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { Bot, Cloud, Settings2 } from 'lucide-react';
import { useState } from 'react';
import { GeneralSettings } from './GeneralSettings';

// Settings Navigation Items
const settingsNav = [
  {
    id: 'general',
    label: 'General',
    icon: Settings2,
    description: 'Configure application wide settings',
  },
  {
    id: 'providers',
    label: 'Providers',
    icon: Cloud,
    description: 'Manage your LLM Providers',
  },
  {
    id: 'models',
    label: 'Models',
    icon: Bot,
    description: 'Manager LLM Models and their settings',
  },
] as const;

type SettingsPage = (typeof settingsNav)[number]['id'];

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const [activePage, setActivePage] = useState<SettingsPage>('general');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTitle></DialogTitle>
      <DialogContent className="flex h-[600px] w-[900px] max-w-4xl gap-0 overflow-hidden p-0">
        {/* Left Navigation */}
        <div className="flex w-52 flex-col border-r bg-muted/40">
          <div className="flex h-14 items-center justify-between border-b px-4 py-3">
            <span className="text-sm font-semibold">Settings</span>
          </div>
          <nav className="flex-1 space-y-1 p-2">
            {settingsNav.map((item) => (
              <button
                key={item.id}
                onClick={() => setActivePage(item.id)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                  'hover:bg-accent/50 hover:text-accent-foreground',
                  activePage === item.id ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex flex-1 flex-col">
          <div className="flex items-start border-b p-4">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold">{settingsNav.find((item) => item.id === activePage)?.label}</h2>
              <p className="text-sm text-muted-foreground">
                {settingsNav.find((item) => item.id === activePage)?.description}
              </p>
            </div>
          </div>
          <div className="flex-1 space-y-6 overflow-y-auto p-6">
            {activePage === 'general' && <GeneralSettings />}
            {activePage === 'providers' && <ProviderSettings />}
            {activePage === 'models' && <ModelSettings />}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Placeholder components for other settings pages
function ProviderSettings() {
  return <div>Provider Settings Content</div>;
}

function ModelSettings() {
  return <div>Model Settings Content</div>;
}
