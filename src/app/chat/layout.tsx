import { AppSidebar } from '@/components/AppSidebar';
import ProviderModelSelect from '@/components/ProviderModelSelect';
import { Separator } from '@/components/ui/separator';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { CodeCascadeProvider } from '@/context/CodeCascadeProvider';
import { listChatSessions } from '@/lib/api/chatSessions';
import { listProviders } from '@/lib/api/providers';
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';

export default async function Layout({ children }: { children: React.ReactNode }) {
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
      <div className="flex h-screen w-screen">
        <HydrationBoundary state={dehydrate(queryClient)}>
          <AppSidebar />
        </HydrationBoundary>
        <SidebarInset className="flex min-w-0 flex-1 flex-col">
          <div className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b border-border/40 bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <HydrationBoundary state={dehydrate(queryClient)}>
              <ProviderModelSelect />
            </HydrationBoundary>
          </div>
          <CodeCascadeProvider>
            <main className="relative flex-1 overflow-hidden">{children}</main>
          </CodeCascadeProvider>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
