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
import {
  useProviderCreateMutation,
  useProviderDeleteMutation,
  useProvidersQuery,
  useProviderUpdateMutation,
} from '@/lib/queries/providers';
import { EmptyState } from '@/modules/settings/EmptyState';
import { ProviderGroup } from '@/modules/settings/providers/ProviderGroup';
import type { ProviderCreate, ProviderRead, ProviderType, ProviderUpdate } from '@/types/provider';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

// Extract provider types from schema for form validation
const providerTypes: ProviderType[] = ['openai', 'anthropic', 'gemini', 'groq', 'mistral', 'cohere', 'bedrock'];

// Provider display names mapping
const providerDisplayNames: Record<ProviderType, string> = {
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  gemini: 'Gemini',
  groq: 'Groq',
  mistral: 'Mistral',
  cohere: 'Cohere',
  bedrock: 'Bedrock',
};

// Form schema for provider creation/update - matching backend schema
const providerSchema = z.object({
  name: z.string().min(1, 'Provider name is required'),
  type: z.enum(providerTypes as [ProviderType, ...ProviderType[]]),
  is_active: z.boolean(),
  base_url: z.string().optional().or(z.literal('')),
  api_key: z.string().optional().or(z.literal('')),
});

type ProviderFormValues = z.infer<typeof providerSchema>;

export function ProviderSettings() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<ProviderRead | null>(null);
  const [providerToDelete, setProviderToDelete] = useState<ProviderRead | null>(null);
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
    resolver: zodResolver(providerSchema),
    defaultValues: {
      name: '',
      type: 'anthropic',
      is_active: true,
      base_url: '',
      api_key: '',
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
      base_url: '',
      api_key: '',
    });
  };

  // Handle delete click
  const handleDeleteClick = (provider: ProviderRead) => {
    setProviderToDelete(provider);
  };

  // Mutations
  const createMutation = useProviderCreateMutation(handleDialogClose);
  const updateMutation = useProviderUpdateMutation(handleDialogClose);
  const deleteMutation = useProviderDeleteMutation();

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
        name: values.name,
        type: values.type,
        is_active: values.is_active,
        ...(values.base_url && { base_url: values.base_url }),
        ...(values.api_key && { api_key: values.api_key }),
      };
      createMutation.mutate(createData);
    }
  };

  // Edit provider
  const handleEditProvider = (provider: ProviderRead) => {
    setSelectedProvider(provider);
    form.reset({
      name: provider.name,
      type: provider.type,
      is_active: provider.is_active,
      base_url: provider.base_url || '',
      api_key: provider.api_key || '',
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
      base_url: '',
      api_key: '',
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
      {} as Record<string, ProviderRead[]>
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
                        {providerTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {providerDisplayNames[type]}
                          </SelectItem>
                        ))}
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
