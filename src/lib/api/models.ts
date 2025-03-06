import client from '@/lib/api/client';
import type { ModelCreate, ModelRead, ModelUpdate, ModelsByProvider } from '@/types/model';

interface ListModelsParams {
  provider_id?: string;
  isActive?: boolean;
  limit?: number;
  offset?: number;
  modelName?: string;
}

export const listModels = async ({ provider_id, isActive, limit, offset, modelName }: ListModelsParams = {}): Promise<
  ModelRead[]
> => {
  const { data, error } = await client.GET('/api/v1/models/', {
    params: {
      query: {
        ...(provider_id ? { provider_id } : {}),
        ...(typeof isActive === 'boolean' ? { is_active: isActive } : {}),
        ...(limit ? { limit } : {}),
        ...(typeof offset === 'number' ? { offset } : {}),
        ...(modelName ? { model_name: modelName } : {}),
      },
    },
  });
  if (error) {
    throw new Error(`Error fetching models for provider ${provider_id}: ${error.detail}`);
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

export const listModelsByProvider = async (): Promise<ModelsByProvider> => {
  const { data, error } = await client.GET('/api/v1/models/all/', {});
  if (error) {
    throw new Error(`Error fetching models by provider: ${error}`);
  }
  return data;
};

export const getModel = async (modelId: string): Promise<ModelRead> => {
  const { data, error } = await client.GET('/api/v1/models/{llm_model_id}/', {
    params: {
      path: { llm_model_id: modelId },
    },
  });
  if (error) {
    throw new Error(`Error fetching model ${modelId}: ${error.detail}`);
  }
  return data;
};
