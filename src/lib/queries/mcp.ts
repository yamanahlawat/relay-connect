import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { listMCPServers, toggleMCPServer } from '../api/mcp';

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
    mutationFn: (serverId: string) => toggleMCPServer(serverId),
    onSuccess: () => {
      // Invalidate the MCP servers query to refetch the updated list
      queryClient.invalidateQueries({ queryKey: ['mcp-servers'] });
    },
  });
}
