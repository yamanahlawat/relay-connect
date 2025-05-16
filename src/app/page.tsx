import { Separator } from '@/components/ui/separator';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { prefetchProvidersQuery } from '@/lib/queries/providers';
import { prefetchSessionsQuery } from '@/lib/queries/session';
import ProviderModelSelect from '@/modules/chat/components/ProviderModelSelect';
import { AppSidebar } from '@/modules/chat/components/sidebar/AppSidebar';
import { WelcomeContent } from '@/modules/chat/components/Welcome';
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';

export default async function Page() {
  const queryClient = new QueryClient();

  await Promise.all([
    // Prefetch active providers
    prefetchProvidersQuery(queryClient, true),
    // Prefetch the first page of chat sessions
    prefetchSessionsQuery(queryClient),
  ]);

  return (
    <SidebarProvider>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <AppSidebar />
      </HydrationBoundary>
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-4 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="bg-muted-foreground/30 mr-2 h-4" />
          <HydrationBoundary state={dehydrate(queryClient)}>
            <ProviderModelSelect />
          </HydrationBoundary>
        </header>
        <WelcomeContent />
      </SidebarInset>
    </SidebarProvider>
  );
}
