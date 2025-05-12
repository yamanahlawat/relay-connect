import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { GeneralSettings } from '@/modules/settings/GeneralSettings';
import { MCPServerSettings } from '@/modules/settings/MCP/MCPServerSettings';
import { ModelSettings } from '@/modules/settings/Models/ModelSettings';
import { ProviderSettings } from '@/modules/settings/Providers/ProviderSettings';
import { Bot, Cloud, Server, Settings2 } from 'lucide-react';
import { useState } from 'react';

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
    description: 'Manage LLM Models and their settings',
  },
  {
    id: 'mcp-servers',
    label: 'MCP Servers',
    icon: Server,
    description: 'Manage Model Context Protocol servers',
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
      <DialogContent className="flex h-[700px] w-[1000px] max-w-4xl gap-0 overflow-hidden p-0">
        {/* Left Navigation */}
        <div className="flex w-52 flex-col border-r bg-muted/40">
          <div className="flex h-14 items-center justify-between border-b px-4 py-3">
            <span className="text-sm font-semibold">Settings</span>
          </div>
          <nav className="flex-1 space-y-1 p-2">
            {settingsNav.map((item) => (
              <Button
                key={item.id}
                onClick={() => setActivePage(item.id)}
                variant={activePage === item.id ? 'default' : 'ghost'}
                className="w-full justify-start gap-3"
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Button>
            ))}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          {activePage === 'general' && <GeneralSettings />}
          {activePage === 'providers' && <ProviderSettings />}
          {activePage === 'models' && <ModelSettings />}
          {activePage === 'mcp-servers' && <MCPServerSettings />}
        </div>
      </DialogContent>
    </Dialog>
  );
}
