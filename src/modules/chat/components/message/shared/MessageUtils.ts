import type { StreamBlock } from '@/types/stream';
import { useState } from 'react';

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
