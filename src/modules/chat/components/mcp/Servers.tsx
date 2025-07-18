import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { useListMCPServersQuery, useMCPServerToggleMutation } from '@/lib/queries/mcp';
import { cn } from '@/lib/utils';
import { MCPServerResponse } from '@/types/mcp';
import { CircuitBoard, Loader2, PocketKnife, Settings } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

// A small helper component to show the "No servers" message
function NoActiveServers({ onSettingsClick }: { onSettingsClick: () => void }) {
  return (
    <div className="flex h-full min-h-[200px] items-center justify-center">
      <div className="rounded-md border border-dashed p-6">
        <div className="flex flex-col items-center justify-center text-center">
          <PocketKnife className="text-muted-foreground/60 h-8 w-8" />
          <h3 className="mt-3 text-sm font-medium">No Active MCP Servers</h3>
          <p className="text-muted-foreground mt-1 mb-3 text-xs">
            No servers are currently connected. Connect or start a server.
          </p>
          <Button variant="outline" size="sm" onClick={onSettingsClick} className="h-8 text-xs">
            <Settings className="mr-1 h-3 w-3" />
            Configure Servers
          </Button>
        </div>
      </div>
    </div>
  );
}

// Status indicator component
function ServerStatusIcon({ isLoading, hasServers }: { isLoading: boolean; hasServers: boolean }) {
  if (isLoading) {
    return <CircuitBoard className="text-muted-foreground h-4 w-4 animate-pulse" />;
  }

  return (
    <div className="relative">
      <CircuitBoard className="text-muted-foreground h-4 w-4" />
      <span
        className={cn(
          'absolute -top-0.5 -right-0.5 block h-1.5 w-1.5 rounded-full',
          'transition-colors duration-300',
          hasServers ? 'bg-green-500' : 'bg-red-500'
        )}
      />
    </div>
  );
}

export default function MCPServers() {
  const { data: servers, isLoading } = useListMCPServersQuery();
  const toggleMutation = useMCPServerToggleMutation();
  const [contentHeight, setContentHeight] = useState<number>(0);
  const router = useRouter();

  const hasServers = !!servers && servers.length > 0;

  // Calculate optimal height based on content
  useEffect(() => {
    if (!servers) return;

    // Base height for header and settings button
    let height = 140;

    // Add height for each server section
    height += servers.length * 80;

    // Cap at maximum height and ensure minimum height
    const finalHeight = Math.max(200, Math.min(400, height));
    setContentHeight(finalHeight);
  }, [servers]);

  const handleSettingsClick = () => {
    router.push('/settings/mcp-servers');
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:bg-accent hover:text-accent-foreground h-8 w-8 cursor-pointer rounded-full"
        >
          <ServerStatusIcon isLoading={isLoading} hasServers={hasServers} />
          <span className="sr-only">MCP Servers</span>
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-80 shadow-lg" align="start">
        <div className="grid gap-4">
          {/* Header with count and settings button */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h4 className="leading-none font-medium">MCP Servers ({servers?.length ?? 0})</h4>
              <p className="text-muted-foreground text-xs">Active MCP servers.</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSettingsClick}
              className="hover:bg-accent h-8 w-8 cursor-pointer p-0"
            >
              <Settings className="h-4 w-4" />
              <span className="sr-only">MCP Settings</span>
            </Button>
          </div>

          <div style={{ height: contentHeight }} className="transition-all duration-300">
            <ScrollArea className="h-full">
              {/* Loading state */}
              {isLoading && (
                <div className="flex h-full items-center justify-center">
                  <div className="text-muted-foreground text-sm">Loading MCP servers...</div>
                </div>
              )}

              {/* No servers */}
              {!isLoading && !hasServers && <NoActiveServers onSettingsClick={handleSettingsClick} />}

              {/* Server list */}
              {hasServers && (
                <div className="space-y-3">
                  {servers.map((server: MCPServerResponse) => (
                    <div
                      key={server.name}
                      className="bg-card hover:bg-accent/20 rounded-lg border p-3 transition-colors"
                    >
                      {/* Server header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className={cn(
                              'rounded-md p-1.5',
                              server.enabled
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                                : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                            )}
                          >
                            <CircuitBoard className="h-3.5 w-3.5" />
                          </div>
                          <div>
                            <span className="text-sm font-medium">{server.name}</span>
                            <p className="text-muted-foreground text-xs">
                              {server.status.charAt(0).toUpperCase() + server.status.slice(1)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {toggleMutation.isPending && toggleMutation.variables?.serverId === server.id && (
                            <Loader2 className="text-muted-foreground h-3 w-3 animate-spin" />
                          )}
                          <Switch
                            checked={server.enabled}
                            onCheckedChange={(checked) =>
                              toggleMutation.mutate({ serverId: server.id, enabled: checked })
                            }
                            aria-label={`Toggle ${server.name}`}
                            disabled={toggleMutation.isPending && toggleMutation.variables?.serverId === server.id}
                            className="origin-right scale-75 cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
