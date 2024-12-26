import type { components } from '@/lib/api/schema';

type MessageRead = components['schemas']['MessageRead'];
type MessageRole = components['schemas']['MessageRole'];

export interface ChatState {
  sessionId: string;
  messages: MessageRead[];
  streamingMessageId: string | null;
}

export interface ChatSettings {
  systemPrompt: string;
  maxTokens: number;
  temperature: number;
  topP: number;
}

export interface AdvancedSettingsProps {
  settings: ChatSettings;
  onSettingsChange: (settings: ChatSettings) => void;
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
}

export interface ChatMessageProps {
  messages: MessageRead[];
  role: MessageRole;
  isStreaming?: boolean;
}

export interface CodeBlockProps {
  inline?: boolean;
  className?: string;
  children: React.ReactNode;
}

export interface MarkdownRendererProps {
  content: string;
}

export interface MessageContentProps {
  message: {
    content: string;
    created_at: string;
    status?: string;
    error_message?: string;
    usage?: {
      input_tokens: number;
      output_tokens: number;
      total_cost: number;
    };
  };
}

export interface StreamParams {
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
}
