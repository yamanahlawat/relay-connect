import client from '@/lib/api/client';
import { ProviderCreate, ProviderRead, ProviderUpdate } from '@/types/provider';

export const listProviders = async (): Promise<ProviderRead[]> => {
  const { data, error } = await client.GET('/api/v1/providers/');
  if (error) {
    throw new Error(`Error fetching providers: ${error.detail}`);
  }
  return data;
};

export const createProvider = async (provider: ProviderCreate): Promise<ProviderRead> => {
  const { data, error } = await client.POST('/api/v1/providers/', {
    body: provider,
  });
  if (error) {
    throw new Error(`Error creating provider: ${error.detail}`);
  }
  return data;
};

export const updateProvider = async (providerId: string, provider: ProviderUpdate): Promise<ProviderRead> => {
  const { data, error } = await client.PATCH('/api/v1/providers/{provider_id}/', {
    params: {
      path: { provider_id: providerId },
    },
    body: provider,
  });
  if (error) {
    throw new Error(`Error updating provider: ${error.detail}`);
  }
  return data;
};

export const deleteProvider = async (providerId: string): Promise<void> => {
  const { error } = await client.DELETE('/api/v1/providers/{provider_id}/', {
    params: {
      path: { provider_id: providerId },
    },
  });
  if (error) {
    throw new Error(`Error deleting provider: ${error.detail}`);
  }
};
