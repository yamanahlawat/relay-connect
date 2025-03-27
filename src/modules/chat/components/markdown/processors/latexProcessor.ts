/**
 * Processes markdown content to convert various LaTeX formats
 * into proper math dollar-sign notation for rendering by rehype-katex
 */
export function processLatexContent(content: string): string {
  let processedContent = content;

  // 1. Replace ```katex or ```latex blocks with dollar sign notation
  processedContent = processedContent.replace(/```(?:katex|latex|math)\s*([\s\S]*?)```/g, (_, mathContent) => {
    // Check if this is a full LaTeX document with \documentclass
    if (mathContent.includes('\\documentclass') && mathContent.includes('\\begin{document}')) {
      return processFullLatexDocument(mathContent);
    }

    const lines = mathContent.split('\n').filter((line: string) => line.trim());

    if (lines.length === 1) {
      return `$${lines[0].trim()}$`;
    } else {
      return `$$\n${mathContent.trim()}\n$$`;
    }
  });

  // 2. Replace \[ and \] LaTeX display math delimiters with $$ notation
  processedContent = processedContent.replace(/\\\[\s*([\s\S]*?)\\\]/g, (_, mathContent) => {
    return `$$${mathContent.trim()}$$`;
  });

  // 3. Replace \( and \) LaTeX inline math delimiters with $ notation
  processedContent = processedContent.replace(/\\\(\s*([\s\S]*?)\\\)/g, (_, mathContent) => {
    return `$${mathContent.trim()}$`;
  });

  // 4. Specific replacements for certain patterns in our content
  processedContent = processedContent.replace(/\\mathlarger\\mathlarger\\mathlarger/g, '\\mathlarger');

  return processedContent;
}

/**
 * Process a full LaTeX document and convert it to markdown with proper math notation
 */
function processFullLatexDocument(latexContent: string): string {
  let output = '';

  // Extract title
  const titleMatch = latexContent.match(/\\title\{(.*?)\}/);
  if (titleMatch && titleMatch[1]) {
    output += `# ${titleMatch[1].replace(/\\LaTeX\\?/g, 'LaTeX')}\n\n`;
  }

  // Extract author
  const authorMatch = latexContent.match(/\\author\{(.*?)\}/);
  if (authorMatch && authorMatch[1]) {
    output += `*By: ${authorMatch[1]}*\n\n`;
  }

  // Extract date
  const dateMatch = latexContent.match(/\\date\{(.*?)\}/);
  if (dateMatch && dateMatch[1] !== '\\today') {
    output += `*Date: ${dateMatch[1]}*\n\n`;
  } else if (dateMatch && dateMatch[1] === '\\today') {
    // Use current date for \today
    const today = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    output += `*Date: ${today}*\n\n`;
  }

  // Extract the document body
  const bodyMatch = latexContent.match(/\\begin\{document\}([\s\S]*?)\\end\{document\}/);
  if (!bodyMatch) return output;

  let body = bodyMatch[1] || '';

  // Process \maketitle - already handled by extracting title, author, date
  body = body.replace(/\\maketitle/, '');

  // Process sections
  body = body.replace(/\\section\{(.*?)\}/g, (_, title: string) => `\n## ${title}\n\n`);
  body = body.replace(/\\subsection\{(.*?)\}/g, (_, title: string) => `\n### ${title}\n\n`);
  body = body.replace(/\\subsubsection\{(.*?)\}/g, (_, title: string) => `\n#### ${title}\n\n`);

  // Process math environments
  body = body.replace(
    /\\begin\{align\*?\}([\s\S]*?)\\end\{align\*?\}/g,
    (_, content: string) => `\n$$\n${content.trim()}\n$$\n`
  );
  body = body.replace(
    /\\begin\{equation\*?\}([\s\S]*?)\\end\{equation\*?\}/g,
    (_, content: string) => `\n$$\n${content.trim()}\n$$\n`
  );
  body = body.replace(
    /\\begin\{pmatrix\}([\s\S]*?)\\end\{pmatrix\}/g,
    (_, content: string) => `\\begin{pmatrix}${content.trim()}\\end{pmatrix}`
  );

  // Process text environments
  body = body.replace(/\\begin\{itemize\}([\s\S]*?)\\end\{itemize\}/g, (_, content: string) => {
    // Convert \item to markdown list items
    const items = content.split('\\item').filter((item: string) => item.trim());
    return items.map((item: string) => `- ${item.trim()}`).join('\n');
  });

  body = body.replace(/\\begin\{enumerate\}([\s\S]*?)\\end\{enumerate\}/g, (_, content: string) => {
    // Convert \item to markdown numbered list items
    const items = content.split('\\item').filter((item: string) => item.trim());
    return items.map((item: string, index: number) => `${index + 1}. ${item.trim()}`).join('\n');
  });

  // Process \[ ... \] math blocks - already handled by the main function
  // But we'll add explicit handling here for completeness
  body = body.replace(/\\\[([\s\S]*?)\\\]/g, (_, content: string) => `\n$$\n${content.trim()}\n$$\n`);

  // Process special LaTeX commands
  body = body.replace(/\\LaTeX\\?/g, 'LaTeX');
  body = body.replace(/\\textbf\{(.*?)\}/g, '**$1**');
  body = body.replace(/\\textit\{(.*?)\}/g, '*$1*');
  body = body.replace(/\\emph\{(.*?)\}/g, '*$1*');
  body = body.replace(/\\text\{(.*?)\}/g, '$1');

  // Handle special math symbols that might appear in text
  body = body.replace(/\\mathbb\{([A-Z])\}/g, '𝔹'); // Replace with appropriate Unicode if possible

  // Add the processed body to output
  output += body;

  return output;
}
