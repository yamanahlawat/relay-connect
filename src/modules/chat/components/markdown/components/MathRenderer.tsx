import { cn } from '@/lib/utils';
import 'katex/dist/contrib/mhchem'; // Import mhchem extension
import 'katex/dist/katex.min.css';
import rehypeKatex from 'rehype-katex';
import remarkMath from 'remark-math';

// Define KaTeX options
export const katexOptions = {
  output: 'html',
  trust: true, // Needed for mhchem and other advanced features
  strict: false,
  globalGroup: false,
};

/**
 * Get the rehype plugins for math rendering
 */
export function getMathPlugins() {
  return [[remarkMath], [rehypeKatex, katexOptions]];
}

/**
 * Component for rendering math content
 */
export function MathRenderer({ children, inline = false }: { children: React.ReactNode; inline?: boolean }) {
  return <span className={cn(inline ? 'math-inline' : 'math-display', 'language-math')}>{children}</span>;
}

/**
 * Component to wrap around content with math elements
 */
export function MathContentWrapper({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('math-content', className)}>{children}</div>;
}
