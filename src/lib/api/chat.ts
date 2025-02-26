import client from '@/lib/api/client';
import { CompletionRequest, CompletionResponse, StreamParams } from '@/types/chat';

/**
 * Creates a one-time chat completion
 */
export async function complete(sessionId: string, request: CompletionRequest): Promise<CompletionResponse> {
  const { data, error } = await client.POST('/api/v1/chat/complete/{session_id}', {
    params: {
      path: { session_id: sessionId },
    },
    body: request,
  });

  if (error) {
    throw new Error(`Failed to complete chat message. Error: ${error.detail}`);
  }

  return data;
}

/**
 * Streams a chat completion for a given message.
 * Returns a reader that can be used to read the stream chunks.
 *
 * @example
 * const reader = await streamCompletion(sessionId, messageId);
 * try {
 *   while (true) {
 *     const { done, value } = await reader.read();
 *     if (done) break;
 *     const text = new TextDecoder().decode(value);
 *     // Handle streamed text...
 *   }
 * } finally {
 *   reader.releaseLock();
 * }
 */
export async function streamCompletion(
  sessionId: string,
  messageId: string,
  params?: StreamParams
): Promise<ReadableStreamDefaultReader<Uint8Array>> {
  const { response } = await client.GET('/api/v1/chat/complete/{session_id}/{message_id}/stream', {
    params: {
      path: {
        session_id: sessionId,
        message_id: messageId,
      },
      query: params,
    },
    parseAs: 'stream',
  });

  if (!response.ok) {
    throw new Error(response.statusText || 'Failed to stream response');
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('Stream reader not available');
  }

  return reader;
}

/**
 * Stops an ongoing chat completion for a session
 */
export async function stopChatCompletion(sessionId: string): Promise<void> {
  const { error } = await client.POST('/api/v1/chat/complete/{session_id}/stop', {
    params: {
      path: {
        session_id: sessionId,
      },
    },
  });

  if (error) {
    throw new Error(`Failed to stop chat completion: ${error.detail}`);
  }
}
