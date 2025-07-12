import type { StreamingMessageProps } from '@/types/stream';
import { memo } from 'react';
import { MarkdownRenderer } from '../markdown/MarkdownRenderer';
import StreamingIndicator from './StreamingIndicator';
import ToolGroup from './shared/ToolGroup';

const StreamingMessage = memo(function StreamingMessage({
  blocks,
  thinking,
  progressive_tool_args,
  message,
}: StreamingMessageProps) {
  const isStreaming = !blocks.some((block) => block.type === 'done');

  // Simple: if we have a done block, only show tools + final content
  const doneBlock = blocks.find((block) => block.type === 'done');
  if (doneBlock?.content) {
    const toolBlocks = blocks.filter((block) => ['tool_start', 'tool_call', 'tool_result'].includes(block.type));

    return (
      <div className="space-y-4">
        {toolBlocks.length > 0 && (
          <ToolGroup toolBlocks={toolBlocks} isStreaming={false} progressive_tool_args={progressive_tool_args} />
        )}
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <MarkdownRenderer content={doneBlock.content} isStreaming={false} />
        </div>
      </div>
    );
  }

  // Simple: group all blocks by type
  const toolBlocks = blocks.filter((block) => ['tool_start', 'tool_call', 'tool_result'].includes(block.type));
  const contentBlocks = blocks.filter((block) => block.type === 'content');

  return (
    <div className="space-y-4">
      {/* Thinking during streaming */}
      {thinking?.is_thinking && thinking.content && isStreaming && (
        <StreamingIndicator
          type="thinking"
          text={thinking.content.length > 100 ? `${thinking.content.substring(0, 100)}...` : thinking.content}
        />
      )}

      {/* Tools */}
      {toolBlocks.length > 0 && (
        <ToolGroup toolBlocks={toolBlocks} isStreaming={isStreaming} progressive_tool_args={progressive_tool_args} />
      )}

      {/* Content */}
      {contentBlocks.length > 0 && (
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <MarkdownRenderer content={contentBlocks.map((block) => block.content).join('')} isStreaming={isStreaming} />
          {isStreaming && <span className="ml-1 inline-block h-5 w-2 animate-pulse bg-current" />}
        </div>
      )}

      {/* Fallback to message content */}
      {!doneBlock && contentBlocks.length === 0 && message?.content?.trim() && (
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <MarkdownRenderer content={message.content} isStreaming={false} />
        </div>
      )}
    </div>
  );
});

export default StreamingMessage;
