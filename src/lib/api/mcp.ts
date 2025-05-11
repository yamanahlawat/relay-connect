import client from '@/lib/api/client';
import { components } from './schema';
import { MCPServerTools } from '@/types/mcp';

export async function listMCPServers(): Promise<MCPServerTools[]> {
  const { data, error } = await client.GET('/api/v1/mcp/');

  if (error) {
    throw new Error(`Failed to fetch MCP tools: ${error}`);
  }
  return data;
}

export async function toggleMCPServer(serverId: string): Promise<components['schemas']['MCPServerToggleResponse']> {
  const { data, error } = await client.PATCH('/api/v1/mcp/{server_id}/toggle/', {
    params: {
      path: {
        server_id: serverId,
      },
    },
  });

  if (error) {
    throw new Error(`Failed to toggle MCP server: ${error}`);
  }
  return data;
}
