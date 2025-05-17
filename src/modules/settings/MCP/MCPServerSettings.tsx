'use client';

import { JsonEditor } from '@/components/custom/JsonEditor';
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
import { Switch } from '@/components/ui/switch';
import {
  useListMCPServersQuery,
  useMCPServerCreateMutation,
  useMCPServerDeleteMutation,
  useMCPServerToggleMutation,
} from '@/lib/queries/mcp';
import { MCPServerResponse } from '@/types/mcp';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, PlusCircle, Trash2 } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';
import { EmptyState } from '../EmptyState';
import { AddServerDialog } from './AddServerDialog';
import { MCPServerGroup } from './MCPServerGroup';

// Form schema for MCP server creation/update
const mcpServerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  command: z.string().min(1, 'Command is required'),
  args: z.array(z.string()).default([]),
  enabled: z.boolean().default(true),
  env: z.record(z.string()).optional(),
});

type MCPServerFormValues = z.infer<typeof mcpServerSchema>;

export function MCPServerSettings() {
  const { data: servers, isLoading } = useListMCPServersQuery();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();

  // Check for add=true query parameter to open the dialog
  useEffect(() => {
    if (searchParams?.get('add') === 'true') {
      setIsAddDialogOpen(true);
      // Clean the URL to remove query parameters (prevents dialog reopening on refresh)
      router.replace(window.location.pathname);
    }
  }, [searchParams, router]);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedServer, setSelectedServer] = useState<MCPServerResponse | null>(null);

  // Mutations
  const toggleMutation = useMCPServerToggleMutation();
  const createMutation = useMCPServerCreateMutation();
  const deleteMutation = useMCPServerDeleteMutation();

  // Function to handle server enable/disable
  const handleToggleServer = (serverId: string, enabled: boolean) => {
    toggleMutation.mutate({ serverId, enabled });
  };

  // Function to edit a server
  const handleEditServer = (server: MCPServerResponse) => {
    setSelectedServer(server);
    setIsEditDialogOpen(true);
  };

  // Function to delete a server
  const handleDeleteServer = (server: MCPServerResponse) => {
    setSelectedServer(server);
    setIsDeleteDialogOpen(true);
  };

  // Function to handle server deletion confirmation
  const confirmDeleteServer = () => {
    if (selectedServer) {
      deleteMutation.mutate(selectedServer.id, {
        onSuccess: () => {
          toast.success(`MCP server "${selectedServer.name}" deleted`);
          setIsDeleteDialogOpen(false);
          setSelectedServer(null);
        },
        onError: (error) => {
          toast.error(`Failed to delete MCP server: ${error}`);
        },
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-6">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
          </div>
        ) : !servers || servers.length === 0 ? (
          <EmptyState
            title="No MCP Servers"
            description="You haven't added any MCP servers yet. Add one to get started."
            buttonText="Add Server"
            onButtonClick={() => setIsAddDialogOpen(true)}
            Icon={PlusCircle}
          />
        ) : (
          <div className="space-y-6">
            <MCPServerGroup
              servers={servers}
              onToggle={handleToggleServer}
              onEdit={handleEditServer}
              onDelete={handleDeleteServer}
              isUpdating={toggleMutation.isPending}
              updatingServerId={toggleMutation.variables?.serverId}
            />
          </div>
        )}
      </div>

      {/* Add Server Dialog */}
      <AddServerDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        createMutation={createMutation}
      />

      {/* Edit Server Dialog */}
      {selectedServer && (
        <EditServerDialog
          server={selectedServer}
          isOpen={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)}
          toggleMutation={toggleMutation}
        />
      )}

      {/* Delete Server Dialog */}
      {selectedServer && (
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete MCP Server</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete the MCP server &quot;{selectedServer.name}&quot;? This action cannot be
                undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDeleteServer} disabled={deleteMutation.isPending}>
                {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}

interface EditServerDialogProps {
  server: MCPServerResponse;
  isOpen: boolean;
  onClose: () => void;
  toggleMutation: ReturnType<typeof useMCPServerToggleMutation>;
}

function EditServerDialog({ server, isOpen, onClose, toggleMutation }: EditServerDialogProps) {
  // State for toggling between form and JSON mode
  const [isJsonMode, setIsJsonMode] = useState(false);

  // JSON editor state
  const [jsonConfig, setJsonConfig] = useState<string>('');
  const [jsonError, setJsonError] = useState<string | null>(null);

  const [envKeys, setEnvKeys] = useState<string[]>([]);
  const [argsInput, setArgsInput] = useState('');

  // Initialize form with server data
  const form = useForm<MCPServerFormValues>({
    resolver: zodResolver(mcpServerSchema) as unknown as Resolver<MCPServerFormValues, object>, // More specific type
    defaultValues: {
      name: server.name,
      command: server.command,
      args: server.args,
      enabled: server.enabled,
      env: server.env || {},
    },
  });

  // Initialize environment variables and arguments when the dialog opens
  useEffect(() => {
    if (isOpen && server) {
      // Set args input
      const argsString = server.args.join(' ');
      setArgsInput(argsString);

      // Set env keys
      if (server.env) {
        setEnvKeys(Object.keys(server.env));
      } else {
        setEnvKeys([]);
      }

      // Reset form with server data
      form.reset({
        name: server.name,
        command: server.command,
        args: server.args,
        enabled: server.enabled,
        env: server.env || {},
      });

      // Initialize JSON config
      setJsonConfig(
        JSON.stringify(
          {
            name: server.name,
            command: server.command,
            args: server.args,
            enabled: server.enabled,
            env: server.env || {},
          },
          null,
          2
        )
      );
    }
  }, [isOpen, server, form]);

  // Add a new environment variable key
  const addEnvKey = () => {
    // Add an empty string as a placeholder for the new key
    setEnvKeys([...envKeys, '']);
    // The actual key-value pair will be added when the user types a key name
  };

  // Remove an environment variable key by index
  const removeEnvKey = (index: number) => {
    const keyToRemove = envKeys[index];
    const newEnvKeys = [...envKeys];
    newEnvKeys.splice(index, 1);
    setEnvKeys(newEnvKeys);

    // Only update the form data if the key is not empty
    if (keyToRemove) {
      const currentEnv = { ...(form.getValues('env') || {}) };
      delete currentEnv[keyToRemove];
      form.setValue('env', currentEnv);
    }
  };

  // Handle environment variable key change
  const handleEnvKeyChange = (index: number, newKey: string) => {
    // Get the old key and its value
    const oldKey = envKeys[index];

    const currentEnv = { ...(form.getValues('env') || {}) };
    let value = '';

    // If there was a previous key, get its value and remove it
    if (oldKey) {
      value = currentEnv[oldKey] || '';
      delete currentEnv[oldKey];
    }

    // Add the new key-value pair
    if (newKey.trim() !== '') {
      currentEnv[newKey] = value;
    }

    // Update the form state
    form.setValue('env', currentEnv);

    // Update the envKeys array
    const newEnvKeys = [...envKeys];
    newEnvKeys[index] = newKey;
    setEnvKeys(newEnvKeys);

    // Update JSON config if in JSON mode
    if (isJsonMode) {
      updateJsonFromForm();
    }
  };

  // Update environment variable value
  const updateEnvValue = (key: string, value: string) => {
    const currentEnv = { ...(form.getValues('env') || {}) };
    currentEnv[key] = value;
    form.setValue('env', currentEnv);
  };

  // Update JSON when form values change
  const updateJsonFromForm = () => {
    const formValues = form.getValues();
    setJsonConfig(JSON.stringify(formValues, null, 2));
  };

  // Update form when JSON changes
  const updateFormFromJson = () => {
    try {
      const parsedJson = JSON.parse(jsonConfig);

      // Validate with zod schema
      const result = mcpServerSchema.safeParse(parsedJson);
      if (!result.success) {
        setJsonError('Invalid configuration format');
        return false;
      }

      // Update form values
      form.reset(parsedJson);

      // Update UI state
      if (parsedJson.args && Array.isArray(parsedJson.args)) {
        setArgsInput(parsedJson.args.join(' '));
      }

      if (parsedJson.env && typeof parsedJson.env === 'object') {
        setEnvKeys(Object.keys(parsedJson.env));
      }

      setJsonError(null);
      return true;
    } catch {
      setJsonError('Invalid JSON format');
      return false;
    }
  };

  const onSubmit = (data: MCPServerFormValues) => {
    let submitData: MCPServerFormValues;

    if (isJsonMode) {
      // In JSON mode, parse the JSON and validate
      if (!updateFormFromJson()) {
        return; // Don't submit if JSON is invalid
      }
      submitData = form.getValues();
    } else {
      // In form mode, use the form data
      submitData = { ...data };

      // Convert argsInput string to array if needed
      if (argsInput && !submitData.args.length) {
        submitData.args = argsInput.split(' ').filter((arg) => arg.trim() !== '');
      }
    }

    // For now, we can only update the enabled state through the API
    // In the future, we could update this to send all the form data
    toggleMutation.mutate(
      { serverId: server.id, enabled: submitData.enabled },
      {
        onSuccess: () => {
          toast.success('MCP server updated successfully');
          onClose();
        },
        onError: (error) => {
          toast.error(`Failed to update MCP server: ${error}`);
        },
      }
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit MCP Server</DialogTitle>
        </DialogHeader>

        {/* Mode Toggle */}
        <div className="flex items-center justify-end space-x-2">
          <span className="text-muted-foreground text-sm">JSON Mode</span>
          <Switch
            checked={isJsonMode}
            onCheckedChange={(checked) => {
              if (checked) {
                // Switching to JSON mode - update JSON from form
                updateJsonFromForm();
              } else {
                // Switching to form mode - update form from JSON
                updateFormFromJson();
              }
              setIsJsonMode(checked);
            }}
          />
        </div>

        {isJsonMode ? (
          <div className="space-y-4">
            <JsonEditor
              value={jsonConfig}
              onChange={(value) => {
                setJsonConfig(value);
                setJsonError(null);
              }}
              onValidate={(isValid) => {
                if (isValid) {
                  updateFormFromJson();
                }
              }}
              schema={mcpServerSchema}
            />
            {jsonError && <div className="text-destructive text-sm font-medium">{jsonError}</div>}
            <Button
              type="button"
              className="w-full"
              disabled={toggleMutation.isPending}
              onClick={() => {
                const isValid = updateFormFromJson();
                if (isValid) {
                  form.handleSubmit(onSubmit)();
                }
              }}
            >
              {toggleMutation.isPending && toggleMutation.variables?.serverId === server.id && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save Changes
            </Button>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="command"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Command</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormItem>
                <FormLabel>Arguments (space-separated)</FormLabel>
                <FormControl>
                  <Input
                    value={argsInput}
                    onChange={(e) => {
                      setArgsInput(e.target.value);
                      form.setValue(
                        'args',
                        e.target.value.split(' ').filter((arg) => arg.trim() !== '')
                      );
                    }}
                    placeholder="e.g., --port 8000 --debug"
                  />
                </FormControl>
              </FormItem>
              <FormField
                control={form.control}
                name="enabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Enabled</FormLabel>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Environment Variables */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <FormLabel>Environment Variables</FormLabel>
                  <Button type="button" variant="outline" size="sm" onClick={addEnvKey} className="h-8">
                    <PlusCircle className="mr-1 h-3 w-3" />
                    Add
                  </Button>
                </div>

                {envKeys.map((key, index) => (
                  <div key={`env-${index}`} className="flex items-center gap-2">
                    <Input
                      className="flex-1"
                      placeholder="Key"
                      defaultValue={key}
                      onChange={(e) => handleEnvKeyChange(index, e.target.value)}
                    />
                    <Input
                      className="flex-1"
                      placeholder="Value"
                      defaultValue={
                        typeof form.getValues(`env.${key}`) === 'string' ? form.getValues(`env.${key}`) : ''
                      }
                      onBlur={(e) => updateEnvValue(key, e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeEnvKey(index)}
                      className="h-8 w-8"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <DialogFooter>
                <Button type="submit" disabled={toggleMutation.isPending}>
                  {toggleMutation.isPending && toggleMutation.variables?.serverId === server.id && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
