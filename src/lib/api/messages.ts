import client from '@/lib/api/client';
import { MessageCreate, MessageRead, MessageUpdate } from '@/types/message';

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
 */
export async function createMessage(sessionId: string, messageData: MessageCreate): Promise<MessageRead> {
  const formData = new FormData();

  // Required field
  formData.append('content', messageData.content);

  // Optional fields with defaults as per schema
  formData.append('role', messageData.role || 'user');
  formData.append('status', messageData.status || 'pending');
  formData.append('usage', messageData.usage || '{}');
  formData.append('extra_data', messageData.extra_data || '{}');

  // Optional fields without defaults
  if (messageData.parent_id) {
    formData.append('parent_id', messageData.parent_id);
  }

  // Handle file attachments
  if (messageData.attachments?.length) {
    messageData.attachments.forEach((file) => {
      formData.append('attachments', file);
    });
  }

  const { data, error } = await client.POST('/api/v1/messages/{session_id}/', {
    params: {
      path: { session_id: sessionId },
    },
    body: formData,
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
