'use client';

import { isToday, isYesterday, subDays } from 'date-fns';
import { debounce } from 'lodash';
import { Loader, MessageSquarePlus, MoreHorizontal, PencilLine, Search, Sparkles, Trash, X } from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
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
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

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

  groups.forEach((group) => {
    group.chats.sort((a, b) => {
      const dateA = new Date(a.last_message_at || a.created_at);
      const dateB = new Date(b.last_message_at || b.created_at);
      return dateB.getTime() - dateA.getTime();
    });
  });

  return groups.filter((group) => group.chats.length > 0);
}

export function AppSidebar({ className, ...props }: React.ComponentProps<typeof Sidebar>) {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isSearchFocused, setIsSearchFocused] = React.useState(false);
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const [editingChatId, setEditingChatId] = React.useState<string | null>(null);
  const [editValue, setEditValue] = React.useState('');
  const pathname = usePathname();
  const router = useRouter();
  const { clearCode } = useCodeCascade();

  // Create a debounced search function
  const debouncedSearch = React.useMemo(
    () =>
      debounce((query: string) => {
        setSearchQuery(query);
      }, 300),
    []
  );

  // Keyboard shortcut for search
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === 'Escape' && isSearchFocused) {
        debouncedSearch.cancel();
        setSearchQuery('');
        searchInputRef.current?.blur();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchFocused, debouncedSearch]);

  // Clean up debounce on unmount
  React.useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

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

  const handleDeleteChat = async (chatId: string, e: React.MouseEvent) => {
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

  const handleRenameChat = async (chatId: string, newTitle: string) => {
    try {
      await updateChatSession(chatId, { title: newTitle });
      toast.success('Chat renamed successfully');
      refetch();
      setEditingChatId(null);
      setEditValue('');
    } catch {
      toast.error('Failed to rename chat');
    }
  };

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
    },
    [isFetchingNextPage, fetchNextPage, hasNextPage]
  );

  const groups = React.useMemo(() => {
    if (!chatSessions?.pages) return [];
    const allChats = chatSessions.pages.flatMap((page) => page);
    return groupChatsByDate(allChats); // Just group by date, no filtering needed
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
              <span className="font-semibold">Relay Connect</span>
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
        <div className="relative w-full">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            ref={searchInputRef}
            placeholder="Search"
            onChange={(e) => debouncedSearch(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            className="h-9 w-full pl-9 pr-9"
          />
          {searchQuery && (
            <button
              onClick={() => {
                debouncedSearch.cancel();
                setSearchQuery('');
                searchInputRef.current?.focus();
              }}
              className="absolute right-2 top-2 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Clear search</span>
            </button>
          )}
          {!searchQuery && (
            <kbd className="pointer-events-none absolute right-2 top-2 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
              <span className="text-xs">{navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}</span>K
            </kbd>
          )}
        </div>
      </div>

      <SidebarContent>
        <ScrollArea className="h-full">
          {isLoading ? (
            <div className="flex justify-center py-1.5 opacity-70">
              <Loader className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            groups.map((group, groupIndex) => (
              <SidebarGroup key={group.label}>
                <SidebarGroupLabel className="sticky top-0 z-10 bg-background/95 px-2 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur-sm">
                  {group.label}
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu className="px-0.5">
                    {group.chats.map((chat, chatIndex) => {
                      const isLastElement = groupIndex === groups.length - 1 && chatIndex === group.chats.length - 1;
                      const isActive = pathname === `/chat/${chat.id}`;

                      return (
                        <SidebarMenuItem
                          key={chat.id}
                          ref={isLastElement ? lastChatElementRef : undefined}
                          className={cn(
                            'relative px-0 py-0.5 [&:hover_.action-menu]:opacity-100 [&:hover_.chat-item]:bg-accent/50',
                            '[&>.chat-item]:transition-colors'
                          )}
                        >
                          {editingChatId === chat.id ? (
                            <div className="flex w-full items-center px-2">
                              <Input
                                autoFocus
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onBlur={() => {
                                  if (editValue && editValue !== chat.title) {
                                    handleRenameChat(chat.id, editValue);
                                  } else {
                                    setEditingChatId(null);
                                    setEditValue('');
                                  }
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    if (editValue) {
                                      handleRenameChat(chat.id, editValue);
                                    }
                                  }
                                }}
                                className="h-8"
                              />
                            </div>
                          ) : (
                            <div className="chat-item relative flex w-full items-center rounded-md">
                              <Link
                                href={`/chat/${chat.id}`}
                                className={cn(
                                  'flex flex-1 items-center px-2 py-1.5 text-sm',
                                  isActive && 'rounded-md bg-accent/50 font-medium text-accent-foreground',
                                  !isActive && 'text-foreground/80'
                                )}
                                onClick={(e) => {
                                  clearCode();
                                  if (e.detail === 2) {
                                    // Check for double click
                                    e.preventDefault();
                                    setEditingChatId(chat.id);
                                    setEditValue(chat.title);
                                  }
                                }}
                              >
                                {isActive && (
                                  <div className="absolute left-0 top-1/2 h-full w-0.5 -translate-y-1/2 bg-primary" />
                                )}
                                <span className="line-clamp-1 pr-4" title={chat.title}>
                                  {chat.title}
                                </span>
                              </Link>

                              <div className="action-menu absolute right-0.5 opacity-0 transition-opacity">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-accent">
                                      <MoreHorizontal className="h-4 w-4" />
                                      <span className="sr-only">Actions</span>
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-40">
                                    <DropdownMenuItem
                                      onClick={(e) => {
                                        e.preventDefault();
                                        setEditingChatId(chat.id);
                                        setEditValue(chat.title);
                                      }}
                                    >
                                      <PencilLine className="mr-2 h-4 w-4" />
                                      <span>Rename</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={(e) => handleDeleteChat(chat.id, e)}>
                                      <Trash className="mr-2 h-4 w-4" />
                                      <span>Delete</span>
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                          )}
                        </SidebarMenuItem>
                      );
                    })}
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
