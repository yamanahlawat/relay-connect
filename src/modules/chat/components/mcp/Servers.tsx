import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useRefreshListMCPServers } from '@/lib/queries/mcp';
import { cn } from '@/lib/utils';
import { MCPServerTools } from '@/types/mcp';
import { ChevronDown, CircuitBoard, PocketKnife } from 'lucide-react';
import { useEffect, useState } from 'react';

// A small helper component to show the "No servers" message
function NoActiveServers() {
  return (
    <div className="flex h-full min-h-[200px] items-center justify-center">
      <div className="rounded-md border border-dashed p-6">
        <div className="flex flex-col items-center justify-center text-center">
          <PocketKnife className="h-8 w-8 text-muted-foreground/60" />
          <h3 className="mt-3 text-sm font-medium">No Active MCP Servers</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            No servers are currently connected. Connect or start a server.
          </p>
        </div>
      </div>
    </div>
  );
}

function ToolCard({ tool, index }: { tool: { name: string; description?: string }; index: number }) {
  return (
    <div
      className={cn(
        'group rounded-md border border-input/80 p-3 text-sm transition-colors',
        'hover:border-accent hover:bg-accent/40',
        index % 2 === 0 ? 'bg-muted/30' : 'bg-muted/50'
      )}
    >
      <div className="flex items-center justify-between">
        <span className="font-medium text-foreground/90">{tool.name}</span>
      </div>
      {tool.description && <div className="mt-1 text-xs leading-relaxed text-muted-foreground">{tool.description}</div>}
    </div>
  );
}

// Status indicator component
function ServerStatusIcon({ isLoading, hasServers }: { isLoading: boolean; hasServers: boolean }) {
  if (isLoading) {
    return <CircuitBoard className="h-4 w-4 animate-pulse text-muted-foreground" />;
  }

  return (
    <div className="relative">
      <CircuitBoard className="h-4 w-4 text-muted-foreground" />
      <span
        className={cn(
          'absolute -right-0.5 -top-0.5 block h-1.5 w-1.5 rounded-full',
          'transition-colors duration-300',
          hasServers ? 'bg-green-500' : 'bg-red-500'
        )}
      />
    </div>
  );
}

export default function MCPServers() {
  const [openServer, setOpenServer] = useState<string | null>(null);
  const { data: servers, isLoading } = useRefreshListMCPServers();
  const [contentHeight, setContentHeight] = useState<number>(0);

  const hasServers = !!servers && servers.length > 0;

  // Calculate optimal height based on content
  useEffect(() => {
    if (!servers) return;

    // Base height for header
    let height = 100;

    // Add height for each server section
    height += servers.length * 80;

    // Add height for tools if a server is open
    if (openServer) {
      const openServerTools = servers.find((s) => s.name === openServer)?.tools.length || 0;
      height += openServerTools * 60;
    }

    // Cap at maximum height and ensure minimum height
    const finalHeight = Math.max(200, Math.min(400, height));
    setContentHeight(finalHeight);
  }, [servers, openServer]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        >
          <ServerStatusIcon isLoading={isLoading} hasServers={hasServers} />
          <span className="sr-only">MCP Servers</span>
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-80 shadow-lg" align="start">
        <div className="grid gap-4">
          {/* Header with count */}
          <div className="space-y-2">
            <h4 className="font-medium leading-none">MCP Servers ({servers?.length ?? 0})</h4>
            <p className="text-xs text-muted-foreground">Active MCP servers and their available tools.</p>
          </div>

          <div style={{ height: contentHeight }} className="transition-all duration-300">
            <ScrollArea className="h-full pr-3">
              {/* Loading state */}
              {isLoading && (
                <div className="flex h-full items-center justify-center">
                  <div className="text-sm text-muted-foreground">Loading MCP servers...</div>
                </div>
              )}

              {/* No servers */}
              {!isLoading && !hasServers && <NoActiveServers />}

              {/* Server list */}
              {hasServers && (
                <div className="space-y-4">
                  {servers.map((server: MCPServerTools) => (
                    <div key={server.name}>
                      {/* Server header */}
                      <div className="flex items-center gap-2 pb-2">
                        <CircuitBoard className="h-4 w-4 text-foreground" />
                        <span className="font-medium text-foreground">{server.name}</span>
                      </div>

                      {/* Tools collapsible */}
                      <Collapsible
                        open={openServer === server.name}
                        onOpenChange={(isOpen) => setOpenServer(isOpen ? server.name : null)}
                      >
                        <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm transition-colors hover:bg-accent">
                          <div className="flex items-center gap-2">
                            <PocketKnife className="h-4 w-4" />
                            <span className="font-medium">Show Tools ({server.tools.length})</span>
                          </div>
                          <ChevronDown
                            className={cn(
                              'h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200',
                              openServer === server.name && 'rotate-180'
                            )}
                          />
                        </CollapsibleTrigger>

                        <CollapsibleContent className="space-y-1.5 pt-2">
                          {server.tools.map((tool, index) => (
                            <ToolCard key={tool.name} tool={tool} index={index} />
                          ))}
                        </CollapsibleContent>
                      </Collapsible>
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
