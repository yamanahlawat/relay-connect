import { components } from '@/lib/api/schema';
import { MessageRead } from './message';

type CompletionRequest = components['schemas']['CompletionRequest'];
type CompletionResponse = components['schemas']['CompletionResponse'];

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
  onSend?: (message: string, attachmentIds: string[], settings: ChatSettings) => void;
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
  fileUpload: ReturnType<typeof useFileUpload>;
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

export interface StreamParams {
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
}
