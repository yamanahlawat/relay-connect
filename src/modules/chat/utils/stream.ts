import type { ProgressiveToolArgs, StreamBlock } from '@/types/stream';

export async function* parseStream(
  reader: ReadableStreamDefaultReader<Uint8Array>
): AsyncGenerator<StreamBlock & { stream_index: number }, void, unknown> {
  const decoder = new TextDecoder();
  let buffer = '';
  let hasYieldedDone = false;
  let streamIndex = 0; // Track the order of blocks in the stream

  try {
    while (true) {
      // Break the loop if we already processed the done event
      if (hasYieldedDone) {
        break;
      }

      const { done, value } = await reader.read();

      if (done) {
        // Process any remaining complete lines in buffer
        const lines = buffer.split('\n').filter((line) => line.trim());
        for (const line of lines) {
          const block = parseLine(line);
          if (block) {
            if (block.type === 'done') {
              hasYieldedDone = true;
            }
            // Add stream_index to track original order
            yield { ...block, stream_index: streamIndex++ };
          }
        }
        break;
      }

      // Append new chunk and split into lines
      const chunk = decoder.decode(value, { stream: true });
      buffer += chunk;
      const lines = buffer.split('\n');
      // Keep the last potentially incomplete line in buffer
      buffer = lines.pop() || '';

      // Process all complete lines
      for (const line of lines) {
        if (!line.trim()) continue;

        const block = parseLine(line);
        if (block) {
          if (block.type === 'done') {
            hasYieldedDone = true;
          }
          // Add stream_index to track original order
          yield { ...block, stream_index: streamIndex++ };
        }
      }
    }
  } catch (error) {
    console.error('Stream processing error:', error);
    // Yield error block
    const errorBlock: StreamBlock & { stream_index: number } = {
      type: 'error',
      content: null,
      tool_name: null,
      tool_args: null,
      tool_call_id: null,
      tool_status: null,
      tool_result: null,
      error_type: 'stream_error',
      error_detail: error instanceof Error ? error.message : 'Unknown error',
      message: null,
      usage: null,
      timestamp: null,
      extra_data: null,
      stream_index: streamIndex++,
    };
    yield errorBlock;
  } finally {
    try {
      // Ensure we release the reader lock
      reader.releaseLock();
    } catch (e) {
      console.warn('Error releasing reader lock:', e);
    }
  }
}

function parseLine(line: string): StreamBlock | null {
  const trimmedLine = line.trim();
  if (!trimmedLine || trimmedLine === 'data: ') return null;

  try {
    // Remove 'data: ' prefix if present
    const jsonStr = trimmedLine.replace(/^data: /, '');

    // Handle potential JSON parsing errors more robustly
    let parsed;
    try {
      parsed = JSON.parse(jsonStr);
    } catch (parseError) {
      console.warn('JSON parse error:', parseError, '\nRaw JSON:', jsonStr);
      return null;
    }

    // More comprehensive validation of block structure
    if (parsed && typeof parsed === 'object') {
      if ('type' in parsed && typeof parsed.type === 'string') {
        // Ensure all required fields exist with proper defaults
        const block: StreamBlock = {
          type: parsed.type,
          content: 'content' in parsed ? parsed.content : null,
          tool_name: 'tool_name' in parsed ? parsed.tool_name : null,
          tool_args: 'tool_args' in parsed ? parsed.tool_args : null,
          tool_call_id: 'tool_call_id' in parsed ? parsed.tool_call_id : null,
          tool_status: 'tool_status' in parsed ? parsed.tool_status : null,
          tool_result: 'tool_result' in parsed ? parsed.tool_result : null,
          error_type: 'error_type' in parsed ? parsed.error_type : null,
          error_detail: 'error_detail' in parsed ? parsed.error_detail : null,
          message: 'message' in parsed ? parsed.message : null,
          usage: 'usage' in parsed ? parsed.usage : null,
          timestamp: 'timestamp' in parsed ? parsed.timestamp : null,
          extra_data: 'extra_data' in parsed ? parsed.extra_data : null,
          // Add any additional fields from the original object
          ...parsed,
        };

        return block;
      }
    }

    console.warn('Invalid stream block format:', parsed);
    return null;
  } catch (error) {
    console.warn('Error parsing stream block:', error, '\nLine:', trimmedLine);
    return null;
  }
}

/**
 * Utility functions for handling progressive tool args accumulation
 */
export class ProgressiveToolArgsManager {
  private argsMap = new Map<string, ProgressiveToolArgs>();

  /**
   * Process a tool_call block and accumulate args
   */
  processToolCallBlock(block: StreamBlock): ProgressiveToolArgs | null {
    if (block.type !== 'tool_call' || !block.tool_call_id) {
      return null;
    }

    const existing = this.argsMap.get(block.tool_call_id);
    const contentDelta = (block.content as string) || '';

    // Initialize or update the progressive args
    const progressiveArgs: ProgressiveToolArgs = {
      tool_call_id: block.tool_call_id,
      tool_name: block.tool_name || existing?.tool_name || '',
      accumulated_args: (existing?.accumulated_args || '') + contentDelta,
      parsed_args: block.tool_args || existing?.parsed_args || null,
      is_complete: !!block.tool_args, // Complete when tool_args is present
      is_valid_json: false,
    };

    // Try to parse the accumulated args as JSON
    try {
      if (progressiveArgs.accumulated_args.trim()) {
        JSON.parse(progressiveArgs.accumulated_args);
        progressiveArgs.is_valid_json = true;
      }
    } catch {
      progressiveArgs.is_valid_json = false;
    }

    // Update the map
    this.argsMap.set(block.tool_call_id, progressiveArgs);

    return progressiveArgs;
  }

  /**
   * Get current progressive args for a tool call
   */
  getProgressiveArgs(toolCallId: string): ProgressiveToolArgs | null {
    return this.argsMap.get(toolCallId) || null;
  }

  /**
   * Clear progressive args for a tool call
   */
  clearProgressiveArgs(toolCallId: string): void {
    this.argsMap.delete(toolCallId);
  }

  /**
   * Clear all progressive args
   */
  clearAll(): void {
    this.argsMap.clear();
  }
}
