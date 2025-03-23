// Common programming languages for the cascade
const codeLanguages = [
  'javascript',
  'typescript',
  'jsx',
  'tsx',
  'python',
  'java',
  'c',
  'cpp',
  'csharp',
  'go',
  'rust',
  'php',
  'ruby',
  'swift',
  'kotlin',
  'sql',
  'html',
  'css',
  'scss',
  'json',
  'yaml',
  'xml',
  'bash',
  'shell',
  'powershell',
];

/**
 * Central utility for code block detection and analysis
 */
export interface CodeAnalysis {
  hasCode: boolean; // Any code detected
  isMultiLine: boolean; // Code has multiple lines
  shouldShowCascade: boolean; // Should open code cascade
  language?: string; // Detected language if available
  lineCount: number; // Number of lines in code
}

/**
 * Analyzes code content and determines its properties
 */
export function analyzeCode(content: string, language?: string): CodeAnalysis {
  // Default result
  const result: CodeAnalysis = {
    hasCode: false,
    isMultiLine: false,
    shouldShowCascade: false,
    lineCount: 0,
    language,
  };

  if (!content || !content.trim()) {
    return result;
  }

  // Check for markdown code blocks (```...```)
  if (content.includes('```')) {
    const codeBlockRegex = /```(?:(\w+))?\s*([\s\S]*?)```/g;
    const matches = Array.from(content.matchAll(codeBlockRegex));

    if (matches.length > 0) {
      // Analyze each code block separately
      let hasMultiLineBlock = false;
      let codeBlockCount = 0;

      for (const match of matches) {
        codeBlockCount++;
        const codeContent = match[2] || '';
        const lines = codeContent.split('\n').filter((line) => line.trim()); // Count non-empty lines

        // If any code block has multiple lines, the content has multi-line code
        if (lines.length > 1) {
          hasMultiLineBlock = true;
        }
      }

      // Set properties based on the actual code blocks, not the entire content
      result.hasCode = true;
      result.isMultiLine = hasMultiLineBlock; // Only true if any actual code block has multiple lines
      result.language = matches[0][1] || language || 'text'; // Use first block's language as default

      // Only check shouldShowCascade if there's actual code
      if (codeBlockCount > 0) {
        const firstCodeBlock = matches[0][2] || '';
        const lines = firstCodeBlock.split('\n').filter((line) => line.trim());
        result.lineCount = lines.length;

        const isCodeLanguage = result.language && codeLanguages.includes(result.language.toLowerCase());

        // Update cascade criteria - notice we're using result.isMultiLine here which is based on actual code blocks
        result.shouldShowCascade =
          result.isMultiLine ||
          (isCodeLanguage && lines.length === 1 && firstCodeBlock.length > 60) ||
          (!isCodeLanguage && lines.length > 2) ||
          firstCodeBlock.length > 120;
      }

      return result;
    }
  }

  // Check for inline code
  const inlineCodeMatches = content.match(/`[^`]+`/g);
  if (inlineCodeMatches) {
    const inlineCode = inlineCodeMatches[0].replace(/^`|`$/g, '');
    const lines = inlineCode.split('\n');

    result.hasCode = true;
    result.lineCount = lines.length;
    result.isMultiLine = lines.length > 1;

    // Inline code should show cascade only if multi-line
    result.shouldShowCascade = result.isMultiLine;

    return result;
  }

  // For the content itself
  const lines = content.split('\n');
  result.lineCount = lines.length;
  result.isMultiLine = lines.length > 1;

  // If the content is directly code (not markdown)
  const isCodeLanguage = language && codeLanguages.includes(language.toLowerCase());
  if (content.trim()) {
    // Only set hasCode to true if:
    // 1. A language parameter was explicitly provided, or
    // 2. We're operating on a code block (which would have been handled above)
    result.hasCode = !!language; // Only consider it code if a language was specified

    // Only calculate shouldShowCascade if it's actually code
    if (result.hasCode) {
      result.shouldShowCascade =
        (isCodeLanguage && result.isMultiLine) ||
        (isCodeLanguage && lines.length === 1 && content.length > 60) ||
        (!isCodeLanguage && lines.length > 2) ||
        content.length > 120;
    }
  }

  return result;
}
