import client from '@/lib/api/client';
import type { paths } from '@/lib/api/schema';

type ChatSessionsListResponse = paths['/api/v1/sessions/']['get']['responses']['200']['content']['application/json'];
type CreateSessionRequest = paths['/api/v1/sessions/']['post']['requestBody']['content']['application/json'];
type CreateSessionResponse = paths['/api/v1/sessions/']['post']['responses']['201']['content']['application/json'];
type GetSessionResponse =
  paths['/api/v1/sessions/{session_id}/']['get']['responses']['200']['content']['application/json'];
type UpdateSessionRequest =
  paths['/api/v1/sessions/{session_id}/']['patch']['requestBody']['content']['application/json'];
type UpdateSessionResponse =
  paths['/api/v1/sessions/{session_id}/']['patch']['responses']['200']['content']['application/json'];

export async function listChatSessions(
  limit: number = 50,
  offset: number = 0,
  title?: string
): Promise<ChatSessionsListResponse> {
  const { data, error } = await client.GET('/api/v1/sessions/', {
    params: {
      query: { limit, offset, ...(title ? { title } : {}) },
    },
  });
  if (error) {
    throw new Error(`Error fetching chat sessions: ${error.detail}`);
  }
  return data;
}

export async function createChatSession(session: CreateSessionRequest): Promise<CreateSessionResponse> {
  const { data, error } = await client.POST('/api/v1/sessions/', {
    body: session,
  });
  if (error) {
    throw new Error(`Error creating chat session: ${error.detail}`);
  }
  return data;
}

export async function getChatSession(sessionId: string): Promise<GetSessionResponse> {
  const { data, error } = await client.GET('/api/v1/sessions/{session_id}/', {
    params: {
      path: { session_id: sessionId },
    },
  });
  if (error) {
    throw new Error(`Error fetching chat session: ${error.detail}`);
  }
  return data;
}

export async function updateChatSession(
  sessionId: string,
  update: UpdateSessionRequest
): Promise<UpdateSessionResponse> {
  const { data, error } = await client.PATCH('/api/v1/sessions/{session_id}/', {
    params: {
      path: { session_id: sessionId },
    },
    body: update,
  });
  if (error) {
    throw new Error(`Error updating chat session: ${error.detail}`);
  }
  return data;
}

export async function deleteChatSession(sessionId: string): Promise<void> {
  const { error } = await client.DELETE('/api/v1/sessions/{session_id}/', {
    params: {
      path: { session_id: sessionId },
    },
  });
  if (error) {
    throw new Error(`Error deleting chat session: ${error.detail}`);
  }
}
