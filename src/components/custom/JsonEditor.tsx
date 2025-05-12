import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Code } from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';

interface JsonEditorProps {
  value: string;
  onChange: (value: string) => void;
  onValidate?: (isValid: boolean) => void;
  schema?: { safeParse: (data: unknown) => { success: boolean } };
  minHeight?: string;
}

export function JsonEditor({ value, onChange, onValidate, schema, minHeight = '200px' }: JsonEditorProps) {
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
    setError(null);
  };

  const validateJson = (): boolean => {
    try {
      const parsedJson = JSON.parse(value);

      // If schema is provided, validate against it
      if (schema) {
        const result = schema.safeParse(parsedJson);
        if (!result.success) {
          setError('Invalid configuration format');
          if (onValidate) onValidate(false);
          return false;
        }
      }

      setError(null);
      if (onValidate) onValidate(true);
      return true;
    } catch {
      setError('Invalid JSON format');
      if (onValidate) onValidate(false);
      return false;
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-input bg-muted">
        <Textarea
          value={value}
          onChange={handleChange}
          className={`w-full resize-none bg-transparent font-mono text-foreground`}
          style={{ minHeight, padding: '1rem' }}
          spellCheck="false"
        />
      </div>

      {error && <div className="text-sm font-medium text-destructive">{error}</div>}

      <div className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Code className="h-4 w-4" />
          <span className="font-medium">JSON Configuration Format</span>
        </div>
        <p className="mt-1">Configure using JSON format. Make sure to use valid JSON syntax.</p>
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={() => {
          const isValid = validateJson();
          if (isValid) {
            toast.success('JSON validated successfully');
          }
        }}
      >
        Validate JSON
      </Button>
    </div>
  );
}
