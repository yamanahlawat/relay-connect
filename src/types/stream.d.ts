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

// Block types - expanded to include new streaming types
export type StreamBlockType = 'content' | 'thinking' | 'tool_start' | 'tool_call' | 'tool_result' | 'done' | 'error';

// Progressive tool args - simplified for streaming UX only
export interface ProgressiveToolArgs {
  tool_call_id: string;
  tool_name: string;
  accumulated_args: string;
}

// Stream block with improved typing for new streaming format
export interface StreamBlock {
  type: StreamBlockType;
  content: string | ContentItem[] | null;
  tool_name: string | null;
  tool_args: Record<string, unknown> | null;
  tool_call_id: string | null;
  tool_status: string | null;
  tool_result: ContentItem[] | null;
  args_delta: string | null;
  error_type: string | null;
  error_detail: string | null;
  message: string | null;
  usage: Record<string, unknown> | null;
  timestamp: string | null;
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
  progressive_tool_args?: Map<string, ProgressiveToolArgs>;
  message?: import('@/types/message').StreamingMessageRead;
}

export interface ProcessedStreamBlock extends StreamBlock {
  index: number;
  next_block_type?: StreamBlockType;
}
