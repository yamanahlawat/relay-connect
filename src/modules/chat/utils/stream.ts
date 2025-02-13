import { RawStreamBlock, StreamBlock } from '@/types/stream';

export function transformStreamBlock(block: RawStreamBlock): StreamBlock {
  return {
    type: block.type,
    content: block.content ?? undefined,
    toolName: block.tool_name ?? undefined,
    toolArgs: block.tool_args ?? undefined,
    toolCallId: block.tool_call_id ?? undefined,
    toolStatus: block.tool_status ?? undefined,
    errorType: block.error_type ?? undefined,
    errorDetail: block.error_detail ?? undefined,
  };
}

export async function* parseStream(
  reader: ReadableStreamDefaultReader<Uint8Array>
): AsyncGenerator<StreamBlock, void, unknown> {
  const decoder = new TextDecoder();
  let buffer = '';
  let offset = 0; // index into buffer for next search

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      // Append new decoded chunk to buffer
      buffer += decoder.decode(value, { stream: true });

      // Process as many complete JSON objects as possible
      while (true) {
        // Find the next opening brace starting at offset.
        const start = buffer.indexOf('{', offset);
        if (start === -1) {
          // No JSON start marker found – discard old data.
          buffer = '';
          offset = 0;
          break;
        }
        // Advance offset to the first '{' if there is extra garbage.
        if (start > offset) offset = start;

        // Look for a closing brace after the start.
        const end = buffer.indexOf('}', offset);
        if (end === -1) {
          // Incomplete JSON object; wait for more data.
          break;
        }

        const jsonStr = buffer.slice(offset, end + 1);
        try {
          const rawBlock = JSON.parse(jsonStr) as RawStreamBlock;
          yield transformStreamBlock(rawBlock);
          // Move offset past this object
          offset = end + 1;
        } catch (error) {
          console.warn('Error parsing chunk:', error);
          // On parse error, skip one character after the opening brace
          // so we don’t get stuck trying the same invalid snippet.
          offset = start + 1;
        }
      }
      // Remove processed portion of the buffer to avoid unbounded growth.
      if (offset > 0) {
        buffer = buffer.slice(offset);
        offset = 0;
      }
    }

    // After the stream ends, attempt one final parse.
    if (buffer.trim()) {
      try {
        const rawBlock = JSON.parse(buffer) as RawStreamBlock;
        yield transformStreamBlock(rawBlock);
      } catch (error) {
        console.warn('Error parsing final chunk:', error);
      }
    }
  } finally {
    reader.releaseLock();
  }
}
