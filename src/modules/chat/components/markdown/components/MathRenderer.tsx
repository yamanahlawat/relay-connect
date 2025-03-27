import { cn } from '@/lib/utils';
import 'katex/dist/katex.min.css';
import rehypeKatex from 'rehype-katex';
import remarkMath from 'remark-math';

// Define KaTeX options with mhchem extension support
export const katexOptions = {
  output: 'html', // or 'mathml'
  throwOnError: false,
  errorColor: '#cc0000',
  macros: {
    // Add any custom macros here
    '\\slashed': '\\slash', // Use a supported alternative for \slashed
  },
  fleqn: false,
  leqno: false,
  strict: false,
  trust: true, // Needed for some advanced features
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
  return <span className={cn('katex-math', inline ? 'katex-math-inline' : 'katex-math-display')}>{children}</span>;
}

/**
 * Component to wrap around content with math elements
 */
export function MathContentWrapper({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('katex-math-content', className)}>{children}</div>;
}
