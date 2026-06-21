import { MCPServerCard } from '@/modules/settings/mcp/MCPServerCard';
import { MCPServerResponse } from '@/types/mcp';

interface MCPServerGroupProps {
  servers: MCPServerResponse[];
  onToggle: (serverId: string, enabled: boolean) => void;
  onEdit: (server: MCPServerResponse) => void;
  onDelete: (server: MCPServerResponse) => void;
  isUpdating: boolean;
  updatingServerId?: string;
}

export function MCPServerGroup({
  servers,
  onToggle,
  onEdit,
  onDelete,
  isUpdating,
  updatingServerId,
}: MCPServerGroupProps) {
  return (
    <div className="p-6">
      <h3 className="text-muted-foreground mb-4 text-sm font-medium">Available Servers</h3>
      <div className="space-y-3">
        {servers.map((server) => (
          <MCPServerCard
            key={server.id}
            server={server}
            onToggle={onToggle}
            onEdit={onEdit}
            onDelete={onDelete}
            isUpdating={isUpdating}
            updatingServerId={updatingServerId}
          />
        ))}
      </div>
    </div>
  );
}
