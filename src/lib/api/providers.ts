import client from '@/lib/api/client';
import type { paths } from '@/lib/api/schema';

type ProviderListResponse = paths['/api/v1/providers/']['get']['responses']['200']['content']['application/json'];
type ProviderCreateRequest = paths['/api/v1/providers/']['post']['requestBody']['content']['application/json'];
type ProviderCreateResponse = paths['/api/v1/providers/']['post']['responses']['201']['content']['application/json'];
type ProviderUpdateRequest =
  paths['/api/v1/providers/{provider_id}/']['patch']['requestBody']['content']['application/json'];
type ProviderUpdateResponse =
  paths['/api/v1/providers/{provider_id}/']['patch']['responses']['200']['content']['application/json'];

export const listProviders = async (): Promise<ProviderListResponse> => {
  const { data, error } = await client.GET('/api/v1/providers/');
  if (error) {
    throw new Error(`Error fetching providers: ${error.detail}`);
  }
  return data;
};

export const createProvider = async (provider: ProviderCreateRequest): Promise<ProviderCreateResponse> => {
  const { data, error } = await client.POST('/api/v1/providers/', {
    body: provider,
  });
  if (error) {
    throw new Error(`Error creating provider: ${error.detail}`);
  }
  return data;
};

export const updateProvider = async (
  providerId: string,
  provider: ProviderUpdateRequest
): Promise<ProviderUpdateResponse> => {
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
