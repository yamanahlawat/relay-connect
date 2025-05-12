import { MCPServerCreate } from '@/types/mcp';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createMCPServer, deleteMCPServer, listMCPServers, updateMCPServer } from '../api/mcp';

export function useListMCPServersQuery() {
  return useQuery({
    queryKey: ['mcp-servers'],
    queryFn: listMCPServers,
    refetchOnWindowFocus: 'always',
  });
}

export function useMCPServerToggleMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ serverId, enabled }: { serverId: string; enabled: boolean }) => updateMCPServer(serverId, enabled),
    onSuccess: () => {
      // Invalidate the MCP servers query to refetch the updated list
      queryClient.invalidateQueries({ queryKey: ['mcp-servers'] });
    },
  });
}

export function useMCPServerCreateMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: MCPServerCreate) => createMCPServer(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mcp-servers'] });
    },
  });
}

export function useMCPServerDeleteMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (serverId: string) => deleteMCPServer(serverId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mcp-servers'] });
    },
  });
}
