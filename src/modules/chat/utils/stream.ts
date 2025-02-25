import type { StreamBlock } from '@/types/stream';

export async function* parseStream(
  reader: ReadableStreamDefaultReader<Uint8Array>
): AsyncGenerator<StreamBlock, void, unknown> {
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        // Process any remaining complete lines in buffer
        const lines = buffer.split('\n');
        for (const line of lines) {
          const block = parseLine(line);
          if (block) yield block;
        }
        break;
      }

      // Append new chunk and split into lines
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      // Keep the last potentially incomplete line in buffer
      buffer = lines.pop() || '';

      // Process all complete lines
      for (const line of lines) {
        const block = parseLine(line);
        if (block) yield block;
      }
    }
  } catch (error) {
    console.error('Stream processing error:', error);
    // Yield error block
    const errorBlock: StreamBlock = {
      type: 'error',
      content: null,
      tool_name: null,
      tool_args: null,
      tool_call_id: null,
      tool_status: null,
      tool_result: null,
      error_type: 'stream_error',
      error_detail: error instanceof Error ? error.message : 'Unknown error',
      extra_data: null,
    };
    yield errorBlock;
  } finally {
    reader.releaseLock();
  }
}

function parseLine(line: string): StreamBlock | null {
  const trimmedLine = line.trim();
  if (!trimmedLine || trimmedLine === 'data: ') return null;

  try {
    // Remove 'data: ' prefix if present
    const jsonStr = trimmedLine.replace(/^data: /, '');
    const parsed = JSON.parse(jsonStr) as StreamBlock;

    // Basic validation
    if (parsed && typeof parsed === 'object' && 'type' in parsed && typeof parsed.type === 'string') {
      return parsed;
    }

    console.warn('Invalid stream block format:', parsed);
    return null;
  } catch (error) {
    console.warn('Error parsing stream block:', error, '\nLine:', trimmedLine);
    return null;
  }
}
