import { memo } from 'react';
import { MarkdownRenderer } from '../markdown/MarkdownRenderer';
import ToolBlock from '../message/ToolBlock';

import type { StreamBlock } from '@/types/stream';

interface MessageDetailsProps {
  blocks: StreamBlock[];
}

const MessageDetails = memo(function MessageDetails({ blocks }: MessageDetailsProps) {
  return (
    <div className="space-y-4">
      {blocks.map((block, index) => {
        if (block.type === 'content') {
          return (
            <div key={`content-${index}`} className="prose prose-sm dark:prose-invert max-w-none">
              <MarkdownRenderer content={block.content as string} isStreaming={false} />
            </div>
          );
        }

        if (block.type === 'thinking') {
          return (
            <div key={`thinking-${index}`} className="text-muted-foreground flex items-center gap-2">
              <div className="flex items-center rounded-md px-3 py-2">
                <span className="flex text-sm">Thinking...</span>
              </div>
            </div>
          );
        }

        switch (block.type) {
          case 'tool_start':
            return (
              <div key={`${block.tool_call_id}-start`}>
                <ToolBlock type="tool_start" tool_name={block.tool_name} is_streaming={false} progressive_args={null} />
              </div>
            );

          case 'tool_call':
            return (
              <div key={`${block.tool_call_id}-call`}>
                <ToolBlock
                  type="tool_call"
                  tool_name={block.tool_name}
                  tool_args={block.tool_args}
                  is_streaming={false}
                  progressive_args={null}
                />
              </div>
            );

          case 'tool_result':
            return (
              <div key={`${block.tool_call_id}-result`}>
                <ToolBlock
                  type="tool_result"
                  tool_name={block.tool_name}
                  tool_result={block.tool_result}
                  is_error={false}
                  is_streaming={false}
                  progressive_args={null}
                />
              </div>
            );

          default:
            return null;
        }
      })}
    </div>
  );
});

export default MessageDetails;
