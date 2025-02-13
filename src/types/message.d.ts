import type { components } from '@/lib/api/schema';

type MessageRead = components['schemas']['MessageRead'];
type MessageUpdate = components['schemas']['MessageUpdate'];
type MessageRole = components['schemas']['MessageRole'];
type MessageCreate = components['schemas']['MessageCreate'];

export interface MessageContentProps {
  message: MessageRead;
  isStreaming?: boolean;
  role: MessageRole;
  isEditing?: boolean;
  onEditClick?: (messageId: string) => void;
}

interface ChatMessageProps {
  messages: MessageRead[];
  role: MessageRole;
  isStreaming?: boolean;
  onEditClick?: (messageId: string) => void;
  editingMessageId?: string | null;
}

interface AccumulatedContent {
  text: string;
  currentBlock: StreamBlock;
}
