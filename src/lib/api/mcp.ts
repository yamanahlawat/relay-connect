import client from '@/lib/api/client';
import { MCPServerTools } from '@/types/mcp';

export async function listMCPServers(): Promise<MCPServerTools[]> {
  const { data, error } = await client.GET('/api/v1/mcp/');

  if (error) {
    throw new Error(`Failed to fetch MCP tools: ${error}`);
  }
  return data;
}
