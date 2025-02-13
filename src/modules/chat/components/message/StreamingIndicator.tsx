interface StreamingIndicatorProps {
  type: 'thinking' | 'done';
  className?: string;
}

export default function StreamingIndicator({ type, className }: StreamingIndicatorProps) {
  if (type === 'thinking') {
    const text = 'Thinking...';
    return (
      <div className={`flex items-center gap-2 text-muted-foreground ${className ?? ''}`}>
        <div className="flex items-center rounded-md px-3 py-2">
          <span className="flex text-sm" aria-label="Assistant is thinking">
            {text.split('').map((char, i) => (
              <span key={i} className="animated-letter" style={{ animationDelay: `${i * 0.1}s` }}>
                {char === ' ' ? '\u00A0' : char}
              </span>
            ))}
          </span>
        </div>
      </div>
    );
  }
  return null;
}
