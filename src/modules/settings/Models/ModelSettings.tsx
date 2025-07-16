'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { createModel, deleteModel, updateModel } from '@/lib/api/models';
import type { components } from '@/lib/api/schema';
import { useModelsByProviderQuery } from '@/lib/queries/models';
import { useProvidersQuery } from '@/lib/queries/providers';
import { ModelGroup } from '@/modules/settings/models/ModelGroup';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';
import { EmptyState } from '../EmptyState';

type Model = components['schemas']['ModelRead'];
type ModelCreate = components['schemas']['ModelCreate'];
type ModelUpdate = components['schemas']['ModelUpdate'];

// Form schema for model creation/update
const modelSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  provider_id: z.string().min(1, 'Provider is required'),
  is_active: z.boolean().default(true),
  max_tokens: z.number().min(1).default(4096),
  temperature: z.number().min(0).max(2).default(0.7),
  top_p: z.number().min(0).max(1).default(0.9),
  config: z.record(z.never()).optional(),
});

type ModelFormValues = z.infer<typeof modelSchema>;

export function ModelSettings() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  const [modelToDelete, setModelToDelete] = useState<Model | null>(null);
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();

  const router = useRouter();

  // Check for add=true query parameter to open the dialog
  useEffect(() => {
    if (searchParams?.get('add') === 'true') {
      handleAddModel();
      // Clean the URL to remove query parameters (prevents dialog reopening on refresh)
      router.replace(window.location.pathname);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, router]);

  // Query for fetching providers (for the Provider select in the form)
  const { data: providers = [], isLoading: isLoadingProviders } = useProvidersQuery();

  // Query for fetching all models grouped by provider
  const { data: modelsByProvider, isLoading: isLoadingModels } = useModelsByProviderQuery();

  // Use an empty object if no data is available yet
  const groupedModels = modelsByProvider || {};

  // Form setup
  const form = useForm<ModelFormValues>({
    resolver: zodResolver(modelSchema) as unknown as Resolver<ModelFormValues, object>, // More specific type
    defaultValues: {
      name: '',
      provider_id: '',
      is_active: true,
      max_tokens: 4096,
      temperature: 0.7,
      top_p: 0.9,
      config: {},
    },
  });

  // Reset form when dialog closes
  const handleDialogClose = () => {
    setSelectedModel(null);
    setIsCreateDialogOpen(false);
    form.reset();
  };

  // Handle delete click
  const handleDeleteClick = (model: Model) => {
    setModelToDelete(model);
  };

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: ModelCreate) => createModel(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['models'] });
      toast.success('Model created successfully');
      handleDialogClose();
    },
    onError: () => {
      toast.error('Failed to create model');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ modelId, data }: { modelId: string; data: ModelUpdate }) => updateModel(modelId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['models'] });
      toast.success('Model updated successfully');
      handleDialogClose();
    },
    onError: () => {
      toast.error('Failed to update model');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (modelId: string) => deleteModel(modelId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['models'] });
      toast.success('Model deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete model');
    },
  });

  // Handle form submission
  const onSubmit = (values: ModelFormValues) => {
    if (selectedModel) {
      // For updates, only include changed fields
      const formValues = form.getValues();
      const changedFields = Object.keys(formValues).reduce((acc, key) => {
        const fieldKey = key as keyof ModelFormValues;
        const currentValue = formValues[fieldKey];
        const originalValue = selectedModel[fieldKey];

        if (currentValue !== originalValue) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (acc as any)[fieldKey] = currentValue;
        }
        return acc;
      }, {} as ModelUpdate);

      if (Object.keys(changedFields).length > 0) {
        updateMutation.mutate({
          modelId: selectedModel.id,
          data: changedFields,
        });
      } else {
        handleDialogClose();
      }
    } else {
      const createData: ModelCreate = {
        ...values,
        config: values.config || {},
      };
      createMutation.mutate(createData);
    }
  };

  // Edit model
  const handleEditModel = (model: Model) => {
    setSelectedModel(model);
    form.reset({
      name: model.name,
      provider_id: model.provider_id,
      is_active: model.is_active,
      max_tokens: model.max_tokens,
      temperature: model.temperature,
      top_p: model.top_p,
      config: (model.config as Record<string, never>) || {},
    });
    setIsCreateDialogOpen(true);
  };

  const handleAddModel = () => {
    setSelectedModel(null);
    form.reset({
      name: '',
      provider_id: '',
      is_active: true,
      max_tokens: 4096,
      temperature: 0.7,
      top_p: 0.9,
      config: {},
    });
    setIsCreateDialogOpen(true);
  };

  return (
    <div className="space-y-8">
      {isLoadingProviders || isLoadingModels ? (
        <div className="flex min-h-[200px] items-center justify-center">
          <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
        </div>
      ) : Object.keys(groupedModels).length === 0 ? (
        <div className="bg-card rounded-lg border p-8">
          <EmptyState
            title="No models configured"
            description="Add your first model to get started."
            buttonText="Add Model"
            onButtonClick={handleAddModel}
          />
        </div>
      ) : (
        <div className="bg-card/50 rounded-lg border">
          {Object.entries(groupedModels).map(([providerName, models], index, array) => (
            <div key={providerName} className={index < array.length - 1 ? 'border-b' : ''}>
              <ModelGroup
                key={providerName}
                title={providerName}
                models={models}
                onEdit={handleEditModel}
                onDelete={handleDeleteClick}
              />
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Model Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">{selectedModel ? 'Edit Model' : 'Add Model'}</DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 py-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter model name" className="h-9" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="provider_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Provider</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Select a provider" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {providers.map((provider) => (
                          <SelectItem key={provider.id} value={provider.id}>
                            {provider.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="max_tokens"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Max Tokens</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          step={1}
                          placeholder="4096"
                          className="h-9"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="temperature"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Temperature</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          max={2}
                          step={0.1}
                          placeholder="0.7"
                          className="h-9"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="top_p"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Top P</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          max={1}
                          step={0.05}
                          placeholder="0.9"
                          className="h-9"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="bg-card/50 flex items-center justify-between rounded-md border p-3">
                    <div className="space-y-0.5">
                      <FormLabel className="font-medium">Active</FormLabel>
                      <div className="text-muted-foreground text-xs">Disable to temporarily deactivate this model</div>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <DialogFooter className="pt-2">
                <Button variant="outline" type="button" size="sm" onClick={handleDialogClose}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={createMutation.isPending || updateMutation.isPending}>
                  {(createMutation.isPending || updateMutation.isPending) && (
                    <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  )}
                  {selectedModel ? 'Update Model' : 'Add Model'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={modelToDelete !== null} onOpenChange={(open: boolean) => !open && setModelToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the model {modelToDelete?.name}. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (modelToDelete) {
                  deleteMutation.mutate(modelToDelete.id);
                  setModelToDelete(null);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
