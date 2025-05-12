import client from '@/lib/api/client';
import { MCPServerCreate, MCPServerTools } from '@/types/mcp';

export async function listMCPServers(): Promise<MCPServerTools[]> {
  const { data, error } = await client.GET('/api/v1/mcp/');

  if (error) {
    throw new Error(`Failed to fetch MCP tools: ${error}`);
  }
  return data;
}

export async function updateMCPServer(serverId: string, enabled: boolean): Promise<MCPServerTools> {
  const { data, error } = await client.PUT('/api/v1/mcp/{server_id}', {
    params: {
      path: {
        server_id: serverId,
      },
    },
    body: {
      enabled,
    },
  });

  if (error) {
    throw new Error(`Failed to update MCP server: ${error}`);
  }
  return data;
}

export async function createMCPServer(params: MCPServerCreate): Promise<MCPServerTools> {
  const { data, error } = await client.POST('/api/v1/mcp/', {
    body: params,
  });

  if (error) {
    throw new Error(`Failed to create MCP server: ${error}`);
  }
  return data;
}

export async function deleteMCPServer(serverId: string): Promise<void> {
  const { error } = await client.DELETE('/api/v1/mcp/{server_id}', {
    params: {
      path: {
        server_id: serverId,
      },
    },
  });

  if (error) {
    throw new Error(`Failed to delete MCP server: ${error}`);
  }
}
