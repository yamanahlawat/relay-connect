import client from '@/lib/api/client';
import { ModelCreate, ModelRead, ModelUpdate } from '@/types/model';

export const listModels = async (providerId: string): Promise<ModelRead[]> => {
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

export const createModel = async (model: ModelCreate): Promise<ModelRead> => {
  const { data, error } = await client.POST('/api/v1/models/', {
    body: model,
  });
  if (error) {
    throw new Error(`Error creating model: ${error.detail}`);
  }
  return data;
};

export const updateModel = async (modelId: string, update: ModelUpdate): Promise<ModelRead> => {
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
