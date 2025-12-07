interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

export default function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  return (
    <div className="terminal-card border-terminal-error">
      <div className="flex items-start gap-4">
        <div className="text-terminal-error text-2xl">⚠</div>
        <div className="flex-1">
          <h3 className="text-terminal-error font-bold mb-2">[ERROR]</h3>
          <p className="text-terminal-text mb-4">{message}</p>
          {onRetry && (
            <button onClick={onRetry} className="terminal-button text-sm">
              [RETRY]
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
