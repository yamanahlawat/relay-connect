import client from '@/lib/api/client';
import { SessionCreate, SessionRead, SessionUpdate } from '@/types/session';

export async function listChatSessions(limit: number = 50, offset: number = 0, title?: string): Promise<SessionRead[]> {
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

export async function createChatSession(session: SessionCreate): Promise<SessionRead> {
  const { data, error } = await client.POST('/api/v1/sessions/', {
    body: session,
  });
  if (error) {
    throw new Error(`Error creating chat session: ${error.detail}`);
  }
  return data;
}

export async function getChatSession(sessionId: string): Promise<SessionRead> {
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

export async function updateChatSession(sessionId: string, update: SessionUpdate): Promise<SessionRead> {
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
