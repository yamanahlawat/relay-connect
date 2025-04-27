import Image from 'next/image';
import React, { useMemo } from 'react';
import { Components } from 'react-markdown';
import { MarkdownNode } from '../types/markdownTypes';
// For proper Next.js image imports
import { StaticImageData } from 'next/image';

// Fix TypeScript interfaces for ReactMarkdown components
interface CodeProps {
  className?: string;
  children?: React.ReactNode;
  inline?: boolean;
  node?: MarkdownNode; // More specific type than 'any'
}

/**
 * Hook to provide customized markdown components
 * @returns An object with component definitions for react-markdown
 */
export function useMarkdownComponents(): Partial<Components> {
  return useMemo(
    () => ({
      // Standard code component for syntax highlighting
      code: ({ className, children }: CodeProps) => {
        // Process normal code blocks
        const codeContent = Array.isArray(children) ? children.join('') : String(children || '');

        // Math handling is now done by rehype-katex directly
        return React.createElement(
          'pre',
          { className: 'overflow-auto p-2 rounded-lg' },
          React.createElement('code', { className }, codeContent)
        );
      },

      a: ({ children, href }) =>
        React.createElement(
          'a',
          {
            href,
            target: '_blank',
            rel: 'noreferrer',
            className: 'font-medium text-primary underline underline-offset-4 transition-colors hover:text-primary/80',
          },
          children
        ),

      ul: ({ children }) =>
        React.createElement(
          'ul',
          { className: 'my-3 ml-6 list-disc space-y-2 marker:text-muted-foreground' },
          children
        ),

      ol: ({ children }) =>
        React.createElement(
          'ol',
          { className: 'my-3 ml-6 list-decimal space-y-2 marker:text-muted-foreground' },
          children
        ),

      table: ({ children }) =>
        React.createElement(
          'div',
          { className: 'my-4 w-full overflow-auto rounded-lg border' },
          React.createElement('table', { className: 'w-full border-collapse text-sm' }, children)
        ),

      th: ({ children }) =>
        React.createElement(
          'th',
          { className: 'border-b border-r bg-muted px-4 py-2 text-left font-medium last:border-r-0' },
          children
        ),

      img: ({ src, alt }) => {
        // Safe handling for Next.js Image src prop
        const safeImageSrc: string | StaticImageData = typeof src === 'string' ? src : '';

        return React.createElement(Image, {
          src: safeImageSrc,
          alt: alt || '',
          className: 'rounded-lg border bg-muted',
          loading: 'lazy',
          width: 500,
          height: 300,
        });
      },

      pre: ({ children }) => children,

      p: ({ children, node }) => {
        const hasCodeBlock = (node as MarkdownNode)?.children?.some(
          (child) => child.type === 'element' && (child.tagName === 'code' || child.tagName === 'pre')
        );

        // Check for math blocks to avoid treating them as code blocks
        const hasMathBlock = (node as MarkdownNode)?.children?.some(
          (child) =>
            child.type === 'element' &&
            child.tagName === 'code' &&
            typeof child.properties?.className === 'string' &&
            child.properties.className.includes('math')
        );

        if (hasCodeBlock && !hasMathBlock) {
          return React.createElement('div', { className: 'my-4' }, children);
        }

        return React.createElement('p', { className: 'leading-7 [&:not(:first-child)]:mt-4' }, children);
      },

      // Ensure inline math in list items renders properly
      li: ({ children, node }) => {
        // Check if this list item contains math expressions
        const hasMathBlock = (node as MarkdownNode)?.children?.some(
          (child) =>
            (child.type === 'element' &&
              child.tagName === 'code' &&
              typeof child.properties?.className === 'string' &&
              child.properties.className.includes('math')) ||
            (child.type === 'element' &&
              child.tagName === 'p' &&
              child.children?.some(
                (grandchild) =>
                  grandchild.type === 'element' &&
                  grandchild.tagName === 'code' &&
                  typeof grandchild.properties?.className === 'string' &&
                  grandchild.properties.className.includes('math')
              ))
        );

        if (hasMathBlock) {
          return React.createElement('li', { className: 'math-list-item' }, children);
        }

        return React.createElement('li', {}, children);
      },

      hr: () => React.createElement('hr', { className: 'my-2' }),
    }),
    []
  );
}
