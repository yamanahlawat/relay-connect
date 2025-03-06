import { useQuery } from '@tanstack/react-query';
import { listMCPServers } from '../api/mcp';

export function useListMCPServersQuery() {
  return useQuery({
    queryKey: ['mcp-servers'],
    queryFn: listMCPServers,
    refetchOnWindowFocus: 'always',
  });
}
