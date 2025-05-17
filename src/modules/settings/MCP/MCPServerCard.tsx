import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { MCPServerResponse } from '@/types/mcp';
import { CircuitBoard, Loader2, Pencil, Trash2 } from 'lucide-react';

interface MCPServerCardProps {
  server: MCPServerResponse;
  onToggle: (serverId: string, enabled: boolean) => void;
  onEdit: (server: MCPServerResponse) => void;
  onDelete: (server: MCPServerResponse) => void;
  isUpdating: boolean;
  updatingServerId?: string;
}

export function MCPServerCard({
  server,
  onToggle,
  onEdit,
  onDelete,
  isUpdating,
  updatingServerId,
}: MCPServerCardProps) {
  const isThisServerUpdating = isUpdating && updatingServerId === server.id;

  return (
    <div className="group bg-card hover:bg-muted/30 rounded-md border transition-colors">
      {/* Main info and actions */}
      <div className="flex items-center justify-between p-3">
        <div className="flex items-center gap-3">
          {/* Icon */}
          <div
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-md border',
              server.enabled ? 'bg-background text-foreground' : 'bg-muted text-muted-foreground'
            )}
          >
            <CircuitBoard className="h-4 w-4" />
          </div>

          {/* Info */}
          <div>
            <h4 className="text-sm font-medium">{server.name}</h4>
            <p className="text-muted-foreground mt-0.5 text-xs">
              Status: {server.status.charAt(0).toUpperCase() + server.status.slice(1)}
            </p>
          </div>

          {/* Status Badge */}
          {!server.enabled && (
            <span className="ml-2 rounded-full bg-yellow-100/50 px-2 py-0.5 text-xs text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
              Disabled
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
          {isThisServerUpdating ? (
            <Loader2 className="text-muted-foreground h-3.5 w-3.5 animate-spin" />
          ) : (
            <Switch
              checked={server.enabled}
              onCheckedChange={(checked) => onToggle(server.id, checked)}
              aria-label={`Toggle ${server.name}`}
              disabled={isUpdating}
            />
          )}
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:bg-background hover:text-foreground ml-1 h-7 w-7 p-0"
            onClick={() => onEdit(server)}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:bg-background hover:text-foreground h-7 w-7 p-0"
            onClick={() => onDelete(server)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Tools List */}
      {server.available_tools && server.available_tools.length > 0 && (
        <div className="border-t p-2">
          <h4 className="text-muted-foreground mb-1 text-xs font-medium">Available Tools</h4>
          <div className="flex flex-wrap gap-1">
            {server.available_tools.map((tool) => (
              <div key={tool.name} className="bg-muted text-muted-foreground rounded-sm px-1.5 py-0.5 text-xs">
                {tool.name}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
