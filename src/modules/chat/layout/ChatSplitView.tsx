'use client';

import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { CodeCascadeView } from '@/modules/chat/components/code/CodeCascadeView';
import { useCodeCascade } from '@/stores/codeCascade';

interface ChatSplitViewProps {
  children: React.ReactNode;
}

export function ChatSplitView({ children }: ChatSplitViewProps) {
  const { showCodeView, isStreaming, isMultiLine } = useCodeCascade();

  // Show the code view if showCodeView is true or if we're streaming multi-line code
  const shouldShowCodeView = showCodeView || (isStreaming && isMultiLine);

  return (
    <ResizablePanelGroup direction="horizontal">
      <ResizablePanel defaultSize={shouldShowCodeView ? 50 : 100} minSize={40}>
        {children}
      </ResizablePanel>

      {shouldShowCodeView && (
        <>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={50} minSize={40} className="slide-in-from-right">
            <CodeCascadeView />
          </ResizablePanel>
        </>
      )}
    </ResizablePanelGroup>
  );
}
