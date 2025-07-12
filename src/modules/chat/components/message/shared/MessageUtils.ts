import type { StreamBlock } from '@/types/stream';
import { useState } from 'react';

// Types for contextual grouping
export interface ContextualGroup {
  type: 'thinking' | 'tool_group' | 'content' | 'done';
  id: string;
  blocks: StreamBlock[];
  toolName?: string; // For individual tools within a group
}

// Contextual grouping - ONLY groups tools, excludes thinking blocks from final display
export const groupBlocksContextually = (blocks: StreamBlock[]): ContextualGroup[] => {
  const groups: ContextualGroup[] = [];
  let currentToolGroup: ContextualGroup | null = null;

  blocks.forEach((block, index) => {
    if (block.type === 'thinking') {
      // SKIP thinking blocks - they should not be in final display
      // Thinking is handled separately during streaming via StreamingIndicator
      return;
    }

    if (block.type === 'content' || block.type === 'done') {
      // Content and done blocks act as separators - end any current tool group
      currentToolGroup = null;

      // Add content/done as separate group
      groups.push({
        type: block.type,
        id: `${block.type}-${index}`,
        blocks: [block],
      });
    } else if (['tool_start', 'tool_call', 'tool_result'].includes(block.type)) {
      // Group consecutive tool blocks together
      if (!currentToolGroup) {
        currentToolGroup = {
          type: 'tool_group',
          id: `tool-group-${index}`,
          blocks: [block],
        };
        groups.push(currentToolGroup);
      } else {
        currentToolGroup.blocks.push(block);
      }
    }
  });

  return groups;
};

// Legacy grouping function for backward compatibility
export const groupBlocks = (blocks: StreamBlock[]) => {
  return blocks.reduce(
    (acc, block) => {
      if (block.type === 'content') {
        acc.content.push(block);
      } else if (block.type === 'thinking') {
        acc.thinking.push(block);
      } else if (block.type === 'done') {
        acc.done.push(block);
      } else if (['tool_start', 'tool_call', 'tool_result'].includes(block.type)) {
        const toolName = block.tool_name || 'Unknown Tool';
        if (!acc.tools[toolName]) {
          acc.tools[toolName] = [];
        }
        acc.tools[toolName].push(block);
      }
      return acc;
    },
    {
      content: [] as StreamBlock[],
      thinking: [] as StreamBlock[],
      done: [] as StreamBlock[],
      tools: {} as Record<string, StreamBlock[]>,
    }
  );
};

// Helper to group tool blocks by tool name within a tool group
export const groupToolsByName = (toolBlocks: StreamBlock[]) => {
  const toolGroups: Record<string, StreamBlock[]> = {};

  toolBlocks.forEach((block) => {
    if (['tool_start', 'tool_call', 'tool_result'].includes(block.type)) {
      const toolName = block.tool_name || 'Unknown Tool';
      if (!toolGroups[toolName]) {
        toolGroups[toolName] = [];
      }
      toolGroups[toolName].push(block);
    }
  });

  return toolGroups;
};

export const useToggleSection = () => {
  const [openSections, setOpenSections] = useState<Set<string>>(new Set());

  const toggleSection = (sectionId: string) => {
    setOpenSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  return { openSections, toggleSection, setOpenSections };
};

export const getToolBlocks = (toolBlocks: StreamBlock[]) => {
  return {
    hasResults: toolBlocks.some((block) => block.type === 'tool_result'),
    hasArgs: toolBlocks.some((block) => block.type === 'tool_call' && block.tool_args),
    callBlocks: toolBlocks.filter((block) => block.type === 'tool_call' && block.tool_args),
    resultBlocks: toolBlocks.filter((block) => block.type === 'tool_result'),
    toolCallId: toolBlocks.find((block) => block.type === 'tool_call' && block.tool_call_id)?.tool_call_id,
  };
};
