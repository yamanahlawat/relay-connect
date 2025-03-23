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
  resource_type: string;
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
  completed_tools: ToolExecution[];
  active_tool: ActiveTool | null;
  accumulated_content: string;
  completion_timestamp?: string;
  // Added fields to match usage in useChat
  type?: StreamBlockType;
  content?: string;
  tool_name?: string;
  tool_args?: Record<string, unknown>;
  tool_call_id?: string;
  thinking_text?: string;
  error_type?: string;
  error_detail?: string;
}

// Stream block with improved typing
export interface StreamBlock {
  type: StreamBlockType;
  content: string | ContentItem[] | null;
  tool_name: string | null;
  tool_args: Record<string, unknown> | null;
  tool_call_id: string | null;
  tool_status: string | null;
  tool_result: ContentItem[] | null;
  error_type: string | null;
  error_detail: string | null;
  extra_data: object | null;
  stream_index?: number;
}

// Stream state (snake_case to match API)
export interface StreamState {
  content_sections: StreamingContent[];
  tool_blocks: StreamBlock[];
  last_index: number;
  thinking: {
    is_thinking: boolean;
    content?: string;
  };
  error?: {
    type: string;
    detail: string;
  };
}

export interface StreamingContent {
  content: string;
  index: number;
  is_complete: boolean;
  stream_index?: number;
}

// Component props (snake_case since they handle API data)
export interface StreamingMessageProps {
  blocks: StreamBlock[];
  thinking?: {
    is_thinking: boolean;
    content?: string;
  };
}

// Streaming state management
export interface StreamingState {
  content: string;
  completed_tools: ToolExecution[];
  active_tools: ActiveTool[];
  is_thinking: boolean;
  thinking_text?: string;
  error?: {
    type: string;
    detail: string;
  };
}

export interface ProcessedStreamBlock extends StreamBlock {
  index: number;
  next_block_type?: StreamBlockType;
}
