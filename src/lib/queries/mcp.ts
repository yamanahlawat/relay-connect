import { useQuery } from '@tanstack/react-query';
import { listMCPServers } from '../api/mcp';

export function useRefreshListMCPServers() {
  return useQuery({
    queryKey: ['mcp-servers'],
    queryFn: listMCPServers,
    // Refresh every 60 seconds
    refetchInterval: 60000,
    // Continue refreshing even when window is in background
    refetchIntervalInBackground: true,
    // Enable automatic refetching
    staleTime: 10000,
  });
}
