import { MessageRead } from '@/types/message';
import { StreamBlock, ToolExecution } from '@/types/stream';
import { useMemo } from 'react';
import { MarkdownRenderer } from '../markdown/MarkdownRenderer';
import StreamingIndicator from '../message/StreamingIndicator';
import ToolBlock from '../message/ToolBox';

interface StreamBlockRendererProps {
  message: MessageRead;
  isStreaming?: boolean;
}

interface ParsedContent {
  type: 'thinking' | 'content' | 'error';
  content?: string;
  toolName?: string;
  toolArgs?: Record<string, unknown>;
  completedTools: ToolExecution[];
  activeTool: {
    id: string;
    name: string;
    status: 'starting' | 'calling' | 'processing';
    arguments?: Record<string, unknown>;
  } | null;
  thinkingText?: string;
  error?: {
    type: string;
    detail: string;
  };
}

export default function StreamBlockRenderer({ message, isStreaming }: StreamBlockRendererProps) {
  const state = useMemo(() => {
    // Handle completed messages with tool executions
    if (!isStreaming && message.extra_data?.tool_executions) {
      return {
        type: 'content',
        content: message.content,
        completedTools: message.extra_data.tool_executions,
        activeTool: null,
        thinkingText: undefined,
      } as ParsedContent;
    }

    try {
      const parsed = JSON.parse(message.content) as StreamBlock;
      const isThinking = parsed.type === 'thinking';
      const isProcessing = typeof parsed.content === 'string' && parsed.content.includes('Processing');

      return {
        type: parsed.type as ParsedContent['type'],
        content: parsed.content,
        toolName: parsed.toolName,
        toolArgs: parsed.toolArgs,
        completedTools: parsed.extraData?.completedTools || [],
        activeTool: parsed.extraData?.activeTool || null,
        thinkingText: isThinking || isProcessing ? (parsed.content as string) : undefined,
        error:
          parsed.type === 'error'
            ? {
                type: parsed.errorType as string,
                detail: parsed.errorDetail as string,
              }
            : undefined,
      } as ParsedContent;
    } catch {
      // Fallback for unparseable content
      return {
        type: 'content',
        content: message.content,
        completedTools: [],
        activeTool: null,
      } as ParsedContent;
    }
  }, [message.content, message.extra_data, isStreaming]);

  // If it's a completed message with markdown content and tool executions,
  // we render it differently from streaming messages
  if (!isStreaming && state.type === 'content' && message.extra_data?.tool_executions) {
    return (
      <div className="space-y-4">
        {/* Tool Executions for completed messages */}
        {message.extra_data.tool_executions.map((tool: ToolExecution) => (
          <div key={tool.id} className="duration-300">
            <ToolBlock
              type="call"
              toolName={tool.name}
              args={typeof tool.arguments === 'string' ? JSON.parse(tool.arguments) : tool.arguments}
            />
            {tool.result && (
              <ToolBlock
                type="result"
                toolName={tool.name}
                result={tool.result}
                isError={!!tool.error}
                errorMessage={tool.error}
              />
            )}
          </div>
        ))}

        {/* Main content */}
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <MarkdownRenderer content={state.content || ''} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Thinking Indicator - Show when streaming and either in thinking state or has thinking text */}
      {isStreaming && state.type === 'thinking' && (
        <div className="duration-300 animate-in fade-in-0">
          <StreamingIndicator type="thinking" text={state.content} />
        </div>
      )}

      {/* Active Tool */}
      {state.activeTool && (
        <div className="duration-300 animate-in slide-in-from-bottom-2">
          <ToolBlock
            type={state.activeTool.status === 'starting' ? 'process' : 'call'}
            toolName={state.activeTool.name}
            args={state.activeTool.arguments}
            isStreaming={true}
          />
        </div>
      )}

      {/* Completed Tools */}
      {state.completedTools.map((tool: ToolExecution) => (
        <div key={tool.id} className="duration-300 animate-in slide-in-from-bottom-2">
          <ToolBlock
            type="call"
            toolName={tool.name}
            args={typeof tool.arguments === 'string' ? JSON.parse(tool.arguments) : tool.arguments}
          />
          {tool.result && (
            <ToolBlock
              type="result"
              toolName={tool.name}
              result={tool.result}
              isError={!!tool.error}
              errorMessage={tool.error}
            />
          )}
        </div>
      ))}

      {/* Main Content */}
      {state.content && state.type === 'content' && (
        <div className="duration-300 animate-in fade-in-0">
          <div className="prose prose-sm dark:prose-invert max-w-none transition-all">
            <MarkdownRenderer content={state.content} isStreaming={isStreaming} />
          </div>
        </div>
      )}

      {/* Error State */}
      {state.error && (
        <div className="text-red-500 duration-300 animate-in fade-in-0">
          <p className="font-medium">{state.error.type}</p>
          <p className="text-sm opacity-90">{state.error.detail}</p>
        </div>
      )}
    </div>
  );
}
