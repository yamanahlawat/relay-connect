import { MessageRead } from '@/types/message';
import { StreamBlock, StreamBlockType, ToolExecution } from '@/types/stream';
import { memo, useMemo } from 'react';
import { MarkdownRenderer } from '../markdown/MarkdownRenderer';
import StreamingIndicator from '../message/StreamingIndicator';
import ToolBlock from '../message/ToolBox';

interface StreamBlockRendererProps {
  message: MessageRead;
  isStreaming?: boolean;
}

interface ParsedContent {
  type: StreamBlockType;
  content?: string;
  toolName?: string;
  toolArgs?: Record<string, unknown>;
  completedTools: ToolExecution[];
  activeTool: ActiveTool | null;
  thinkingText?: string;
  error?: ErrorState;
}

interface ActiveTool {
  id: string;
  name: string;
  status: 'tool_start' | 'tool_call';
  arguments?: Record<string, unknown>;
}

interface ErrorState {
  type: string;
  detail: string;
}

// Memoized components for better performance
const ThinkingIndicator = memo(function ThinkingIndicator({ content }: { content?: string }) {
  return (
    <div className="duration-300 animate-in fade-in-0">
      <StreamingIndicator type="thinking" text={content} />
    </div>
  );
});

const ActiveToolBlock = memo(function ActiveToolBlock({ tool }: { tool: ActiveTool }) {
  return (
    <div className="duration-300 animate-in slide-in-from-bottom-2">
      <ToolBlock type={tool.status} toolName={tool.name} args={tool.arguments} isStreaming={true} />
    </div>
  );
});

const CompletedToolBlock = memo(function CompletedToolBlock({ tool }: { tool: ToolExecution }) {
  const parsedArgs = useMemo(() => {
    if (typeof tool.arguments === 'string') {
      try {
        return JSON.parse(tool.arguments);
      } catch {
        return tool.arguments;
      }
    }
    return tool.arguments;
  }, [tool.arguments]);

  return (
    <div className="duration-300 animate-in slide-in-from-bottom-2">
      <ToolBlock type="tool_call" toolName={tool.name} args={parsedArgs} />
      {tool.result && (
        <ToolBlock
          type="tool_result"
          toolName={tool.name}
          result={tool.result}
          isError={!!tool.error}
          errorMessage={tool.error}
        />
      )}
    </div>
  );
});

const ContentBlock = memo(function ContentBlock({ content, isStreaming }: { content: string; isStreaming?: boolean }) {
  return (
    <div className="duration-300 animate-in fade-in-0">
      <div className="prose prose-sm dark:prose-invert max-w-none transition-all">
        <MarkdownRenderer content={content} isStreaming={isStreaming} />
      </div>
    </div>
  );
});

const ErrorBlock = memo(function ErrorBlock({ error }: { error: ErrorState }) {
  return (
    <div className="text-red-500 duration-300 animate-in fade-in-0">
      <p className="font-medium">{error.type}</p>
      <p className="text-sm opacity-90">{error.detail}</p>
    </div>
  );
});

// Helper functions for parsing and state management
const parseStreamContent = (content: string): StreamBlock | null => {
  try {
    return JSON.parse(content) as StreamBlock;
  } catch {
    return null;
  }
};

const createParsedContent = (parsed: StreamBlock | null, isProcessing: boolean): ParsedContent => {
  if (!parsed) {
    return {
      type: 'content',
      content: '',
      completedTools: [],
      activeTool: null,
    };
  }

  return {
    type: parsed.type,
    content: parsed.content,
    toolName: parsed.toolName,
    toolArgs: parsed.toolArgs,
    completedTools: parsed.extraData?.completedTools || [],
    activeTool: parsed.extraData?.activeTool
      ? {
          ...parsed.extraData.activeTool,
          status: parsed.extraData.activeTool.status === 'starting' ? 'tool_start' : 'tool_call',
        }
      : null,
    thinkingText: parsed.type === 'thinking' || isProcessing ? (parsed.content as string) : undefined,
    error:
      parsed.type === 'error'
        ? {
            type: parsed.errorType as string,
            detail: parsed.errorDetail as string,
          }
        : undefined,
  };
};

// Main component with performance optimizations
export const StreamBlockRenderer = memo(function StreamBlockRenderer({
  message,
  isStreaming,
}: StreamBlockRendererProps) {
  const state = useMemo(() => {
    // Handle completed messages with tool executions
    if (!isStreaming && message.extra_data?.tool_executions) {
      return {
        type: 'content' as StreamBlockType,
        content: message.content,
        completedTools: message.extra_data.tool_executions,
        activeTool: null,
        thinkingText: undefined,
      } as ParsedContent;
    }

    const parsed = parseStreamContent(message.content);
    const isProcessing = typeof parsed?.content === 'string' && parsed.content.includes('Processing');

    return createParsedContent(parsed, isProcessing);
  }, [message.content, message.extra_data, isStreaming]);

  // Render completed message with tools
  if (!isStreaming && state.type === 'content' && message.extra_data?.tool_executions) {
    return (
      <div className="space-y-4">
        {message.extra_data.tool_executions.map((tool: ToolExecution) => (
          <CompletedToolBlock key={tool.id} tool={tool} />
        ))}
        {state.content && <ContentBlock content={state.content} />}
      </div>
    );
  }

  // Render streaming content
  return (
    <div className="space-y-4">
      {isStreaming && state.type === 'thinking' && <ThinkingIndicator content={state.content} />}

      {state.activeTool && <ActiveToolBlock tool={state.activeTool} />}

      {state.completedTools.map((tool) => (
        <CompletedToolBlock key={tool.id} tool={tool} />
      ))}

      {state.content && state.type === 'content' && <ContentBlock content={state.content} isStreaming={isStreaming} />}

      {state.error && <ErrorBlock error={state.error} />}
    </div>
  );
});

export default StreamBlockRenderer;
