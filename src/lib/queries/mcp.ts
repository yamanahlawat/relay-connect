import { useQuery } from '@tanstack/react-query';
import { listMCPServers } from '../api/mcp';

export function useRefreshListMCPServers() {
  return useQuery({
    queryKey: ['mcp-servers'],
    queryFn: listMCPServers,
    refetchOnWindowFocus: 'always',
  });
}
