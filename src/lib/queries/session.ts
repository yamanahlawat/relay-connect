import { listChatSessions } from '@/lib/api/chatSessions';
import { QueryClient } from '@tanstack/react-query';

// Prefetch function for infinite loading
export async function prefetchSessionsQuery(queryClient: QueryClient) {
  await queryClient.prefetchInfiniteQuery({
    queryKey: ['chat-sessions', ''],
    queryFn: async ({ pageParam = { limit: 20, offset: 0 } }) => {
      const response = await listChatSessions(pageParam.limit, pageParam.offset);
      return response;
    },
    initialPageParam: { limit: 20, offset: 0 },
  });
}
