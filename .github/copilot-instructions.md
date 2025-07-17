# Relay Connect - AI Assistant Instructions

## Architecture Overview

**Relay Connect** is a Next.js 15 AI chat interface that streams responses from LLM providers with real-time tool execution and Model Context Protocol (MCP) integration. Key architectural patterns:

- **Streaming-First**: Real-time message streaming with progressive tool argument accumulation via `parseStream()` and `ProgressiveToolArgsManager`
- **Modular Design**: Feature modules in `src/modules/` (chat, settings) with co-located components, hooks, and utilities
- **Type-Safe Streaming**: OpenAPI-generated schemas (`src/lib/api/schema.d.ts`) with custom streaming types in `src/types/stream.d.ts`
- **Zustand State**: Persistent client state for provider/model selection, chat settings, and UI state
- **React Query**: Server state management with optimistic updates and real-time invalidation

## Critical Development Patterns

### 1. Streaming Message Architecture

Messages use a dual-state pattern: regular `MessageRead` from API + enhanced `StreamingMessageRead` with real-time data:

```typescript
// Always extend StreamingMessageRead for UI components
interface StreamingMessageRead extends Omit<MessageRead, 'extra_data'> {
  extra_data: {
    stream_blocks?: StreamBlock[];
    thinking?: { isThinking: boolean; content?: string };
    progressive_tool_args?: Map<string, ProgressiveToolArgs>;
  };
}
```

- Use `StreamBlockRenderer` for all message display - it handles both streaming and completed states
- Tool execution is tracked via contextual grouping in `groupBlocksContextually()`
- Progressive args accumulate in real-time during `tool_call` streaming

### 2. Component Organization

Follow the established modular pattern:

```
src/modules/[feature]/
├── components/         # Feature-specific UI
├── hooks/             # Feature-specific logic
├── utils/             # Feature utilities
└── layout/            # Feature layouts
```

- Place shared UI in `src/components/ui/` (shadcn/ui components)
- Custom components go in `src/components/custom/`
- Use `memo()` for streaming components to prevent unnecessary re-renders

### 3. API Integration Patterns

Use the established client pattern with openapi-fetch:

```typescript
// Always use the centralized client
import client from '@/lib/api/client';

// Streaming endpoints return ReadableStreamDefaultReader<Uint8Array>
const reader = await streamCompletion(sessionId, messageId, params);
```

- API endpoints follow `/api/v1/[resource]/` pattern
- Streaming uses `/stream` suffix with SSE format
- Always handle errors via the standardized `ErrorResponseModel`

### 4. State Management Patterns

- **Zustand stores** in `src/stores/` for client state (UI preferences, selections)
- **React Query** for server state with keys in `src/lib/queries/[resource].ts`
- **Session storage** via Zustand persistence for provider/model selection
- Use `useChat()` hook for all chat-related state and streaming logic

### 5. Type Organization and Management

- **Centralized Types**: All API types are defined in `src/types/[resource].d.ts` and exported
- **Schema Consistency**: Types in `src/types/` should import from `src/lib/api/schema.d.ts` and re-export
- **Direct Type Usage**: Components should import types directly from `src/types/` folder, not from schema

````typescript
// ✅ Good - Direct type usage
import type { ProviderRead, ProviderCreate } from '@/types/provider';
const provider: ProviderRead = data;

### 6. React Query Centralization

- **Centralized Mutations**: All mutations go in `src/lib/queries/[resource].ts`, not in components
- **Consistent Error Handling**: All mutations include toast notifications and proper error states
- **Reusable Success Callbacks**: Mutations accept optional `onSuccess` callbacks for component-specific logic
- **Query Key Patterns**: Use consistent query key patterns with `[resource]Keys` objects

```typescript
// ✅ Good - Centralized mutation
export function useProviderCreateMutation(onSuccess?: () => void) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ProviderCreate) => createProvider(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['providers'] });
      toast.success('Provider created successfully');
      onSuccess?.();
    },
    onError: () => toast.error('Failed to create provider'),
  });
}
````

## Development Workflows

### Running the Application

```bash
# Development with Turbopack (fastest)
pnpm dev

# Type checking (required before commits)
pnpm type-check

# Linting with auto-fix
pnpm lint
```

### Adding New Streaming Features

1. Extend `StreamBlock` types in `src/types/stream.d.ts`
2. Update `parseStream()` in `src/modules/chat/utils/stream.ts`
3. Modify message components in `src/modules/chat/components/message/`
4. Test with both streaming and completed states

### MCP Server Integration

MCP servers are configured via the settings UI and stored server-side:

- List/create/update via `src/lib/api/mcp.ts`
- UI components in `src/modules/settings/mcp/`
- Tools appear automatically in chat when servers are enabled

### Provider/Model Management

- Providers: OpenAI, Anthropic, Gemini, Groq, Mistral, Cohere, Bedrock
- Models have `default_temperature`, `default_max_tokens`, `default_top_p` settings
- Selection persists via `useProviderModel` Zustand store

## Key Integration Points

### File Upload System

Uses custom upload hook with drag-and-drop:

```typescript
// Always use the centralized file upload hook
const fileUpload = useFileUpload();
// Handles validation, progress, and attachment creation
```

### Theme System

- Uses `next-themes` with system preference detection
- Theme toggle in `src/components/ThemeToggle.tsx`
- CSS variables in `src/styles/globals.css`

### Real-time Updates

- Streaming via Server-Sent Events (SSE)
- React Query invalidation on completion
- Progressive UI updates during tool execution

## Common Gotchas

1. **Streaming State**: Always check both `is_streaming` prop AND presence of `done` block type
2. **Tool Arguments**: Use `progressive_tool_args` during streaming, `tool_args` when complete
3. **Message Updates**: Batch updates in `useChat()` to prevent excessive re-renders
4. **Type Safety**: OpenAPI schema is auto-generated - update schema first, then types
5. **Error Handling**: Streaming errors come as `error` block types, not thrown exceptions
6. **Type Imports**: Always import types from `src/types/` folder, never directly from schema
7. **Query Duplication**: Never create mutations in components - always use centralized query hooks
8. **Unnecessary Aliases**: Avoid `type A = B` aliases - use the actual type names directly

## Core Development Principles

**Simplicity & Code Quality**:

- **No duplicate code / dead code** - Eliminate redundancy and unused code immediately
- **Single responsibility principle** - Each function/component should have one clear purpose
- **No premature optimization** - Code readability matters more than micro-optimizations
- **Embrace simplicity** - Simple solutions are preferred over complex ones

**Code Philosophy**:

- Writing less code is better than writing more code
- Writing simple code is better than writing complex code
- Writing no code is better than writing any code
- Every line of code written today becomes technical debt tomorrow
- **Follow KISS principle** - Keep It Simple, Stupid

**Type System Best Practices**:

- Use actual type names instead of unnecessary aliases
- Import types from `src/types/` folder for consistency
- Export all types from centralized type definition files
- Avoid mixing schema imports with type definitions in components

**React Query Patterns**:

- Centralize all mutations in `src/lib/queries/[resource].ts`
- Include consistent error handling with toast notifications
- Use optional success callbacks for component-specific logic
- Never duplicate mutation logic across components

## Testing Patterns

- Test streaming components with both partial and complete data
- Mock the `parseStream` function for predictable test data
- Use React Query's testing utilities for server state
- Test file upload with various file types and sizes

When implementing new features, follow the established patterns for consistency and maintainability. The codebase prioritizes type safety, real-time UX, modular architecture, and above all - simplicity.
