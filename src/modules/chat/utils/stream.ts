import type { StreamBlock } from '@/types/stream';

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
          // Parse directly as StreamBlock since we're using snake_case throughout
          yield JSON.parse(jsonStr) as StreamBlock;
        } catch (error) {
          console.warn('Error parsing stream block:', error, '\nLine:', trimmedLine);
          continue;
        }
      }
    }

    // Process any remaining data
    if (buffer.trim()) {
      try {
        const jsonStr = buffer.trim().replace(/^data: /, '');
        yield JSON.parse(jsonStr) as StreamBlock;
      } catch (error) {
        console.warn('Error parsing final stream block:', error);
      }
    }
  } finally {
    reader.releaseLock();
  }
}
