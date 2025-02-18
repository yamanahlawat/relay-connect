// Content types
export interface TextContent {
  type: 'text';
  text: string;
}

export interface ImageContent {
  type: 'image';
  url: string;
  alt?: string;
}

export interface EmbeddedResource {
  type: 'embedded';
  resourceType: string;
  data: unknown;
}

export type ContentItem = TextContent | ImageContent | EmbeddedResource;

// Block types
export type StreamBlockType = 'content' | 'thinking' | 'tool_start' | 'tool_call' | 'tool_result' | 'done' | 'error';

// Tool execution states
export type ToolExecutionStatus = 'starting' | 'calling' | 'completed' | 'error';
export type ToolActivityStatus = 'starting' | 'calling' | 'processing';

// Tool execution tracking
interface ToolExecution {
  id: string;
  name: string;
  status: ToolExecutionStatus;
  arguments?: Record<string, unknown>;
  tool_result?: ContentItem[];
  error?: string;
  timestamp: string;
}

// Active tool state
export interface ActiveTool {
  id: string;
  name: string;
  status: ToolActivityStatus;
  arguments?: Record<string, unknown>;
}

// Extra data for stream blocks
export interface StreamBlockExtraData {
  completedTools: ToolExecution[];
  activeTool: ActiveTool | null;
  accumulatedContent: string;
  completionTimestamp?: string;
  // Added fields to match usage in useChat
  type?: StreamBlockType;
  content?: string;
  toolName?: string;
  toolArgs?: Record<string, unknown>;
  toolCallId?: string;
  thinkingText?: string;
  errorType?: string;
  errorDetail?: string;
}

// Stream block with improved typing
export interface StreamBlock {
  type: StreamBlockType;
  content?: string | ContentItem[];
  toolName?: string;
  toolArgs?: Record<string, unknown>;
  toolCallId?: string;
  toolStatus?: string;
  toolResult?: ContentItem[];
  errorType?: string;
  errorDetail?: string;
  extraData?: StreamBlockExtraData;
  message?: unknown; // For final message replacement
}

// Raw stream block from backend
export interface RawStreamBlock {
  type: StreamBlockType;
  content: string | ContentItem[] | null;
  tool_name: string | null;
  tool_args: Record<string, unknown> | null;
  tool_call_id: string | null;
  tool_status: string | null;
  tool_result: ContentItem[] | null;
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
  content: string;
  completedTools: ToolExecution[];
  activeTools: ActiveTool[];
  isThinking: boolean;
  thinkingText?: string;
  error?: {
    type: string;
    detail: string;
  };
}

// Message extra data structure
export interface MessageExtraData {
  type: StreamBlockType;
  content?: string | ContentItem[];
  toolName?: string;
  toolArgs?: Record<string, unknown>;
  toolCallId?: string;
  completedTools: ToolExecution[];
  activeTool: ActiveTool | null;
  thinkingText?: string;
  accumulatedContent: string;
  blocks?: StreamBlock[];
}
