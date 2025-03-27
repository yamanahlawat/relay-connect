/**
 * Interface representing processed content with think blocks extracted
 */
export interface ProcessedContent {
  type: 'regular' | 'think';
  thinkContent: string;
  regularContent: string;
  isComplete: boolean;
}

/**
 * Processes content to extract think blocks
 * @param content The content to process
 */
export function processThinkBlocks(content: string): ProcessedContent {
  // Default result
  const result: ProcessedContent = {
    type: 'regular',
    thinkContent: '',
    regularContent: content,
    isComplete: true,
  };

  // Check for think block tags
  const hasOpeningTag = content.includes('<think>');
  const hasClosingTag = content.includes('</think>');

  if (!hasOpeningTag && !hasClosingTag) {
    return result;
  }

  let thinkContent = '';
  let regularContent = '';

  if (hasOpeningTag) {
    const [beforeThink, ...rest] = content.split('<think>');
    regularContent = beforeThink || '';
    const afterThink = rest.join('<think>');

    if (hasClosingTag) {
      const [think, ...remaining] = afterThink.split('</think>');
      thinkContent = think || '';
      regularContent += remaining.join('</think>');
    } else {
      thinkContent = afterThink;
    }
  }

  return {
    type: hasClosingTag ? 'regular' : 'think',
    thinkContent: thinkContent.trim(),
    regularContent: regularContent.trim(),
    isComplete: hasOpeningTag && hasClosingTag,
  };
}
