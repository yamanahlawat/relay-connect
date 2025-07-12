interface StreamingIndicatorProps {
  type: 'thinking' | 'done';
  text?: string;
  className?: string;
}

export default function StreamingIndicator({ type, text, className }: StreamingIndicatorProps) {
  if (type === 'thinking') {
    const displayText = text || 'Thinking...';

    return (
      <div className={`text-muted-foreground flex items-center gap-2 ${className ?? ''}`}>
        <div className="flex items-center rounded-md px-3 py-2">
          <span className="flex text-sm" aria-label={displayText}>
            {displayText.split('').map((char, i) => (
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
