import { getChatSession } from '@/lib/api/chatSessions';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { toast } from 'sonner';

export function useSession(sessionId: string | null) {
  const {
    data: sessionDetails,
    isError,
    error,
  } = useQuery({
    queryKey: ['session', sessionId],
    queryFn: () => getChatSession(sessionId as string),
    enabled: !!sessionId,
  });

  useEffect(() => {
    if (isError) {
      toast.error(error instanceof Error ? error.message : 'Failed to fetch session details');
    }
  }, [isError, error]);

  return { sessionDetails };
}
