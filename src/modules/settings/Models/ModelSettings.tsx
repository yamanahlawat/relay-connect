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
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { createModel, deleteModel, updateModel } from '@/lib/api/models';
import type { components } from '@/lib/api/schema';
import { useModelsByProvider } from '@/lib/queries/models';
import { useProviders } from '@/lib/queries/providers';
import { ModelGroup } from '@/modules/settings/Models/ModelGroup';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, PlusCircle } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
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
  input_cost_per_token: z.number().min(0).default(0),
  output_cost_per_token: z.number().min(0).default(0),
  config: z.record(z.never()).optional(),
});

type ModelFormValues = z.infer<typeof modelSchema>;

// function EmptyState({ onAdd }: { onAdd: () => void }) {
//   return (
//     <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border-2 border-dashed">
//       <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
//         <h3 className="mt-4 text-lg font-semibold">No models configured</h3>
//         <p className="mb-4 mt-2 text-sm text-muted-foreground">Add your first model to get started.</p>
//         <Button onClick={onAdd}>
//           <PlusCircle className="mr-2 h-4 w-4" />
//           Add Model
//         </Button>
//       </div>
//     </div>
//   );
// }

export function ModelSettings() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  const [modelToDelete, setModelToDelete] = useState<Model | null>(null);
  const queryClient = useQueryClient();

  // Query for fetching providers (for the Provider select in the form)
  const { data: providers = [], isLoading: isLoadingProviders } = useProviders();

  // Query for fetching all models grouped by provider
  const { data: modelsByProvider, isLoading: isLoadingModels } = useModelsByProvider();

  // Use an empty object if no data is available yet
  const groupedModels = modelsByProvider || {};

  // Form setup
  const form = useForm<ModelFormValues>({
    resolver: zodResolver(modelSchema),
    defaultValues: {
      name: '',
      provider_id: '',
      is_active: true,
      max_tokens: 4096,
      temperature: 0.7,
      top_p: 0.9,
      input_cost_per_token: 0,
      output_cost_per_token: 0,
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
      input_cost_per_token: model.input_cost_per_token,
      output_cost_per_token: model.output_cost_per_token,
      config: model.config || {},
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
      input_cost_per_token: 0,
      output_cost_per_token: 0,
      config: {},
    });
    setIsCreateDialogOpen(true);
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b p-4 pr-14">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">Models</h2>
          <p className="text-sm text-muted-foreground">Configure and manage your LLM models</p>
        </div>
        <Button onClick={handleAddModel}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Model
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6">
          <Card>
            <CardContent className="p-6">
              {isLoadingProviders || isLoadingModels ? (
                <div className="flex h-[200px] items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : Object.keys(groupedModels).length === 0 ? (
                <EmptyState
                  title="No models configured"
                  description="Add your first model to get started."
                  buttonText="Add Model"
                  onButtonClick={handleAddModel}
                />
              ) : (
                <div className="space-y-6">
                  {Object.entries(groupedModels).map(([providerName, models]) => (
                    <ModelGroup
                      key={providerName}
                      title={providerName}
                      models={models}
                      onEdit={handleEditModel}
                      onDelete={handleDeleteClick}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedModel ? 'Edit Model' : 'Add Model'}</DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Model name" {...field} />
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
                    <FormLabel>Provider</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
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
                      <FormLabel>Max Tokens</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          step={1}
                          placeholder="4096"
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
                      <FormLabel>Temperature</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          max={2}
                          step={0.1}
                          placeholder="0.7"
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
                      <FormLabel>Top P</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          max={1}
                          step={0.05}
                          placeholder="0.9"
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
                  name="input_cost_per_token"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Input Cost per 1M Tokens</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          step="any"
                          placeholder="0.0"
                          value={field.value * 1000000}
                          onChange={(e) => field.onChange(Number(e.target.value) / 1000000)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="output_cost_per_token"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Output Cost per 1M Tokens</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        step="any"
                        placeholder="0.0"
                        value={field.value * 1000000}
                        onChange={(e) => field.onChange(Number(e.target.value) / 1000000)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel>Active</FormLabel>
                      <div className="text-sm text-muted-foreground">Disable to temporarily deactivate this model</div>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button variant="outline" type="button" onClick={handleDialogClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {(createMutation.isPending || updateMutation.isPending) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
