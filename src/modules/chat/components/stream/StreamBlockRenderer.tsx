import { cn } from '@/lib/utils';
import ThinkBlock from '@/modules/chat/components/markdown/ThinkBlock';
import { StreamBlock } from '@/types/stream';
import { XCircle } from 'lucide-react';
import { toast } from 'sonner';
import CodeBlock from '../markdown/CodeBlock';
import { MarkdownRenderer } from '../markdown/MarkdownRenderer';

const StreamBlockRenderer: React.FC<StreamBlock> = ({ type, content, toolName, toolArgs, errorType, errorDetail }) => {
  const renderContent = () => {
    // Handle array content
    if (Array.isArray(content)) {
      return content.map((item, index) => {
        switch (item.type) {
          case 'text':
            return <MarkdownRenderer key={index} content={item.text} />;
          // Handle other types when needed
          default:
            return null;
        }
      });
    }

    switch (type) {
      case 'thinking':
        return <ThinkBlock isStreaming={true}>{content || 'Thinking...'}</ThinkBlock>;

      case 'tool_start':
        return (
          <ThinkBlock isStreaming={false}>
            <div className="flex items-center gap-2">
              <span className="font-medium">Using tool:</span> {toolName}
            </div>
          </ThinkBlock>
        );

      case 'tool_call':
        return (
          <div className="space-y-2">
            <ThinkBlock isStreaming={false}>
              <div className="font-medium">Tool: {toolName}</div>
              <CodeBlock inline={false} className="language-json">
                {JSON.stringify(toolArgs, null, 2)}
              </CodeBlock>
            </ThinkBlock>
          </div>
        );

      case 'tool_result':
        return (
          <div className={cn('my-4 rounded-lg border bg-muted/50 p-4', 'animate-in fade-in slide-in-from-bottom-2')}>
            <div className="mb-2 font-medium">Result from {toolName}:</div>
            <MarkdownRenderer content={content as string} />
          </div>
        );

      case 'error':
        // Show error toast and return error message in chat
        toast.error(errorDetail, {
          description: errorType,
          icon: <XCircle className="h-4 w-4" />,
          // Keep error visible for longer
          duration: 5000,
        });

        return (
          <div className="text-sm text-destructive">
            {errorType}: {errorDetail}
          </div>
        );

      case 'content':
        return <MarkdownRenderer content={content as string} />;

      default:
        return null;
    }
  };

  return renderContent();
};

export default StreamBlockRenderer;
