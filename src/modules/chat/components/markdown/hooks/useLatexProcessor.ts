import { useEffect, useState } from 'react';

/**
 * Hook to process alternative LaTeX syntax in content
 * Converts \[...\] to $$...$$ and \(...\) to $...$ for compatibility
 *
 * @param content The content to process
 * @returns Processed content with standardized math delimiters
 */
export function useLatexProcessor(content: string): string {
  const [processedContent, setProcessedContent] = useState<string>(content || '');

  useEffect(() => {
    if (!content) {
      setProcessedContent('');
      return;
    }

    let result = content;

    // Process content to convert LaTeX syntax to KaTeX compatible syntax
    try {
      // Replace block math delimiters: \[...\] -> $$...$$
      // Match any character including newlines without using 's' flag
      result = result.replace(/\\\[(.|\n|\r)*?\\\]/g, function (match) {
        // Extract content between \[ and \]
        const content = match.substring(2, match.length - 2);
        return '$$' + content + '$$';
      });

      // Replace inline math delimiters: \(...\) -> $...$
      result = result.replace(/\\\((.|\n|\r)*?\\\)/g, function (match) {
        // Extract content between \( and \)
        const content = match.substring(2, match.length - 2);
        return '$' + content + '$';
      });
    } catch (error) {
      console.error('Error processing LaTeX content:', error);
      // Return original content on error
      result = content;
    }

    setProcessedContent(result);
  }, [content]);

  return processedContent;
}
