import { isToday, isYesterday, subDays } from 'date-fns';
import { useMemo } from 'react';

type Chat = {
  id: string;
  title: string;
  created_at: string;
  last_message_at: string | null;
};

type ChatGroup = {
  label: string;
  chats: Chat[];
};

export function useChatGroups(pages?: Chat[][]) {
  return useMemo(() => {
    if (!pages) return [];

    const allChats = pages.flatMap((page) => page);
    return groupChatsByDate(allChats);
  }, [pages]);
}

function groupChatsByDate(chats: Chat[]): ChatGroup[] {
  // Define the groups array with a non-null assertion to tell TypeScript
  // that we know these indices will always exist
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
      // Use a type assertion to tell TypeScript this will never be undefined
      (groups[0] as ChatGroup).chats.push(chat);
    } else if (isYesterday(date)) {
      (groups[1] as ChatGroup).chats.push(chat);
    } else if (date >= sevenDaysAgo) {
      (groups[2] as ChatGroup).chats.push(chat);
    } else if (date >= thirtyDaysAgo) {
      (groups[3] as ChatGroup).chats.push(chat);
    } else {
      (groups[4] as ChatGroup).chats.push(chat);
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
