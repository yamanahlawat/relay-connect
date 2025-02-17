import { useTheme } from 'next-themes';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface JsonCodeBlockProps {
  data: object;
}

export default function JsonCodeBlock({ data }: JsonCodeBlockProps) {
  const { theme } = useTheme();
  return (
    <SyntaxHighlighter
      language="json"
      style={theme === 'dark' ? oneDark : oneLight}
      showLineNumbers={false}
      wrapLines
      customStyle={{
        margin: 0,
        backgroundColor: 'transparent',
        fontSize: '13px',
        lineHeight: '1.6',
        padding: '1rem 1.25rem',
      }}
      codeTagProps={{
        style: {
          fontFamily: 'var(--font-mono)',
          textRendering: 'optimizeLegibility',
        },
      }}
    >
      {JSON.stringify(data, null, 2)}
    </SyntaxHighlighter>
  );
}
