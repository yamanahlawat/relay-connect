import client from '@/lib/api/client';
import type { paths } from '@/lib/api/schema';
import { MessageRead } from '@/types/chat';

type ListMessagesResponse =
  paths['/api/v1/messages/{session_id}/']['get']['responses']['200']['content']['application/json'];
type CreateMessageRequest =
  paths['/api/v1/messages/{session_id}/']['post']['requestBody']['content']['multipart/form-data'];
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
export async function createMessage(
  sessionId: string,
  messageData: Partial<CreateMessageRequest> & Pick<CreateMessageRequest, 'content'>
): Promise<MessageRead> {
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
