'use client';

import { isToday, isYesterday, subDays } from 'date-fns';
import { Loader, MessageSquarePlus, Sparkles } from 'lucide-react';
import * as React from 'react';

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
import { listChatSessions } from '@/lib/api/chatSessions';
import { cn } from '@/lib/utils';
import { useInfiniteQuery } from '@tanstack/react-query';
import Link from 'next/link';

type ChatGroup = {
  label: string;
  chats: Array<{
    id: string;
    title: string;
    created_at: string;
    last_message_at: string | null;
  }>;
};

function groupChatsByDate(
  chats: Array<{
    id: string;
    title: string;
    created_at: string;
    last_message_at: string | null;
  }>
) {
  const groups: ChatGroup[] = [
    { label: 'Today', chats: [] },
    { label: 'Yesterday', chats: [] },
    { label: 'Last 7 Days', chats: [] },
    { label: 'Last 30 Days', chats: [] },
    { label: 'Older', chats: [] },
  ];

  const now = new Date();
  const sevenDaysAgo = subDays(now, 7);
  const thirtyDaysAgo = subDays(now, 30);

  chats.forEach((chat) => {
    // Use last_message_at if available, otherwise fall back to created_at
    const date = new Date(chat.last_message_at || chat.created_at);

    if (isToday(date)) {
      groups[0].chats.push(chat);
    } else if (isYesterday(date)) {
      groups[1].chats.push(chat);
    } else if (date >= sevenDaysAgo) {
      groups[2].chats.push(chat);
    } else if (date >= thirtyDaysAgo) {
      groups[3].chats.push(chat);
    } else {
      groups[4].chats.push(chat);
    }
  });

  // Sort chats within each group by last_message_at or created_at in descending order
  groups.forEach((group) => {
    group.chats.sort((a, b) => {
      const dateA = new Date(a.last_message_at || a.created_at);
      const dateB = new Date(b.last_message_at || b.created_at);
      return dateB.getTime() - dateA.getTime();
    });
  });

  // Only return groups that have chats
  return groups.filter((group) => group.chats.length > 0);
}

export function AppSidebar({ className, ...props }: React.ComponentProps<typeof Sidebar>) {
  const {
    data: chatSessions,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ['chat-sessions'],
    queryFn: async ({ pageParam = { limit: 20, offset: 0 } }) => {
      const { limit, offset } = pageParam;
      return await listChatSessions(limit, offset);
    },
    initialPageParam: { limit: 20, offset: 0 },
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length === 0) return undefined; // Return undefined instead of false
      const nextOffset = allPages.reduce((acc, page) => acc + page.length, 0);
      return { limit: 20, offset: nextOffset };
    },
  });

  const observer = React.useRef<IntersectionObserver | null>(null);
  const lastChatElementRef = React.useCallback(
    (node: HTMLLIElement | null) => {
      if (isFetchingNextPage) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasNextPage) {
          fetchNextPage();
        }
      });
      if (node) observer.current.observe(node);
      return () => {
        if (observer.current) {
          observer.current.disconnect();
        }
      };
    },
    [isFetchingNextPage, fetchNextPage, hasNextPage]
  );

  const groupedChats = React.useMemo(() => {
    if (!chatSessions?.pages) return [];
    const allChats = chatSessions.pages.flatMap((page) => page);
    return groupChatsByDate(allChats);
  }, [chatSessions?.pages]);

  return (
    <Sidebar className={cn('w-64 border-r', className)} {...props}>
      <SidebarHeader className="h-14 justify-center border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <Link href="/#" className="flex items-center gap-2">
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground transition-transform hover:scale-105">
              <Sparkles className="size-4" />
            </div>
            <span className="font-semibold">Relay Connect</span>
          </Link>
          <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-foreground" asChild>
            <Link href="/#" title="New Chat">
              <MessageSquarePlus className="size-5" />
            </Link>
          </Button>
        </div>
      </SidebarHeader>

      <SidebarContent className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          {isLoading ? (
            <div className="flex justify-center py-2 opacity-70">
              <Loader className="size-4 animate-spin text-muted-foreground" />
            </div>
          ) : (
            groupedChats.map((group, groupIndex) => (
              <SidebarGroup key={group.label}>
                <SidebarGroupLabel className="px-4 py-2 text-xs font-medium text-muted-foreground">
                  {group.label}
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu className="px-2">
                    {group.chats.map((chat, chatIndex) => {
                      const isLastElement =
                        groupIndex === groupedChats.length - 1 && chatIndex === group.chats.length - 1;

                      return (
                        <SidebarMenuItem key={chat.id} ref={isLastElement ? lastChatElementRef : undefined}>
                          <Link
                            href={`/chat/${chat.id}`}
                            className="block w-full rounded-md px-3 py-2 text-sm text-muted-foreground transition-all hover:bg-accent hover:pl-4 hover:text-foreground"
                            aria-label={`Chat titled ${chat.title}`}
                          >
                            <span className="line-clamp-1" title={chat.title}>
                              {chat.title}
                            </span>
                          </Link>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            ))
          )}
          {isFetchingNextPage && (
            <div className="flex justify-center py-2 opacity-70">
              <Loader className="size-4 animate-spin text-muted-foreground" />
            </div>
          )}
        </ScrollArea>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
