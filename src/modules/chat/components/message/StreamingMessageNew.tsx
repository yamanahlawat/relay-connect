import { cn } from '@/lib/utils';
import type { StreamBlock, StreamingMessageProps } from '@/types/stream';
import { Brain, CheckCircle2, Loader2, Terminal } from 'lucide-react';
import { memo, useEffect, useMemo, useRef } from 'react';
import { MarkdownRenderer } from '../markdown/MarkdownRenderer';

// Simple streaming tool indicator component
const StreamingToolIndicator = memo(function StreamingToolIndicator({
  toolName,
  status,
  isLast,
}: {
  toolName: string;
  status: 'starting' | 'executing' | 'completed';
  isLast: boolean;
}) {
  const getIcon = () => {
    if (status === 'completed') return CheckCircle2;
    if (status === 'executing' || isLast) return Loader2;
    return Terminal;
  };

  const getIconColor = () => {
    if (status === 'completed') return 'text-green-500';
    if (status === 'executing' || isLast) return 'text-blue-500';
    return 'text-amber-500';
  };

  const getBgColor = () => {
    if (status === 'completed') return 'bg-green-500/10';
    if (status === 'executing' || isLast) return 'bg-blue-500/10';
    return 'bg-amber-500/10';
  };

  const getStatusText = () => {
    if (status === 'completed') return 'completed';
    if (status === 'executing') return 'executing';
    return 'starting';
  };

  const Icon = getIcon();
  const shouldAnimate = (status === 'executing' || isLast) && status !== 'completed';

  return (
    <div className="flex items-center gap-3 py-2">
      <div className={cn('flex h-6 w-6 items-center justify-center rounded-full', getBgColor())}>
        <Icon className={cn('h-4 w-4', getIconColor(), shouldAnimate && 'animate-spin')} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm">
          <span className="capitalize">{getStatusText()}</span> <span className="font-medium">{toolName}</span>
          {shouldAnimate && <span className="ml-1">...</span>}
        </div>
      </div>
    </div>
  );
});

const StreamingMessageNew = memo(function StreamingMessageNew({ blocks, thinking }: StreamingMessageProps) {
  const prevBlocksRef = useRef<StreamBlock[]>([]);
  const isStreamingRef = useRef(true);

  // Check if we have new content to show streaming effect for
  useEffect(() => {
    // Don't reset streaming state if blocks are the same
    if (blocks.length === prevBlocksRef.current.length) return;

    // Check if we have a done block
    const doneBlock = blocks.find((block) => block.type === 'done');

    if (doneBlock) {
      // Add a small delay before stopping streaming to ensure smooth transition
      const timer = setTimeout(() => {
        isStreamingRef.current = false;
      }, 500);

      return () => clearTimeout(timer);
    } else {
      isStreamingRef.current = true;
    }

    prevBlocksRef.current = blocks;
  }, [blocks]);

  // Process blocks for streaming display
  const streamingDisplay = useMemo(() => {
    const display: Array<{
      type: 'thinking' | 'tool' | 'content';
      data: {
        content?: string;
        isStreaming?: boolean;
        toolName?: string;
        status?: 'starting' | 'executing' | 'completed';
        isLast?: boolean;
      };
      key: string;
    }> = [];

    // Add thinking if present
    if (thinking?.is_thinking && thinking.content) {
      display.push({
        type: 'thinking',
        data: { content: thinking.content, isStreaming: isStreamingRef.current },
        key: 'thinking',
      });
    }

    // Process tool blocks in order
    const toolMap = new Map<
      string,
      { status: 'starting' | 'executing' | 'completed'; name: string; calls: StreamBlock[] }
    >();

    blocks.forEach((block) => {
      if (block.type === 'tool_start' && block.tool_name) {
        toolMap.set(block.tool_name, {
          status: 'starting',
          name: block.tool_name,
          calls: [block],
        });
      } else if (block.type === 'tool_call' && block.tool_name) {
        const existing = toolMap.get(block.tool_name);
        if (existing) {
          existing.status = 'executing';
          existing.calls.push(block);
        } else {
          toolMap.set(block.tool_name, {
            status: 'executing',
            name: block.tool_name,
            calls: [block],
          });
        }
      } else if (block.type === 'tool_result' && block.tool_name) {
        const existing = toolMap.get(block.tool_name);
        if (existing) {
          existing.status = 'completed';
          existing.calls.push(block);
        }
      }
    });

    // Add tool indicators
    const toolEntries = Array.from(toolMap.entries());
    toolEntries.forEach(([toolName, toolData], index) => {
      const isLast = index === toolEntries.length - 1;
      display.push({
        type: 'tool',
        data: {
          toolName: toolData.name,
          status: toolData.status,
          isLast: isLast && isStreamingRef.current,
        },
        key: `tool-${toolName}`,
      });
    });

    // Add content blocks
    const contentBlocks = blocks.filter((block) => block.type === 'content');
    if (contentBlocks.length > 0) {
      const combinedContent = contentBlocks.map((block) => block.content as string).join('');

      if (combinedContent.trim()) {
        display.push({
          type: 'content',
          data: { content: combinedContent, isStreaming: isStreamingRef.current },
          key: 'content',
        });
      }
    }

    return display;
  }, [blocks, thinking]);

  return (
    <div className="space-y-3">
      {streamingDisplay.map((item) => {
        switch (item.type) {
          case 'thinking':
            return (
              <div key={item.key} className="flex items-start gap-3 py-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500/10">
                  <Brain className="h-4 w-4 text-blue-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mb-1 text-sm font-medium">Thought Process</div>
                  <div className="text-muted-foreground text-sm">
                    {item.data.content?.substring(0, 100)}
                    {(item.data.content?.length ?? 0) > 100 ? '...' : ''}
                  </div>
                </div>
              </div>
            );

          case 'tool':
            return (
              <StreamingToolIndicator
                key={item.key}
                toolName={item.data.toolName ?? ''}
                status={item.data.status ?? 'starting'}
                isLast={item.data.isLast ?? false}
              />
            );

          case 'content':
            return (
              <div key={item.key} className="prose prose-sm dark:prose-invert max-w-none">
                <MarkdownRenderer content={item.data.content ?? ''} isStreaming={item.data.isStreaming} />
                {item.data.isStreaming && <span className="ml-1 inline-block h-5 w-2 animate-pulse bg-current" />}
              </div>
            );

          default:
            return null;
        }
      })}
    </div>
  );
});

export default StreamingMessageNew;
