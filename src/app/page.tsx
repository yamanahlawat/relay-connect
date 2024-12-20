import { AppSidebar } from '@/components/app-sidebar';
import ProviderModelSelect from '@/components/provider-model-select';
import { Separator } from '@/components/ui/separator';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { listChatSessions } from '@/lib/api/chatSessions';
import { listProviders } from '@/lib/api/providers';
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
        <div className="flex flex-1 flex-col gap-4 p-4">
          <div className="grid auto-rows-min gap-4 md:grid-cols-3">
            <div className="aspect-video rounded-xl bg-muted/50" />
            <div className="aspect-video rounded-xl bg-muted/50" />
            <div className="aspect-video rounded-xl bg-muted/50" />
          </div>
          <div className="min-h-[100vh] flex-1 rounded-xl bg-muted/50 md:min-h-min" />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
