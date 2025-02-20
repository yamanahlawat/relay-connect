import { useQuery } from '@tanstack/react-query';
import { listMCPServers } from '../api/mcp';

export function useListMCPServers() {
  return useQuery({
    queryKey: ['mcp-servers'],
    queryFn: listMCPServers,
  });
}
