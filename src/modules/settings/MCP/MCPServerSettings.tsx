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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
// Uses ServerType from schema: components['schemas']['ServerType']
const mcpServerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  command: z.string().min(1, 'Command/URL is required'),
  server_type: z.enum(['stdio', 'streamable_http'] as const).default('stdio'),
  enabled: z.boolean().default(true),
  env: z.record(z.string()).optional(),
  config: z.record(z.unknown()).optional(),
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
  const createMutation = useMCPServerCreateMutation(() => setIsAddDialogOpen(false));
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
    <div className="space-y-8">
      {isLoading ? (
        <div className="flex min-h-[200px] items-center justify-center">
          <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
        </div>
      ) : !servers || servers.length === 0 ? (
        <div className="bg-card rounded-lg border p-8">
          <EmptyState
            title="No MCP Servers"
            description="You haven't added any MCP servers yet. Add one to get started."
            buttonText="Add Server"
            onButtonClick={() => setIsAddDialogOpen(true)}
            Icon={PlusCircle}
          />
        </div>
      ) : (
        <div className="bg-card/50 rounded-lg border">
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
      server_type: server.server_type,
      enabled: server.enabled,
      env: server.env || {},
      config: server.config || {},
    },
  });

  // Initialize environment variables and arguments when the dialog opens
  useEffect(() => {
    if (isOpen && server) {
      // Set args input from config.args if available
      if (server.config && typeof server.config === 'object' && 'args' in server.config) {
        const configArgs = server.config.args as string[];
        if (Array.isArray(configArgs)) {
          setArgsInput(configArgs.join(' '));
        }
      } else {
        setArgsInput('');
      }

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
        server_type: server.server_type,
        enabled: server.enabled,
        env: server.env || {},
        config: server.config || {},
      });

      // Initialize JSON config
      setJsonConfig(
        JSON.stringify(
          {
            name: server.name,
            command: server.command,
            server_type: server.server_type,
            enabled: server.enabled,
            env: server.env || {},
            config: server.config || {},
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

      // Update UI state - check for args in config
      if (parsedJson.config && parsedJson.config.args && Array.isArray(parsedJson.config.args)) {
        setArgsInput(parsedJson.config.args.join(' '));
      } else {
        setArgsInput('');
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

              {/* Server Type Selection */}
              <FormField
                control={form.control}
                name="server_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Server Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select server type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="stdio">Standard I/O</SelectItem>
                        <SelectItem value="streamable_http">HTTP Streamable</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="command"
                render={({ field }) => {
                  const serverType = form.watch('server_type');
                  return (
                    <FormItem>
                      <FormLabel>{serverType === 'streamable_http' ? 'Server URL' : 'Command'}</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder={
                            serverType === 'streamable_http' ? 'https://your-server.com/mcp' : 'path/to/executable'
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />

              {/* Conditional Fields Based on Server Type */}
              {(() => {
                const serverType = form.watch('server_type');
                return (
                  serverType === 'stdio' && (
                    <>
                      <FormItem>
                        <FormLabel>Arguments (space-separated)</FormLabel>
                        <FormControl>
                          <Input
                            value={argsInput}
                            onChange={(e) => {
                              setArgsInput(e.target.value);
                              // Store args in config.args as array
                              const args = e.target.value.split(' ').filter((arg) => arg.trim() !== '');
                              const currentConfig = form.getValues('config') || {};
                              form.setValue('config', { ...currentConfig, args });
                            }}
                            placeholder="e.g., -y tavily-mcp@0.1.3"
                          />
                        </FormControl>
                      </FormItem>

                      {/* Environment Variables - Only for stdio */}
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
                    </>
                  )
                );
              })()}

              {(() => {
                const serverType = form.watch('server_type');
                return serverType === 'streamable_http' && <HTTPStreamableFields form={form} />;
              })()}

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

// HTTP Streamable Fields Component
interface HTTPStreamableFieldsProps {
  form: ReturnType<typeof useForm<MCPServerFormValues>>;
}

function HTTPStreamableFields({ form }: HTTPStreamableFieldsProps) {
  const [headerKeys, setHeaderKeys] = useState<string[]>([]);

  // Watch for config changes to update header keys
  const config = form.watch('config') as { headers?: Record<string, string> } | undefined;

  // Initialize header keys from config
  useEffect(() => {
    if (config?.headers) {
      setHeaderKeys(Object.keys(config.headers));
    } else {
      setHeaderKeys([]);
    }
  }, [config]);

  const addHeaderKey = () => {
    setHeaderKeys([...headerKeys, '']);
  };

  const removeHeaderKey = (index: number) => {
    const keyToRemove = headerKeys[index];
    const newHeaderKeys = [...headerKeys];
    newHeaderKeys.splice(index, 1);
    setHeaderKeys(newHeaderKeys);

    if (keyToRemove) {
      const currentConfig = (form.getValues('config') as { headers?: Record<string, string> }) || {};
      const headers = { ...currentConfig.headers };
      delete headers[keyToRemove];
      form.setValue('config', { ...currentConfig, headers });
    }
  };

  const handleHeaderKeyChange = (index: number, newKey: string) => {
    const oldKey = headerKeys[index];
    const currentConfig = (form.getValues('config') as { headers?: Record<string, string> }) || {};
    const headers = { ...currentConfig.headers };
    let value = '';

    if (oldKey) {
      value = headers[oldKey] || '';
      delete headers[oldKey];
    }

    if (newKey.trim() !== '') {
      headers[newKey] = value;
    }

    form.setValue('config', { ...currentConfig, headers });

    const newHeaderKeys = [...headerKeys];
    newHeaderKeys[index] = newKey;
    setHeaderKeys(newHeaderKeys);
  };

  const updateHeaderValue = (key: string, value: string) => {
    const currentConfig = (form.getValues('config') as { headers?: Record<string, string> }) || {};
    const headers = { ...currentConfig.headers };
    headers[key] = value;
    form.setValue('config', { ...currentConfig, headers });
  };

  const getConfigValue = (key: string) => {
    const config = form.getValues('config') as Record<string, unknown>;
    return config?.[key] || '';
  };

  const setConfigValue = (key: string, value: unknown) => {
    const currentConfig = (form.getValues('config') as Record<string, unknown>) || {};
    form.setValue('config', { ...currentConfig, [key]: value });
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border p-6">
        <h4 className="mb-4 text-sm font-medium">HTTP Streamable Configuration</h4>

        <div className="space-y-4">
          {/* Timeout */}
          <div>
            <FormLabel className="text-sm font-medium">Timeout (seconds)</FormLabel>
            <Input
              type="number"
              placeholder="30"
              className="mt-1"
              value={getConfigValue('timeout') as string}
              onChange={(e) => setConfigValue('timeout', e.target.value ? parseInt(e.target.value) : undefined)}
            />
          </div>

          {/* Tool Prefix */}
          <div>
            <FormLabel className="text-sm font-medium">Tool Prefix</FormLabel>
            <Input
              placeholder="e.g., my_server_"
              className="mt-1"
              value={getConfigValue('tool_prefix') as string}
              onChange={(e) => setConfigValue('tool_prefix', e.target.value || undefined)}
            />
          </div>

          {/* Request Timeout */}
          <div>
            <FormLabel className="text-sm font-medium">Request Timeout (seconds)</FormLabel>
            <Input
              type="number"
              placeholder="30"
              className="mt-1"
              value={getConfigValue('request_timeout') as string}
              onChange={(e) => setConfigValue('request_timeout', e.target.value ? parseInt(e.target.value) : undefined)}
            />
          </div>

          {/* Headers */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <FormLabel className="text-sm font-medium">HTTP Headers</FormLabel>
              <Button type="button" variant="outline" size="sm" onClick={addHeaderKey} className="h-8">
                <PlusCircle className="mr-1 h-3 w-3" />
                Add
              </Button>
            </div>

            {headerKeys.map((key, index) => (
              <div key={`header-${index}`} className="flex items-center gap-2">
                <Input
                  className="flex-1"
                  placeholder="Header Name"
                  defaultValue={key}
                  onChange={(e) => handleHeaderKeyChange(index, e.target.value)}
                />
                <Input
                  className="flex-1"
                  placeholder="Header Value"
                  defaultValue={(() => {
                    const config = form.getValues('config') as { headers?: Record<string, string> };
                    return config?.headers?.[key] || '';
                  })()}
                  onBlur={(e) => updateHeaderValue(key, e.target.value)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeHeaderKey(index)}
                  className="h-8 w-8"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
