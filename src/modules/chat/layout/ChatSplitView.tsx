'use client';

import { CodeCascadeView } from '@/modules/chat/components/code/CodeCascadeView';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { useCodeCascade } from '@/stores/codeCascade';

interface ChatSplitViewProps {
  children: React.ReactNode;
}

export function ChatSplitView({ children }: ChatSplitViewProps) {
  const { showCodeView } = useCodeCascade();

  return (
    <ResizablePanelGroup direction="horizontal">
      <ResizablePanel defaultSize={showCodeView ? 50 : 100} minSize={30}>
        {children}
      </ResizablePanel>

      {showCodeView && (
        <>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={50} minSize={30}>
            <CodeCascadeView />
          </ResizablePanel>
        </>
      )}
    </ResizablePanelGroup>
  );
}
