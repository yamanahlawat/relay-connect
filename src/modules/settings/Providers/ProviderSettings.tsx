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
import { createProvider, deleteProvider, updateProvider } from '@/lib/api/providers';
import type { components } from '@/lib/api/schema';
import { useProvidersQuery } from '@/lib/queries/providers';
import { EmptyState } from '@/modules/settings/EmptyState';
import { ProviderGroup } from '@/modules/settings/providers/ProviderGroup';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';

type Provider = components['schemas']['ProviderRead'];
type ProviderCreate = components['schemas']['ProviderCreate'];
type ProviderUpdate = components['schemas']['ProviderUpdate'];

// Form schema for provider creation/update
const providerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.enum(['anthropic', 'openai', 'ollama'] as const),
  is_active: z.boolean().default(true),
  base_url: z.string().nullable().optional(),
  api_key: z.string().nullable().optional(),
  config: z.record(z.never()).optional(),
});

type ProviderFormValues = z.infer<typeof providerSchema>;

export function ProviderSettings() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [providerToDelete, setProviderToDelete] = useState<Provider | null>(null);
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();

  const router = useRouter();

  // Check for add=true query parameter to open the dialog
  useEffect(() => {
    if (searchParams?.get('add') === 'true') {
      handleAddProvider();
      // Clean the URL to remove query parameters (prevents dialog reopening on refresh)
      router.replace(window.location.pathname);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, router]);

  // Query for fetching providers
  const { data: providers = [], isLoading } = useProvidersQuery();

  // Form setup
  const form = useForm<ProviderFormValues>({
    resolver: zodResolver(providerSchema) as unknown as Resolver<ProviderFormValues, object>, // More specific type
    defaultValues: {
      name: '',
      type: 'anthropic',
      is_active: true,
      base_url: null,
      api_key: null,
      config: {},
    },
  });

  // Reset form when dialog closes
  const handleDialogClose = () => {
    setSelectedProvider(null);
    setIsCreateDialogOpen(false);
    // Reset form with default values
    form.reset({
      name: '',
      type: 'anthropic',
      is_active: true,
      base_url: null,
      api_key: null,
      config: {},
    });
  };

  // Handle delete click
  const handleDeleteClick = (provider: Provider) => {
    setProviderToDelete(provider);
  };

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: ProviderCreate) => createProvider(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['providers'] });
      toast.success('Provider created successfully');
      handleDialogClose();
    },
    onError: () => {
      toast.error('Failed to create provider');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ providerId, data }: { providerId: string; data: ProviderUpdate }) =>
      updateProvider(providerId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['providers'] });
      toast.success('Provider updated successfully');
      handleDialogClose();
    },
    onError: () => {
      toast.error('Failed to update provider');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (providerId: string) => deleteProvider(providerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['providers'] });
      toast.success('Provider deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete provider');
    },
  });

  // Handle form submission
  const onSubmit = (values: ProviderFormValues) => {
    if (selectedProvider) {
      // For updates, only include changed fields
      const formValues = form.getValues();
      const changedFields = Object.keys(formValues).reduce((acc, key) => {
        const fieldKey = key as keyof ProviderFormValues;
        const currentValue = formValues[fieldKey];
        const originalValue = selectedProvider[fieldKey];

        if (currentValue !== originalValue) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (acc as any)[fieldKey] = currentValue;
        }
        return acc;
      }, {} as ProviderUpdate);

      if (Object.keys(changedFields).length > 0) {
        updateMutation.mutate({
          providerId: selectedProvider.id,
          data: changedFields,
        });
      } else {
        handleDialogClose();
      }
    } else {
      const createData: ProviderCreate = {
        ...values,
        config: values.config || {},
      };
      createMutation.mutate(createData);
    }
  };

  // Edit provider
  const handleEditProvider = (provider: Provider) => {
    setSelectedProvider(provider);
    form.reset({
      name: provider.name,
      type: provider.type,
      is_active: provider.is_active,
      base_url: provider.base_url,
      api_key: provider.api_key,
      config: (provider.config as Record<string, never>) || {},
    });
    setIsCreateDialogOpen(true);
  };

  const handleAddProvider = () => {
    setSelectedProvider(null);
    // Reset form with default values
    form.reset({
      name: '',
      type: 'anthropic',
      is_active: true,
      base_url: null,
      api_key: null,
      config: {},
    });
    setIsCreateDialogOpen(true);
  };

  // Group providers by type
  const groupedProviders = useMemo(() => {
    return providers.reduce(
      (acc, provider) => {
        const type = provider.type;
        if (!acc[type]) {
          acc[type] = [];
        }
        acc[type].push(provider);
        return acc;
      },
      {} as Record<string, Provider[]>
    );
  }, [providers]);

  return (
    <div className="space-y-8">
      {isLoading ? (
        <div className="flex min-h-[200px] items-center justify-center">
          <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
        </div>
      ) : providers.length === 0 ? (
        <div className="bg-card rounded-lg border p-8">
          <EmptyState
            title="No providers configured"
            description="Add your first provider to get started with models."
            buttonText="Add Provider"
            onButtonClick={handleAddProvider}
          />
        </div>
      ) : (
        <div className="bg-card/50 rounded-lg border">
          {Object.entries(groupedProviders).map(([type, providers], index, array) => (
            <div key={type} className={index < array.length - 1 ? 'border-b' : ''}>
              <ProviderGroup
                title={`${type.charAt(0).toUpperCase()}${type.slice(1)}`}
                providers={providers}
                onEdit={handleEditProvider}
                onDelete={handleDeleteClick}
              />
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Provider Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">{selectedProvider ? 'Edit Provider' : 'Add Provider'}</DialogTitle>
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
                      <Input placeholder="Enter provider name" className="h-9" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Select a provider type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="anthropic">Anthropic</SelectItem>
                        <SelectItem value="openai">OpenAI</SelectItem>
                        <SelectItem value="ollama">Ollama</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="api_key"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">API Key</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Enter API key"
                        className="h-9"
                        {...field}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="base_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Base URL</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://api.example.com"
                        className="h-9"
                        {...field}
                        value={field.value ?? ''}
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
                  <FormItem className="bg-card/50 flex items-center justify-between rounded-md border p-3">
                    <div className="space-y-0.5">
                      <FormLabel className="font-medium">Active</FormLabel>
                      <div className="text-muted-foreground text-xs">
                        Disable to temporarily deactivate this provider
                      </div>
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
                  {selectedProvider ? 'Update Provider' : 'Add Provider'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={providerToDelete !== null}
        onOpenChange={(open: boolean) => !open && setProviderToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the provider {providerToDelete?.name}. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (providerToDelete) {
                  deleteMutation.mutate(providerToDelete.id);
                  setProviderToDelete(null);
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
