import { MCPServerCard } from '@/modules/settings/MCP/MCPServerCard';
import { MCPServerTools } from '@/types/mcp';

interface MCPServerGroupProps {
  servers: MCPServerTools[];
  onToggle: (serverId: string, enabled: boolean) => void;
  onEdit: (server: MCPServerTools) => void;
  onDelete: (server: MCPServerTools) => void;
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
    <div className="space-y-4">
      <h3 className="text-sm font-medium">Available Servers</h3>
      <div className="grid gap-4 md:grid-cols-2">
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
