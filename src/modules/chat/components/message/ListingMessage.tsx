import type { StreamingMessageRead } from '@/types/message';
import type { StreamBlock } from '@/types/stream';
import { memo } from 'react';
import { MarkdownRenderer } from '../markdown/MarkdownRenderer';
import StreamingIndicator from './StreamingIndicator';
import ToolGroup from './shared/ToolGroup';

interface ListingMessageProps {
  blocks: StreamBlock[];
  thinking?: {
    is_thinking: boolean;
    content?: string;
  };
  message?: StreamingMessageRead;
}

const ListingMessage = memo(function ListingMessage({ blocks, thinking, message }: ListingMessageProps) {
  // Separate blocks by type
  const contentBlocks = blocks.filter((block) => block.type === 'content');
  const doneBlocks = blocks.filter((block) => block.type === 'done');
  const toolBlocks = blocks.filter((block) => ['tool_start', 'tool_call', 'tool_result'].includes(block.type));

  return (
    <div className="space-y-4">
      {/* Thinking indicator */}
      {thinking?.is_thinking && thinking.content && (
        <StreamingIndicator
          type="thinking"
          text={thinking.content.length > 100 ? `${thinking.content.substring(0, 100)}...` : thinking.content}
        />
      )}

      {/* Tool blocks */}
      {toolBlocks.length > 0 && <ToolGroup toolBlocks={toolBlocks} isStreaming={false} />}

      {/* Content blocks (prioritize done blocks over content blocks) */}
      {doneBlocks.length > 0 ? (
        <div className="prose prose-sm dark:prose-invert max-w-none">
          {doneBlocks.map((block, index) => (
            <MarkdownRenderer key={`done-${index}`} content={block.content as string} isStreaming={false} />
          ))}
        </div>
      ) : contentBlocks.length > 0 ? (
        <div className="prose prose-sm dark:prose-invert max-w-none">
          {contentBlocks.map((block, index) => (
            <MarkdownRenderer key={`content-${index}`} content={block.content as string} isStreaming={false} />
          ))}
        </div>
      ) : message?.content?.trim() ? (
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <MarkdownRenderer content={message.content} isStreaming={false} />
        </div>
      ) : null}
    </div>
  );
});

export default ListingMessage;
