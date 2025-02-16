type StreamBlockType = 'content' | 'thinking' | 'tool_start' | 'tool_call' | 'tool_result' | 'done' | 'error';

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

type ContentItem = TextContent | ImageContent | EmbeddedResource;

// Tool execution tracking
export interface ToolExecution {
  id: string;
  name: string;
  status: 'starting' | 'calling' | 'completed' | 'error';
  arguments?: Record<string, unknown>;
  result?: string | ContentItem[];
  error?: string;
  timestamp: string;
}

// Current tool state
export interface ActiveTool {
  id: string;
  name: string;
  status: 'starting' | 'calling' | 'processing';
  arguments?: Record<string, unknown>;
}

// Stream block with improved typing
export interface StreamBlock {
  type: StreamBlockType;
  content?: string | ContentItem[];

  // Tool-specific fields
  toolName?: string;
  toolArgs?: Record<string, unknown>;
  toolCallId?: string;
  toolStatus?: string;

  // Error handling
  errorType?: string;
  errorDetail?: string;

  // Metadata and state tracking
  extraData?: {
    completedTools: ToolExecution[];
    activeTool: ActiveTool | null;
    accumulatedContent: string;
    completionTimestamp?: string;
  };
}

// Raw stream block from backend
export interface RawStreamBlock {
  type: StreamBlockType;
  content: string | ContentItem[] | null;
  tool_name: string | null;
  tool_args: Record<string, unknown> | null;
  tool_call_id: string | null;
  tool_status: string | null;
  error_type: string | null;
  error_detail: string | null;
  extra_data?: {
    tool_executions?: ToolExecution[];
    completion_timestamp?: string;
    [key: string]: unknown;
  };
}

// State management for streaming
export interface StreamingState {
  // Overall message state
  status: 'thinking' | 'processing' | 'done' | 'error';

  // Content accumulation
  accumulatedContent: string;

  // Tool execution tracking
  completedTools: ToolExecution[];
  activeTool: ActiveTool | null;

  // Error handling
  error?: {
    type: string;
    detail: string;
  };
}

// Helper type for block accumulation
export interface AccumulatedBlocks {
  blocks: StreamBlock[];
  currentContent: string;
  completedTools: ToolExecution[];
  activeTool: ActiveTool | null;
}
