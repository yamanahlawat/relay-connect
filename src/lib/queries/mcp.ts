import { MCPServerCreate } from '@/types/mcp';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
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
      toast.success('MCP server status updated successfully');
    },
    onError: () => {
      toast.error('Failed to update MCP server status');
    },
  });
}

export function useMCPServerCreateMutation(onSuccess?: () => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: MCPServerCreate) => createMCPServer(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mcp-servers'] });
      toast.success('MCP server created successfully');
      onSuccess?.();
    },
    onError: () => {
      toast.error('Failed to create MCP server');
    },
  });
}

export function useMCPServerDeleteMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (serverId: string) => deleteMCPServer(serverId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mcp-servers'] });
      toast.success('MCP server deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete MCP server');
    },
  });
}
