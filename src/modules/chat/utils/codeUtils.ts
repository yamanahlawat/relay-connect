/**
 * Determines if content contains code blocks or substantial code snippets
 */
export function containsCodeBlocks(content: string): boolean {
  // Check for markdown code blocks (```...```)
  if (content.includes('```')) return true;

  // Check for multi-line inline code
  const inlineCodeMatches = content.match(/`[^`]+`/g);
  if (inlineCodeMatches?.some((match) => match.split('\n').length > 1)) return true;

  return false;
}

/**
 * Determines if a code block should be displayed as a CTA
 * Focuses primarily on line count rather than character length
 */
export function shouldShowCodeCTA(code: string, language?: string): boolean {
  if (!code.trim()) return false;

  const codeLines = code.split('\n');
  const lineCount = codeLines.length;

  // Common programming languages that benefit from the code cascade
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

  // Is this a recognized programming language?
  const isCodeLanguage = language && codeLanguages.includes(language.toLowerCase());

  // Decision logic prioritizing line count:

  // For any recognized programming language:
  if (isCodeLanguage) {
    // Show CTA if it has multiple lines
    if (lineCount > 1) return true;

    // For single-line code, only show CTA if it's quite long
    if (lineCount === 1 && code.length > 60) return true;
  }
  // For non-code blocks (text, markdown, etc.):
  else {
    // Only show CTA if it has 3+ lines
    if (lineCount > 2) return true;

    // Or if it's very long (rare case for single/double line text blocks)
    if (code.length > 120) return true;
  }

  return false;
}
