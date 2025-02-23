import client from '@/lib/api/client';
import { MessageCreate, MessageRead, MessageUpdate } from '@/types/message';
import { paths } from './schema';

type BulkDeleteMessagesRequest =
  paths['/api/v1/messages/bulk/']['delete']['requestBody']['content']['application/json'];

/**
 * List all messages in a chat session
 */
export async function listSessionMessages(sessionId: string, limit = 10, offset = 0): Promise<MessageRead[]> {
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
 *
 * @param sessionId - UUID of the chat session
 * @param messageData - Message data to create
 * @returns Created message with complete details
 */
export async function createMessage(
  sessionId: string,
  messageData: Partial<MessageCreate> & Pick<MessageCreate, 'content'>
): Promise<MessageRead> {
  const { data, error } = await client.POST('/api/v1/messages/{session_id}/', {
    params: {
      path: { session_id: sessionId },
    },
    body: {
      content: messageData.content,
      role: messageData.role || 'user',
      status: messageData.status || 'pending',
      parent_id: messageData.parent_id || null,
      usage: messageData.usage || {
        input_tokens: 0,
        output_tokens: 0,
        input_cost: 0,
        output_cost: 0,
      },
      extra_data: messageData.extra_data || {},
      attachment_ids: messageData.attachment_ids || [],
    },
  });

  if (error) {
    throw new Error(`Error creating message: ${error.detail}`);
  }

  return data;
}

/**
 * Get a specific message by ID
 */
export async function getMessage(sessionId: string, messageId: string): Promise<MessageRead> {
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
export async function updateMessage(sessionId: string, messageId: string, update: MessageUpdate): Promise<MessageRead> {
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

/**
 * Bulk delete messages
 */
export async function deleteMessages(messageIds: BulkDeleteMessagesRequest): Promise<void> {
  const { error } = await client.DELETE('/api/v1/messages/bulk/', {
    body: messageIds,
  });
  if (error) {
    throw new Error(`Error deleting messages: ${error.detail}`);
  }
}
