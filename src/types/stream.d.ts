export type StreamBlockType = 'content' | 'error' | 'tool_start' | 'tool_call' | 'tool_result' | 'thinking' | 'done';

interface TextContent {
  type: 'text';
  text: string;
}

interface ImageContent {
  type: 'image';
  url: string;
  alt?: string;
}

interface EmbeddedResource {
  type: 'embedded';
  resourceType: string;
  data: unknown;
}

export interface StreamBlock {
  type: StreamBlockType;
  content?: string | (TextContent | ImageContent | EmbeddedResource)[];

  // Tool specific fields (camelCase)
  toolName?: string;
  toolArgs?: Record<string, unknown> | undefined;
  toolCallId?: string;
  toolStatus?: string;

  // Error details (camelCase)
  errorType?: string;
  errorDetail?: string;
}

export interface RawStreamBlock {
  type: StreamBlockType;
  content: string | (TextContent | ImageContent | EmbeddedResource)[] | null;
  tool_name: string | null;
  tool_args: Record<string, unknown> | null;
  tool_call_id: string | null;
  tool_status: string | null;
  error_type: string | null;
  error_detail: string | null;
}
