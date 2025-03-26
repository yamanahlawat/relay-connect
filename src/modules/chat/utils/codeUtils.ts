// Common programming languages that should trigger the code cascade
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

      // Set properties based on the actual code blocks
      result.hasCode = true;
      result.isMultiLine = hasMultiLineBlock;
      result.language = matches[0] && matches[0][1] ? matches[0][1] : language || 'text';

      // Only check shouldShowCascade if there's actual code
      if (codeBlockCount > 0) {
        const firstCodeBlock = matches[0] && matches[0][2] ? matches[0][2] : '';
        const lines = firstCodeBlock.split('\n').filter((line) => line.trim());
        result.lineCount = lines.length;

        // Determine if language is in our supported code languages
        const isCodeLanguage = result.language && codeLanguages.includes(result.language.toLowerCase());

        // Only show cascade for recognized code languages
        if (isCodeLanguage) {
          // For recognized code languages, apply more detailed criteria
          result.shouldShowCascade = result.isMultiLine || (lines.length === 1 && firstCodeBlock.length > 60);
        } else {
          // For non-code languages, never show cascade
          result.shouldShowCascade = false;
        }
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

    // Only show cascade for multi-line inline code if a language is explicitly provided
    // and that language is in our supported code languages
    const isCodeLanguage = language && codeLanguages.includes(language.toLowerCase());
    result.shouldShowCascade = result.isMultiLine && isCodeLanguage;

    return result;
  }

  // For the content itself (not in markdown code blocks)
  const lines = content.split('\n');
  result.lineCount = lines.length;
  result.isMultiLine = lines.length > 1;

  // Check if this is a recognized code language
  const isCodeLanguage = language && codeLanguages.includes(language.toLowerCase());

  if (content.trim()) {
    // Only set hasCode to true if a language parameter was explicitly provided
    result.hasCode = !!language;

    // Only show cascade for recognized code languages
    if (isCodeLanguage) {
      result.shouldShowCascade = result.isMultiLine || (lines.length === 1 && content.length > 60);
    } else {
      result.shouldShowCascade = false;
    }
  }

  return result;
}
