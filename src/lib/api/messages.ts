import client from '@/lib/api/client';
import type { paths } from '@/lib/api/schema';

type ListMessagesResponse =
  paths['/api/v1/messages/{session_id}/']['get']['responses']['200']['content']['application/json'];
type CreateMessageRequest =
  paths['/api/v1/messages/{session_id}/']['post']['requestBody']['content']['application/json'];
type CreateMessageResponse =
  paths['/api/v1/messages/{session_id}/']['post']['responses']['201']['content']['application/json'];
type GetMessageResponse =
  paths['/api/v1/messages/{session_id}/{message_id}/']['get']['responses']['200']['content']['application/json'];
type UpdateMessageRequest =
  paths['/api/v1/messages/{session_id}/{message_id}/']['patch']['requestBody']['content']['application/json'];
type UpdateMessageResponse =
  paths['/api/v1/messages/{session_id}/{message_id}/']['patch']['responses']['200']['content']['application/json'];

/**
 * List all messages in a chat session
 */
export async function listSessionMessages(sessionId: string, limit = 10, offset = 0): Promise<ListMessagesResponse> {
  const { data, error } = await client.GET('/api/v1/messages/{session_id}/', {
    params: {
      path: { session_id: sessionId },
      query: { limit, offset },
    },
  });
  if (error) {
    throw new Error(`Error fetching messages: ${error.detail}`);
  }
  return data;
}

/**
 * Create a new message in a chat session
 */
export async function createMessage(sessionId: string, message: CreateMessageRequest): Promise<CreateMessageResponse> {
  const { data, error } = await client.POST('/api/v1/messages/{session_id}/', {
    params: {
      path: { session_id: sessionId },
    },
    body: message,
  });
  if (error) {
    throw new Error(`Error creating message: ${error.detail}`);
  }
  return data;
}

/**
 * Get a specific message by ID
 */
export async function getMessage(sessionId: string, messageId: string): Promise<GetMessageResponse> {
  const { data, error } = await client.GET('/api/v1/messages/{session_id}/{message_id}/', {
    params: {
      path: {
        session_id: sessionId,
        message_id: messageId,
      },
    },
  });
  if (error) {
    throw new Error(`Error fetching message: ${error.detail}`);
  }
  return data;
}

/**
 * Update a specific message
 */
export async function updateMessage(
  sessionId: string,
  messageId: string,
  update: UpdateMessageRequest
): Promise<UpdateMessageResponse> {
  const { data, error } = await client.PATCH('/api/v1/messages/{session_id}/{message_id}/', {
    params: {
      path: {
        session_id: sessionId,
        message_id: messageId,
      },
    },
    body: update,
  });
  if (error) {
    throw new Error(`Error updating message: ${error.detail}`);
  }
  return data;
}

/**
 * Delete a specific message
 */
export async function deleteMessage(sessionId: string, messageId: string): Promise<void> {
  const { error } = await client.DELETE('/api/v1/messages/{session_id}/{message_id}/', {
    params: {
      path: {
        session_id: sessionId,
        message_id: messageId,
      },
    },
  });
  if (error) {
    throw new Error(`Error deleting message: ${error.detail}`);
  }
}
