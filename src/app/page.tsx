import { Separator } from '@/components/ui/separator';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { listChatSessions } from '@/lib/api/chatSessions';
import { listProviders } from '@/lib/api/providers';
import ProviderModelSelect from '@/modules/chat/components/ProviderModelSelect';
import { AppSidebar } from '@/modules/chat/components/sidebar/AppSidebar';
import { WelcomeContent } from '@/modules/chat/components/Welcome';
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';

export default async function Page() {
  const queryClient = new QueryClient();

  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: ['providers'],
      queryFn: async () => {
        const response = await listProviders();
        return response;
      },
    }),
    queryClient.prefetchInfiniteQuery({
      queryKey: ['chat-sessions'],
      queryFn: async ({ pageParam = { limit: 20, offset: 0 } }) => {
        const response = await listChatSessions(pageParam.limit, pageParam.offset);
        return response;
      },
      initialPageParam: { limit: 20, offset: 0 },
    }),
  ]);

  return (
    <SidebarProvider>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <AppSidebar />
      </HydrationBoundary>
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-4 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <HydrationBoundary state={dehydrate(queryClient)}>
            <ProviderModelSelect />
          </HydrationBoundary>
        </header>
        <WelcomeContent />
      </SidebarInset>
    </SidebarProvider>
  );
}
