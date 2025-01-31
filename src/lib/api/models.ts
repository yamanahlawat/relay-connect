import client from '@/lib/api/client';
import type { paths } from '@/lib/api/schema';

type ModelsListResponse = paths['/api/v1/models/']['get']['responses']['200']['content']['application/json'];
type ModelCreateRequest = paths['/api/v1/models/']['post']['requestBody']['content']['application/json'];
type ModelCreateResponse = paths['/api/v1/models/']['post']['responses']['201']['content']['application/json'];
type ModelUpdateRequest =
  paths['/api/v1/models/{llm_model_id}/']['patch']['requestBody']['content']['application/json'];
type ModelUpdateResponse =
  paths['/api/v1/models/{llm_model_id}/']['patch']['responses']['200']['content']['application/json'];

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

export const createModel = async (model: ModelCreateRequest): Promise<ModelCreateResponse> => {
  const { data, error } = await client.POST('/api/v1/models/', {
    body: model,
  });
  if (error) {
    throw new Error(`Error creating model: ${error.detail}`);
  }
  return data;
};

export const updateModel = async (modelId: string, update: ModelUpdateRequest): Promise<ModelUpdateResponse> => {
  const { data, error } = await client.PATCH('/api/v1/models/{llm_model_id}/', {
    params: {
      path: { llm_model_id: modelId },
    },
    body: update,
  });
  if (error) {
    throw new Error(`Error updating model: ${error.detail}`);
  }
  return data;
};

export const deleteModel = async (modelId: string): Promise<void> => {
  const { error } = await client.DELETE('/api/v1/models/{llm_model_id}/', {
    params: {
      path: { llm_model_id: modelId },
    },
  });
  if (error) {
    throw new Error(`Error deleting model: ${error.detail}`);
  }
};
