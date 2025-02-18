import type { RawStreamBlock, StreamBlock } from '@/types/stream';

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
    toolResult: block.tool_result ?? undefined,
    extraData: block.extra_data,
    message: block.message ?? undefined,
  };
}

export async function* parseStream(
  reader: ReadableStreamDefaultReader<Uint8Array>
): AsyncGenerator<StreamBlock, void, unknown> {
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      // Append new chunk to buffer
      buffer += decoder.decode(value, { stream: true });

      // Split on newlines and process each line immediately
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep last incomplete chunk in buffer

      for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine || trimmedLine === 'data: ') continue;

        try {
          // Remove 'data: ' prefix if present and parse
          const jsonStr = trimmedLine.replace(/^data: /, '');
          const rawBlock = JSON.parse(jsonStr) as RawStreamBlock;

          // Immediately yield the transformed block
          yield transformStreamBlock(rawBlock);
        } catch (error) {
          console.warn('Error parsing stream block:', error, '\nLine:', trimmedLine);
          continue;
        }
      }
    }

    // Process any remaining data in buffer
    if (buffer.trim()) {
      try {
        const jsonStr = buffer.trim().replace(/^data: /, '');
        const rawBlock = JSON.parse(jsonStr) as RawStreamBlock;
        yield transformStreamBlock(rawBlock);
      } catch (error) {
        console.warn('Error parsing final block:', error);
      }
    }
  } finally {
    reader.releaseLock();
  }
}
