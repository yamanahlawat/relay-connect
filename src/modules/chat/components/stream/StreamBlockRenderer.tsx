import { memo } from 'react';
import { MarkdownRenderer } from '../markdown/MarkdownRenderer';
import StreamingIndicator from '../message/StreamingIndicator';
import ToolBlock from '../message/ToolBlock';

import type { MessageRead } from '@/types/message';
import type { ContentItem } from '@/types/stream';

interface StreamBlockRendererProps {
  message: MessageRead;
  // If you still want an explicit prop for "streaming",
  // you can pass message.status === 'processing'
  // isStreaming?: boolean;
}

const StreamBlockRenderer = memo(function StreamBlockRenderer({ message }: StreamBlockRendererProps) {
  // Determine if we are still streaming
  // Alternatively, if you pass isStreaming explicitly, use that instead.
  const isStreaming = message.status === 'processing';

  // We expect partial aggregator data in `message.extra_data`.
  const extraData = message.extra_data ?? {};

  // This is the partial text accumulated during streaming
  const partialContent = (extraData.content as string) || '';

  // "Thinking" status from aggregator
  const thinking = extraData.thinking?.isThinking ? extraData.thinking : { isThinking: false };

  // Tools used during streaming (aggregator):
  // - activeTools: Tools that haven't completed yet
  // - completedTools: Tools that have finished
  const activeTools = Array.isArray(extraData.activeTools) ? extraData.activeTools : [];
  const completedToolsAggregator = Array.isArray(extraData.completedTools) ? extraData.completedTools : [];

  // Tools from the final message (non-streaming scenario or from the DB):
  // This is the "classic" array of tool executions once the message is fully complete.
  const completedToolsFinal = Array.isArray(extraData.tool_executions) ? extraData.tool_executions : [];

  // Decide which text content to show:
  // - If streaming, we typically show partialContent (chunked in)
  // - If fully completed, show message.content or partialContent if you prefer
  const finalContent = message.content || '';
  const displayedContent = isStreaming ? partialContent : finalContent || partialContent;

  return (
    <div className="space-y-4">
      {/* Thinking Indicator (only if aggregator says we are "thinking") */}
      {thinking.isThinking && (
        <div className="duration-300 animate-in fade-in-0">
          <StreamingIndicator type="thinking" text={thinking.content || 'Thinking...'} />
        </div>
      )}

      {/* Active Tools (streaming) */}
      {isStreaming &&
        activeTools.map((tool) => (
          <div key={tool.id} className="duration-300 animate-in slide-in-from-bottom-2">
            {/* Usually 'tool_start' or 'tool_call' shape */}
            <ToolBlock
              type={tool.status === 'starting' ? 'tool_start' : 'tool_call'}
              toolName={tool.name}
              args={tool.arguments}
              isStreaming={true}
            />
          </div>
        ))}

      {/* Completed Tools (from aggregator) during streaming */}
      {isStreaming &&
        completedToolsAggregator.map((tool) => {
          // tool.result might be a string or a ContentItem[]. Adjust as needed.
          return (
            <div key={tool.id} className="space-y-2">
              <ToolBlock type="tool_call" toolName={tool.name} args={tool.arguments} isStreaming={false} />
              {tool.result && (
                <ToolBlock
                  type="tool_result"
                  toolName={tool.name}
                  // Convert a string result to ContentItem[] if needed
                  result={typeof tool.result === 'string' ? [{ type: 'text', text: tool.result }] : tool.result}
                  isError={!!tool.error}
                  errorMessage={tool.error}
                  isStreaming={false}
                />
              )}
            </div>
          );
        })}

      {/* Completed Tools (final message) if not streaming */}
      {!isStreaming &&
        completedToolsFinal.map((tool) => (
          <div key={tool.id} className="space-y-2">
            <ToolBlock type="tool_call" toolName={tool.name} args={tool.arguments} isStreaming={false} />
            {tool.result && (
              <ToolBlock
                type="tool_result"
                toolName={tool.name}
                // If your final tool result is a string, wrap it in an array for Markdown:
                result={typeof tool.result === 'string' ? [{ type: 'text', text: tool.result }] : tool.result}
                isError={!!tool.error}
                errorMessage={tool.error}
                isStreaming={false}
              />
            )}
          </div>
        ))}

      {/* Main Content (Markdown) */}
      {displayedContent && !thinking.isThinking && (
        <div className="prose prose-sm dark:prose-invert max-w-none transition-all">
          <MarkdownRenderer content={displayedContent as string | ContentItem[]} isStreaming={isStreaming} />
        </div>
      )}
    </div>
  );
});

export default StreamBlockRenderer;
