/**
 * Common types for markdown rendering
 */

import { ContentItem } from '@/types/stream';
import { ReactNode } from 'react';

/**
 * Markdown node structure from react-markdown
 */
export interface MarkdownNode {
  type: string;
  tagName?: string;
  children?: MarkdownNode[];
  properties?: Record<string, unknown>;
  value?: string;
}

/**
 * Code analysis result from the code analyzer
 */
export interface CodeAnalysis {
  hasCode: boolean;
  isMultiLine: boolean;
  shouldShowCascade: boolean;
  language?: string;
  lineCount: number;
}

/**
 * Properties for a markdown renderer component
 */
export interface MarkdownRendererProps {
  content: string | ContentItem[];
  isStreaming?: boolean;
}

/**
 * Properties for math content wrapper
 */
export interface MathContentWrapperProps {
  children: ReactNode;
  className?: string;
}

/**
 * Properties for math renderer
 */
export interface MathRendererProps {
  children: ReactNode;
  inline?: boolean;
}

/**
 * Properties for code block component
 */
export interface CodeBlockProps {
  className?: string;
  children?: ReactNode;
  node?: MarkdownNode;
}
