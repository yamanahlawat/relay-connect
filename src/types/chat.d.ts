import type { components } from '@/lib/api/schema';

type MessageRead = components['schemas']['MessageRead'];
type MessageRole = components['schemas']['MessageRole'];

export interface ChatState {
  sessionId: string;
  messages: MessageRead[];
  streamingMessageId: string | null;
}

export interface ChatSettings {
  maxTokens: number;
  temperature: number;
  topP: number;
}

interface AdvancedSettingsProps {
  settings: ChatSettings;
  onSettingsChange: (settings: ChatSettings) => void;
  systemContext?: string;
  onSystemContextChange?: (prompt: string) => void;
  disabled?: boolean;
}

export interface ChatInputProps {
  value?: string;
  onChange?: (value: string) => void;
  onSend?: (message: string, settings: ChatSettings) => void;
  disabled?: boolean;
  placeholder?: string;
  settings?: ChatSettings;
  onSettingsChange?: (settings: ChatSettings) => void;
  systemContext?: string;
  onSystemContextChange?: (prompt: string) => void;
  isEditing?: boolean;
  editMessage?: string;
  onCancelEdit?: () => void;
  isStreaming?: boolean;
  onStop?: () => void;
}

interface ChatMessageProps {
  messages: MessageRead[];
  role: MessageRole;
  isStreaming?: boolean;
  onEditClick?: (messageId: string) => void;
  editingMessageId?: string | null;
}

interface CodeBlockProps {
  inline: boolean;
  className?: string;
  children: React.ReactNode;
  isStreaming?: boolean;
}

export interface MarkdownRendererProps {
  content: string;
  isStreaming?: boolean;
}

export interface MessageContentProps {
  message: MessageRead;
  isStreaming?: boolean;
  role: MessageRole;
  isEditing?: boolean;
  onEditClick?: (messageId: string) => void;
}

export interface StreamParams {
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
}
