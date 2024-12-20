import client from '@/lib/api/client';
import type { paths } from '@/lib/api/schema';

type ModelsListResponse = paths['/api/v1/models/']['get']['responses']['200']['content']['application/json'];

export const listModels = async (providerId: string): Promise<ModelsListResponse> => {
  const { data, error } = await client.GET('/api/v1/models/', {
    params: {
      query: {
        provider_id: providerId,
      },
    },
  });
  if (error) {
    throw new Error(`Error fetching models for provider ${providerId}: ${error.detail}`);
  }
  return data;
};
