import { useMemo } from 'react';

/**
 * Map of LaTeX delimiters to their KaTeX equivalent
 */
interface DelimiterMap {
  pattern: RegExp;
  replaceWith: (content: string) => string;
  description: string;
}

/**
 * Predefined set of LaTeX delimiters to convert
 */
const DELIMITERS: DelimiterMap[] = [
  {
    // Block math: \[ ... \] -> $$ ... $$
    pattern: /\\\[([\s\S]*?)\\\]/g,
    replaceWith: (content: string) => `$$${content}$$`,
    description: 'block math \\[ ... \\]',
  },
  {
    // Inline math: \( ... \) -> $ ... $
    pattern: /\\\(([\s\S]*?)\\\)/g,
    replaceWith: (content: string) => `$${content}$`,
    description: 'inline math \\( ... \\)',
  },
  {
    // LaTeX begin/end equation: \begin{equation} ... \end{equation} -> $$ ... $$
    pattern: /\\begin\{equation\}([\s\S]*?)\\end\{equation\}/g,
    replaceWith: (content: string) => `$$${content}$$`,
    description: 'equation environment',
  },
  {
    // LaTeX begin/end align: \begin{align} ... \end{align} -> $$ ... $$
    pattern: /\\begin\{align\}([\s\S]*?)\\end\{align\}/g,
    replaceWith: (content: string) => `$$${content}$$`,
    description: 'align environment',
  },
  {
    // LaTeX displaymath: \begin{displaymath} ... \end{displaymath} -> $$ ... $$
    pattern: /\\begin\{displaymath\}([\s\S]*?)\\end\{displaymath\}/g,
    replaceWith: (content: string) => `$$${content}$$`,
    description: 'displaymath environment',
  },
  {
    // LaTeX math: \begin{math} ... \end{math} -> $ ... $
    pattern: /\\begin\{math\}([\s\S]*?)\\end\{math\}/g,
    replaceWith: (content: string) => `$${content}$`,
    description: 'math environment',
  },
  {
    // Direct LaTeX notation with backslash brackets
    pattern: /\\\\\[([\s\S]*?)\\\\\]/g,
    replaceWith: (content: string) => `$$${content}$$`,
    description: 'LaTeX backslash brackets',
  },
];

/**
 * Hook to process alternative LaTeX syntax in content
 * Converts common LaTeX delimiters to KaTeX compatible syntax
 *
 * @param content The content to process
 * @returns Processed content with standardized math delimiters
 */

/**
 * Process a single content fragment to fix common LaTeX issues
 * that may cause rendering problems
 *
 * @param content The LaTeX content to process
 * @returns Processed LaTeX content with fixed syntax
 */
function fixLatexContent(content: string): string {
  // Fix common LaTeX issues that might prevent proper rendering
  return (
    content
      // Ensure proper spacing in common math constructs
      .replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, '\\frac{$1}{$2}')
      // Fix spacing in limits
      .replace(/\\lim_\{([^{}]+)\}/g, '\\lim_{$1}')
      // Proper handling of subscripts and superscripts
      .replace(/([_^])\{([^{}]+)\}/g, '$1{$2}')
      // Fix common trigonometric functions
      .replace(/\\(sin|cos|tan|cot|sec|csc|log|ln|max|min|sup|inf|lim|det|gcd|lcm)\b/g, '\\$1')
      // Fix spacing in sqrt
      .replace(/\\sqrt\{([^{}]+)\}/g, '\\sqrt{$1}')
      // Fix vector notation
      .replace(/\\mathbf\{([^{}]+)\}/g, '\\mathbf{$1}')
      // Fix text in math mode
      .replace(/\\text\{([^{}]+)\}/g, '\\text{$1}')
      // Fix common operators
      .replace(/\\(sum|prod|int|oint)\b/g, '\\$1')
      // Preserve chemical equations
      .replace(/\\ce\{([^{}]+)\}/g, '\\ce{$1}')
  );
}

/**
 * Determines if content is likely to be inside a table cell with LaTeX notation
 *
 * @param content The content to check
 * @returns True if the content appears to be LaTeX inside a table cell
 */
function isContentLikelyInTable(content: string): boolean {
  return (
    /\|.*\\[a-zA-Z]+.*\|/.test(content) || // Pipe characters with LaTeX commands
    /\\frac\{.*\}\{.*\}/.test(content) || // Fraction notation
    /\\mathbf\{[a-zA-Z]\}.*\\cdot/.test(content) || // Vector dot product notation
    /\\left\(.*\\right\)/.test(content) || // Parentheses with left/right commands
    /\\text\{(comp|proj)\}/.test(content) || // Text commands for projection terminology
    /\|\\mathbf\{b\}\|/.test(content) || // Vector norm notation
    /\\frac\{\\mathbf\{a\}.*\\mathbf\{b\}\}/.test(content) // Vector fraction notation
  );
}

/**
 * Processes LaTeX content that isn't already wrapped in math delimiters
 *
 * @param content The content to process
 * @param isInTable Whether the content is likely in a table
 * @returns Processed content with appropriate math delimiters
 */
function processUnwrappedLatexContent(content: string, isInTable: boolean): string {
  // Handle multi-line or complex equations
  if (content.includes('\n') || content.length > 50 || content.includes('\\begin{')) {
    return `$$${content}$$`; // Block math
  }

  // Handle table content
  if (isInTable) {
    // Check if already wrapped in math delimiters
    const isAlreadyWrapped = /^\s*\$(.*)\$\s*$/.test(content);
    if (isAlreadyWrapped) {
      return content; // Already wrapped, return as is
    }

    // Check if it contains LaTeX notation that needs to be wrapped
    const containsLatexNotation = /\\frac|\\mathbf|\\left|\\right|\\text\{|\\cdot/.test(content);
    if (containsLatexNotation) {
      return `$${content}$`; // Wrap in inline math delimiters
    }

    return content; // No LaTeX notation, return as is
  }

  // Simple inline equations
  return `$${content}$`;
}

export function useLatexProcessor(content: string): string {
  return useMemo(() => {
    if (!content) {
      return '';
    }

    // Take a copy of the original content
    let result = content;

    // Process content to convert LaTeX syntax to KaTeX compatible syntax
    try {
      // First, normalize any LaTeX line breaks and spacing
      result = result
        // Convert double backslashes to KaTeX-friendly line breaks
        .replace(/\\\\(?!\]|\))/g, '\\\\');

      // Process each delimiter pattern
      for (const delimiter of DELIMITERS) {
        result = result.replace(delimiter.pattern, (match, capturedContent) => {
          try {
            // Use the captured content directly from regex groups when available
            if (capturedContent) {
              return delimiter.replaceWith(fixLatexContent(capturedContent));
            }

            // Fallback to old method if no capture group is matched
            const openTagLength =
              match.indexOf('{') > -1
                ? match.indexOf('}') + 1 // For \begin{...} style
                : 2; // For \[ or \( style

            const closeTagLength =
              match.lastIndexOf('\\') > -1
                ? match.length - match.lastIndexOf('\\') // For \end{...} style
                : 2; // For \] or \) style

            // Extract the content
            const content = match.substring(openTagLength, match.length - closeTagLength);

            // Fix any LaTeX issues and apply the replacement
            return delimiter.replaceWith(fixLatexContent(content));
          } catch (innerError) {
            console.warn(`Error processing ${delimiter.description}:`, innerError);
            return match; // Return unchanged if specific replacement fails
          }
        });
      }

      /**
       * Process raw LaTeX blocks that might not be properly delimited
       * We look for equation-like content not already in math delimiters
       * and wrap it appropriately
       */

      // Define patterns that indicate LaTeX mathematical notation
      const equationPatterns = [
        // Common equation patterns
        /\\frac\{[^{}]+\}\{[^{}]+\}/,
        /\\sum/,
        /\\int/,
        /\\prod/,
        /\\mathbf\{[^{}]+\}/,
        // Matrix notation
        /\\begin\{(matrix|pmatrix|bmatrix|vmatrix)\}/,
        // Alignment environments
        /\\begin\{(aligned|gather|cases)\}/,
        // Table-specific patterns - detect common LaTeX in tables
        /\\lvert.*\\rvert/,
        /\\lVert.*\\rVert/,
        /\\text\{(comp|proj)\}/,
        /\\cdot/,
        /\\mathbf\{[a-zA-Z]\}/,
        // Chemical equation notation (mhchem)
        /\\ce\{.*?\}/,
      ];

      /**
       * Special handling for table content with LaTeX notation
       * This detects if the content might be inside a table cell with LaTeX
       * by checking for common patterns found in mathematical tables
       */
      const isLikelyInTable = isContentLikelyInTable(result);

      // Check if content contains LaTeX notation but isn't wrapped in math delimiters
      const hasRawLatex = equationPatterns.some((pattern) => pattern.test(result));
      const isAlreadyInMathDelimiters = /^\s*\$\$|\$/.test(result.trim());

      if (hasRawLatex && !isAlreadyInMathDelimiters) {
        // Process content based on its characteristics
        result = processUnwrappedLatexContent(result, isLikelyInTable);

        // If we've already handled table content, return early
        if (isLikelyInTable) {
          return result;
        }
      }

      // Additional handling for inline math that might not be matched by the main patterns
      result = result.replace(/\\\(([^\\]|\\[^)])*?\\\)/g, (match) => {
        try {
          const content = match.substring(2, match.length - 2);
          return `$${fixLatexContent(content)}$`;
        } catch (error) {
          console.warn('Error processing inline math pattern:', error);
          return match;
        }
      });
    } catch (error) {
      console.error('Error in LaTeX processing:', error);
      return content; // Return original content on error
    }

    return result;
  }, [content]); // Memoize based on content changes only
}
