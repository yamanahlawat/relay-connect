import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { LucideIcon, Monitor, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

function ThemeItem({ theme, icon: Icon, label }: { theme: string; icon: LucideIcon; label: string }) {
  const { theme: currentTheme, setTheme } = useTheme();
  const isActive = currentTheme === theme;

  return (
    <button
      onClick={() => setTheme(theme)}
      className={cn(
        'inline-flex items-center justify-center rounded-md p-2 text-sm font-medium ring-offset-background transition-colors',
        'hover:bg-muted hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        isActive && 'bg-accent text-accent-foreground'
      )}
    >
      <Icon className="h-5 w-5" />
      <span className="sr-only">{label}</span>
    </button>
  );
}

export function GeneralSettings() {
  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b p-4 pr-14">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">General</h2>
          <p className="text-sm text-muted-foreground">Configure application wide settings</p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Appearance */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-base font-medium">Appearance</h3>
            <p className="text-sm text-muted-foreground">Customize how Relay Connect looks and feels.</p>

            <div className="mt-6 space-y-4">
              {/* Theme Selection */}
              <div className="space-y-2">
                <Label>Theme</Label>
                <div className="flex items-center gap-2">
                  <ThemeItem theme="light" icon={Sun} label="Light" />
                  <ThemeItem theme="dark" icon={Moon} label="Dark" />
                  <ThemeItem theme="system" icon={Monitor} label="System" />
                </div>
              </div>

              {/* Density */}
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="density" className="flex flex-col space-y-1">
                  <span>Compact mode</span>
                  <span className="text-xs font-normal text-muted-foreground">
                    Make the UI more compact by reducing spacing
                  </span>
                </Label>
                <Switch id="density" />
              </div>

              {/* Code Font */}
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="monoFont" className="flex flex-col space-y-1">
                  <span>Use monospace font</span>
                  <span className="text-xs font-normal text-muted-foreground">
                    Use monospace font for code and snippets
                  </span>
                </Label>
                <Switch id="monoFont" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
