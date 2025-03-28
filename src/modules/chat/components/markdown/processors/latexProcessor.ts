/**
 * Processes markdown content to convert code blocks with katex/latex/math
 * language into proper math dollar-sign notation for rendering by rehype-katex.
 * Other LaTeX notations like \[...\], \(...\), and $...$ are handled by remark-math.
 */
export function processLatexContent(content: string): string {
  return content.replace(/```(?:katex|latex|math)\s*([\s\S]*?)```/g, (_, mathContent) => {
    const lines = mathContent.split('\n').filter((line: string) => line.trim());
    return lines.length === 1 ? `$${lines[0].trim()}$` : `$$\n${mathContent.trim()}\n$$`;
  });
}
