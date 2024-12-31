'use client';

import { ChatItem } from '@/components/sidebar/ChatItem';
import { ChatSearch } from '@/components/sidebar/ChatSearch';
import { useChatGroups } from '@/components/sidebar/hooks/useChatGroups';
import { useIntersectionObserver } from '@/components/sidebar/hooks/useIntersectionObserver';
import { NoResults } from '@/components/sidebar/NoResults';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar';
import { deleteChatSession, listChatSessions, updateChatSession } from '@/lib/api/chatSessions';
import { cn } from '@/lib/utils';
import { useCodeCascade } from '@/stores/codeCascade';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Loader, MessageSquarePlus, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ComponentProps, useMemo, useState } from 'react';
import { toast } from 'sonner';

export function AppSidebar({ className, ...props }: ComponentProps<typeof Sidebar>) {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const pathname = usePathname();
  const router = useRouter();
  const { clearCode } = useCodeCascade();

  const {
    data: chatSessions,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['chat-sessions', searchQuery],
    queryFn: async ({ pageParam = { limit: 20, offset: 0 } }) => {
      const { limit, offset } = pageParam;
      return await listChatSessions(limit, offset, searchQuery);
    },
    initialPageParam: { limit: 20, offset: 0 },
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length === 0) return undefined;
      const nextOffset = allPages.reduce((acc, page) => acc + page.length, 0);
      return { limit: 20, offset: nextOffset };
    },
  });

  const groups = useChatGroups(chatSessions?.pages);
  const lastChatRef = useIntersectionObserver(isFetchingNextPage, hasNextPage, fetchNextPage);

  const handleDeleteChat = async (chatId: string, e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      await deleteChatSession(chatId);
      toast.success('Chat deleted successfully');
      refetch();
      if (pathname === `/chat/${chatId}`) {
        router.push('/');
      }
    } catch {
      toast.error('Failed to delete chat');
    }
  };

  const handleRenameChat = async (chatId: string, shouldSave: boolean) => {
    if (!shouldSave || !editValue.trim() || editValue === editingChatId) {
      setEditingChatId(null);
      setEditValue('');
      return;
    }

    try {
      await updateChatSession(chatId, { title: editValue.trim() });
      toast.success('Chat renamed successfully');
      await refetch();
    } catch {
      toast.error('Failed to rename chat');
    } finally {
      setEditingChatId(null);
      setEditValue('');
    }
  };

  const hasChats = useMemo(() => {
    return chatSessions?.pages?.some((page) => page.length > 0) ?? false;
  }, [chatSessions?.pages]);

  return (
    <Sidebar className={cn('w-64 border-r', className)} {...props}>
      <SidebarHeader className="h-12 justify-center px-3 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-1.5">
              <div className="flex aspect-square h-7 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-transform hover:scale-105">
                <Sparkles className="h-3.5 w-3.5" />
              </div>
              <span className="pl-0.5 font-semibold">Relay Connect</span>
            </Link>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-foreground hover:text-foreground" asChild>
            <Link href="/" title="New Chat">
              <MessageSquarePlus className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </SidebarHeader>

      <div className="p-2">
        <ChatSearch onSearch={setSearchQuery} />
      </div>

      <SidebarContent>
        <ScrollArea className="h-full">
          {isLoading ? (
            <div className="flex justify-center py-1.5 opacity-70">
              <Loader className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
            </div>
          ) : !hasChats ? (
            <NoResults searchQuery={searchQuery} />
          ) : (
            groups.map((group, groupIndex) => (
              <SidebarGroup key={group.label}>
                <SidebarGroupLabel className="sticky top-0 z-10 bg-background/95 px-2 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur-sm">
                  {group.label}
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu className="px-0.5">
                    {group.chats.map((chat, chatIndex) => (
                      <SidebarMenuItem
                        key={chat.id}
                        ref={
                          groupIndex === groups.length - 1 && chatIndex === group.chats.length - 1
                            ? lastChatRef
                            : undefined
                        }
                        className={cn(
                          'relative px-0 py-0.5 [&:hover_.action-menu]:opacity-100 [&:hover_.chat-item]:bg-accent/50',
                          '[&>.chat-item]:transition-colors'
                        )}
                      >
                        <ChatItem
                          chat={chat}
                          isActive={pathname === `/chat/${chat.id}`}
                          isEditing={editingChatId === chat.id}
                          editValue={editValue}
                          onEditValueChange={setEditValue}
                          onStartEdit={() => {
                            setEditingChatId(chat.id);
                            setEditValue(chat.title);
                          }}
                          onFinishEdit={() => handleRenameChat(chat.id, editValue)}
                          onDelete={(e) => handleDeleteChat(chat.id, e)}
                          clearCode={clearCode}
                        />
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            ))
          )}
          {isFetchingNextPage && (
            <div className="flex justify-center py-1.5 opacity-70">
              <Loader className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
            </div>
          )}
        </ScrollArea>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
