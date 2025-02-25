import type { components } from '@/lib/api/schema';
import type { StreamBlock } from '@/types/stream';

type MessageRead = components['schemas']['MessageRead'];
type MessageUpdate = components['schemas']['MessageUpdate'];
type MessageRole = components['schemas']['MessageRole'];
type MessageCreate = components['schemas']['MessageCreate'];

// Define the streaming-specific extra data type with index signature
// to make it compatible with Record<string, never>
interface StreamingExtraData {
  stream_blocks?: StreamBlock[];
  thinking?: {
    isThinking: boolean;
    content?: string;
  };
  error?: {
    type: string;
    detail: string;
  };
  // Add index signature to make it compatible with Record<string, never>
  [key: string]: unknown; // Using unknown instead of any
}

// Create a type that extends MessageRead with streaming-specific extra data
export interface StreamingMessageRead extends Omit<MessageRead, 'extra_data'> {
  extra_data: StreamingExtraData;
}

export interface MessageContentProps {
  message: StreamingMessageRead;
  isStreaming?: boolean;
  role: MessageRole;
  isEditing?: boolean;
  onEditClick?: (messageId: string) => void;
}

export interface ChatMessageProps {
  messages: StreamingMessageRead[];
  role: MessageRole;
  isStreaming?: boolean;
  onEditClick?: (messageId: string) => void;
  editingMessageId?: string | null;
}

interface AccumulatedContent {
  text: string;
  currentBlock: StreamBlock;
}
