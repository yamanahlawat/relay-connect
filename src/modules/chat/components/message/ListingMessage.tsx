import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import type { StreamingMessageRead } from '@/types/message';
import type { StreamBlock } from '@/types/stream';
import { Brain, ChevronDown } from 'lucide-react';
import { memo, useMemo } from 'react';
import { MarkdownRenderer } from '../markdown/MarkdownRenderer';
import { groupBlocksContextually, useToggleSection } from './shared/MessageUtils';
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
  const { openSections, toggleSection } = useToggleSection();
  const contextualGroups = useMemo(() => groupBlocksContextually(blocks), [blocks]);

  return (
    <div className="space-y-4">
      {/* Thinking Process Section */}
      {thinking?.is_thinking && thinking.content && (
        <Collapsible
          open={openSections.has('thinking')}
          onOpenChange={() => toggleSection('thinking')}
          className="bg-muted/20 rounded-lg border"
        >
          <CollapsibleTrigger className="hover:bg-muted/30 flex w-full items-center gap-3 p-4 text-left transition-colors">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/10">
              <Brain className="h-4 w-4 text-blue-500" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium">Thought Process</div>
              <div className="text-muted-foreground text-xs">Click to view reasoning</div>
            </div>
            <ChevronDown
              className={cn(
                'text-muted-foreground h-4 w-4 shrink-0 transition-transform duration-200',
                openSections.has('thinking') && 'rotate-180'
              )}
            />
          </CollapsibleTrigger>
          <CollapsibleContent className="px-4 pb-4">
            <div className="prose prose-sm dark:prose-invert max-w-none text-sm">
              <MarkdownRenderer content={thinking.content} isStreaming={false} />
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Render contextual groups */}
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
              isStreaming={false}
            />
          );
        }

        if (group.type === 'content') {
          // Content blocks
          return (
            <div key={sectionId} className="prose prose-sm dark:prose-invert max-w-none">
              {group.blocks.map((block, index) => (
                <MarkdownRenderer key={`${sectionId}-${index}`} content={block.content as string} isStreaming={false} />
              ))}
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

      {/* Final Message Content - show if we have message content but no content blocks */}
      {!contextualGroups.some((group) => group.type === 'done' || group.type === 'content') &&
        message?.content?.trim() && (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <MarkdownRenderer content={message.content} isStreaming={false} />
          </div>
        )}
    </div>
  );
});

export default ListingMessage;
