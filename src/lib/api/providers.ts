import client from '@/lib/api/client';
import type { paths } from '@/lib/api/schema';

type ProviderListResponse = paths['/api/v1/providers/']['get']['responses']['200']['content']['application/json'];

export const listProviders = async (): Promise<ProviderListResponse> => {
  const { data, error } = await client.GET('/api/v1/providers/');
  if (error) {
    throw new Error(`Error fetching providers: ${error.detail}`);
  }
  return data;
};
