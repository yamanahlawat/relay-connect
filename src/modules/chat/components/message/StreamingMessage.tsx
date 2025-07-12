import type { StreamingMessageProps } from '@/types/stream';
import { memo, useEffect, useMemo } from 'react';
import { MarkdownRenderer } from '../markdown/MarkdownRenderer';
import StreamingIndicator from './StreamingIndicator';
import { groupBlocksContextually, useToggleSection } from './shared/MessageUtils';
import ToolGroup from './shared/ToolGroup';

const StreamingMessage = memo(function StreamingMessage({
  blocks,
  thinking,
  progressive_tool_args,
  message,
}: StreamingMessageProps) {
  const { openSections, toggleSection, setOpenSections } = useToggleSection();
  const isStreaming = !blocks.some((block) => block.type === 'done');

  // Use contextual grouping (excludes thinking blocks)
  const contextualGroups = useMemo(() => groupBlocksContextually(blocks), [blocks]);

  // Auto-open sections with progressive args
  useEffect(() => {
    if (!progressive_tool_args?.size) return;

    const sectionsToOpen = Array.from(progressive_tool_args.values())
      .filter((args) => !args.is_complete && args.accumulated_args)
      .map((args) => `tool-${args.tool_name || 'Unknown Tool'}`);

    if (sectionsToOpen.length > 0) {
      setOpenSections((prev) => new Set([...prev, ...sectionsToOpen]));
    }
  }, [progressive_tool_args, setOpenSections]);

  return (
    <div className="space-y-4">
      {/* Show thinking indicator during streaming only */}
      {thinking?.is_thinking && thinking.content && isStreaming && (
        <StreamingIndicator
          type="thinking"
          text={thinking.content.length > 100 ? `${thinking.content.substring(0, 100)}...` : thinking.content}
        />
      )}

      {/* Render contextual groups (no thinking groups since they're excluded) */}
      {contextualGroups.map((group) => {
        const sectionId = group.id;

        if (group.type === 'tool_group') {
          // Tool group with multiple tools
          return (
            <ToolGroup
              key={sectionId}
              toolBlocks={group.blocks}
              isOpen={openSections.has(sectionId)}
              onToggle={() => toggleSection(sectionId)}
              progressive_tool_args={progressive_tool_args}
              isStreaming={isStreaming}
            />
          );
        }

        if (group.type === 'content') {
          // Content blocks with streaming cursor
          return (
            <div key={sectionId} className="prose prose-sm dark:prose-invert max-w-none">
              {group.blocks.map((block, index) => (
                <MarkdownRenderer
                  key={`${sectionId}-${index}`}
                  content={block.content as string}
                  isStreaming={isStreaming}
                />
              ))}
              {isStreaming && <span className="ml-1 inline-block h-5 w-2 animate-pulse bg-current" />}
            </div>
          );
        }

        if (group.type === 'done') {
          // Done blocks (final response)
          return (
            <div key={sectionId} className="prose prose-sm dark:prose-invert max-w-none">
              {group.blocks.map((block, index) => (
                <MarkdownRenderer key={`${sectionId}-${index}`} content={block.content as string} isStreaming={false} />
              ))}
            </div>
          );
        }

        return null;
      })}

      {/* Fallback message content if no contextual groups have content */}
      {!contextualGroups.some((group) => group.type === 'done' || group.type === 'content') &&
        message?.content?.trim() && (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <MarkdownRenderer content={message.content} isStreaming={false} />
          </div>
        )}
    </div>
  );
});

export default StreamingMessage;
