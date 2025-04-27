import Image, { StaticImageData } from 'next/image';
import React, { useMemo } from 'react';
import { Components } from 'react-markdown';
import CodeBlock from '../components/CodeBlock';
import { MarkdownNode } from '../types/markdownTypes';

/**
 * Hook to provide customized markdown components
 * @returns An object with component definitions for react-markdown
 */
export function useMarkdownComponents(): Partial<Components> {
  return useMemo(
    () => ({
      // Standard code component for syntax highlighting
      code: ({ className, children }) => {
        // Process all code blocks with CodeBlock component
        return React.createElement(CodeBlock, { className }, children);
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
        // Check if paragraph contains a code block
        const hasCodeBlock = (node as MarkdownNode)?.children?.some(
          (child) => child.type === 'element' && (child.tagName === 'code' || child.tagName === 'pre')
        );

        if (hasCodeBlock) {
          return React.createElement('div', { className: 'my-4' }, children);
        }

        return React.createElement('p', { className: 'leading-7 [&:not(:first-child)]:mt-4' }, children);
      },

      // Simple list item component
      li: ({ children }) => {
        return React.createElement('li', {}, children);
      },

      hr: () => React.createElement('hr', { className: 'my-2' }),
    }),
    []
  );
}
