import { deleteMessages } from '@/lib/api/messages';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useBulkDeleteMessages(sessionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (messageIds: string[]) => {
      await deleteMessages(messageIds);
    },
    onSuccess: () => {
      // Invalidate any queries that cache messages so they can refresh with updated data
      queryClient.invalidateQueries({ queryKey: ['messages', sessionId] });
    },
    onError: (error: unknown) => {
      console.error('Bulk deletion error:', error);
    },
  });
}
