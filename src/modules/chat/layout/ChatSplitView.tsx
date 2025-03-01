'use client';

import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { CodeCascadeView } from '@/modules/chat/components/code/CodeCascadeView';
import { useCodeCascade } from '@/stores/codeCascade';

interface ChatSplitViewProps {
  children: React.ReactNode;
}

export function ChatSplitView({ children }: ChatSplitViewProps) {
  const { showCodeView } = useCodeCascade();

  return (
    <ResizablePanelGroup direction="horizontal">
      <ResizablePanel defaultSize={showCodeView ? 60 : 100} minSize={30}>
        {children}
      </ResizablePanel>

      {showCodeView && (
        <>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={40} minSize={30} className="slide-in-from-right">
            <CodeCascadeView />
          </ResizablePanel>
        </>
      )}
    </ResizablePanelGroup>
  );
}
