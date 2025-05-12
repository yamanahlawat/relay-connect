import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { MCPServerTools } from '@/types/mcp';
import { CircuitBoard, Loader2, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface MCPServerCardProps {
  server: MCPServerTools;
  onToggle: (serverId: string, enabled: boolean) => void;
  onEdit: (server: MCPServerTools) => void;
  onDelete: (server: MCPServerTools) => void;
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
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CircuitBoard className="h-5 w-5 text-primary" />
            <div>
              <h3 className="font-medium">{server.name}</h3>
              <p className="text-xs text-muted-foreground">
                Status: {server.status.charAt(0).toUpperCase() + server.status.slice(1)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isThisServerUpdating ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : (
              <Switch
                checked={server.enabled}
                onCheckedChange={(checked) => onToggle(server.id, checked)}
                aria-label={`Toggle ${server.name}`}
                disabled={isUpdating}
              />
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(server)} className="gap-2">
                  <Pencil className="h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDelete(server)} className="gap-2 text-destructive">
                  <Trash2 className="h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        {server.available_tools && server.available_tools.length > 0 && (
          <div className="mt-3 border-t pt-3">
            <h4 className="mb-2 text-xs font-medium text-muted-foreground">Available Tools</h4>
            <div className="flex flex-wrap gap-2">
              {server.available_tools.map((tool: { name: string; description: string }) => (
                <div
                  key={tool.name}
                  className="rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground"
                >
                  {tool.name}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
