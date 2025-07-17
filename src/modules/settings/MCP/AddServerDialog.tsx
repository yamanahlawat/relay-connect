'use client';

import { JsonEditor } from '@/components/custom/JsonEditor';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useMCPServerCreateMutation } from '@/lib/queries/mcp';
import { MCPServerCreate } from '@/types/mcp';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, PlusCircle, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import * as z from 'zod';

// Form schema for MCP server creation
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

interface AddServerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  createMutation: ReturnType<typeof useMCPServerCreateMutation>;
}

export function AddServerDialog({ isOpen, onClose, createMutation }: AddServerDialogProps) {
  // State for toggling between form and JSON mode
  const [isJsonMode, setIsJsonMode] = useState(false);

  // JSON editor state
  const [jsonConfig, setJsonConfig] = useState<string>(`{
  "name": "",
  "command": "",
  "server_type": "stdio",
  "enabled": true,
  "env": {},
  "config": {}
}`);
  const [jsonError, setJsonError] = useState<string | null>(null);

  // Form state
  const form = useForm<MCPServerFormValues>({
    resolver: zodResolver(mcpServerSchema) as unknown as Resolver<MCPServerFormValues, object>, // More specific type
    defaultValues: {
      name: '',
      command: '',
      server_type: 'stdio',
      enabled: true,
      env: {},
      config: {},
    },
  });

  const [argsInput, setArgsInput] = useState('');
  const [envKeys, setEnvKeys] = useState<string[]>([]);

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

  const onSubmit = (data: MCPServerFormValues) => {
    let submitData: MCPServerCreate;

    if (isJsonMode) {
      // In JSON mode, parse the JSON and validate
      if (!updateFormFromJson()) {
        return; // Don't submit if JSON is invalid
      }
      const formData = form.getValues();
      submitData = {
        name: formData.name,
        command: formData.command,
        server_type: formData.server_type,
        enabled: formData.enabled,
        env: formData.env,
        config: formData.config,
      };
    } else {
      // In form mode, use the form data
      submitData = {
        name: data.name,
        command: data.command,
        server_type: data.server_type,
        enabled: data.enabled,
        env: data.env,
        config: data.config,
      };
    }

    createMutation.mutate(submitData, {
      onSuccess: () => {
        // Reset form state
        form.reset();
        setArgsInput('');
        setEnvKeys([]);
        setJsonConfig(`{
          "name": "",
          "command": "",
          "server_type": "stdio",
          "enabled": true,
          "env": {},
          "config": {}
        }`);
        onClose();
      },
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add MCP Server</DialogTitle>
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
              disabled={createMutation.isPending}
              onClick={() => {
                const isValid = updateFormFromJson();
                if (isValid) {
                  form.handleSubmit(onSubmit)();
                }
              }}
            >
              {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Server
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
                      <Input {...field} placeholder="e.g., tavily-search" />
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
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{form.watch('server_type') === 'streamable_http' ? 'Server URL' : 'Command'}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={
                          form.watch('server_type') === 'streamable_http'
                            ? 'https://your-server.com/mcp'
                            : 'e.g., python -m server'
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Conditional Fields Based on Server Type */}
              {form.watch('server_type') === 'stdio' && (
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
              )}

              {form.watch('server_type') === 'streamable_http' && <AddHTTPStreamableFields form={form} />}
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
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Server
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Add HTTP Streamable Fields Component
interface AddHTTPStreamableFieldsProps {
  form: ReturnType<typeof useForm<MCPServerFormValues>>;
}

function AddHTTPStreamableFields({ form }: AddHTTPStreamableFieldsProps) {
  const [headerKeys, setHeaderKeys] = useState<string[]>([]);

  // Initialize header keys from config
  useEffect(() => {
    const config = form.getValues('config') as { headers?: Record<string, string> };
    if (config?.headers) {
      setHeaderKeys(Object.keys(config.headers));
    }
  }, [form]);

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
            <FormLabel>Timeout (seconds)</FormLabel>
            <Input
              type="number"
              placeholder="30"
              value={getConfigValue('timeout') as string}
              onChange={(e) => setConfigValue('timeout', e.target.value ? parseInt(e.target.value) : undefined)}
              className="mt-1"
            />
          </div>

          {/* Tool Prefix */}
          <div>
            <FormLabel>Tool Prefix</FormLabel>
            <Input
              placeholder="e.g., my_server_"
              value={getConfigValue('tool_prefix') as string}
              onChange={(e) => setConfigValue('tool_prefix', e.target.value || undefined)}
              className="mt-1"
            />
          </div>

          {/* SSE Read Timeout */}
          <div>
            <FormLabel>SSE Read Timeout (seconds)</FormLabel>
            <Input
              type="number"
              placeholder="60"
              value={getConfigValue('sse_read_timeout') as string}
              onChange={(e) =>
                setConfigValue('sse_read_timeout', e.target.value ? parseInt(e.target.value) : undefined)
              }
              className="mt-1"
            />
          </div>

          {/* Headers */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <FormLabel>HTTP Headers</FormLabel>
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
