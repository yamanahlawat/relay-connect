'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

interface CodeCascadeContextType {
  activeCode: string | null;
  language: string | null;
  isStreaming: boolean;
  showCodeView: boolean;
  setActiveCode: (code: string, lang?: string) => void;
  appendStreamingCode: (chunk: string) => void;
  clearCode: () => void;
  setIsStreaming: (streaming: boolean) => void;
}

const CodeCascadeContext = createContext<CodeCascadeContextType | null>(null);

export function CodeCascadeProvider({ children }: { children: React.ReactNode }) {
  const [activeCode, setActiveCodeState] = useState<string | null>(null);
  const [language, setLanguage] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [showCodeView, setShowCodeView] = useState(false);
  const [streamBuffer, setStreamBuffer] = useState('');

  // Handle stream buffering
  useEffect(() => {
    if (!isStreaming && streamBuffer) {
      setActiveCodeState((prev) => (prev || '') + streamBuffer);
      setStreamBuffer('');
    }
  }, [isStreaming, streamBuffer]);

  const setActiveCode = useCallback((code: string, lang?: string) => {
    setActiveCodeState(code);
    if (lang) setLanguage(lang);
    setShowCodeView(true);
    setStreamBuffer('');
  }, []);

  const appendStreamingCode = useCallback(
    (chunk: string) => {
      if (isStreaming) {
        setStreamBuffer((prev) => prev + chunk);
      } else {
        setActiveCodeState((prev) => (prev || '') + chunk);
      }
      setShowCodeView(true);
    },
    [isStreaming]
  );

  const clearCode = useCallback(() => {
    setActiveCodeState(null);
    setLanguage(null);
    setIsStreaming(false);
    setStreamBuffer('');
  }, []);

  const value = {
    activeCode,
    language,
    isStreaming,
    showCodeView,
    setActiveCode,
    appendStreamingCode,
    clearCode,
    setIsStreaming,
  };

  return <CodeCascadeContext.Provider value={value}>{children}</CodeCascadeContext.Provider>;
}

export function useCodeCascade() {
  const context = useContext(CodeCascadeContext);
  if (!context) {
    throw new Error('useCodeCascade must be used within a CodeCascadeProvider');
  }
  return context;
}
