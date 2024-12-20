import client from '@/lib/api/client';
import type { paths } from '@/lib/api/schema';

type ChatSessionsListResponse = paths['/api/v1/sessions/']['get']['responses']['200']['content']['application/json'];

export const listChatSessions = async (limit: number, offset: number): Promise<ChatSessionsListResponse> => {
  const { data, error } = await client.GET('/api/v1/sessions/', {
    params: {
      query: {
        limit,
        offset,
      },
    },
  });
  if (error) {
    throw new Error(`Error fetching chat sessions: ${error.detail}`);
  }
  return data;
};
