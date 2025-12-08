interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

export default function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  return (
    <div className="flex items-center justify-center min-h-[40vh]">
      <div className="terminal-card border-terminal-error max-w-2xl">
        <div className="text-center py-8">
          <div className="text-6xl mb-4">⚠️</div>
          <h3 className="text-terminal-error font-bold text-xl mb-4">ERROR</h3>
          <p className="text-terminal-text mb-6 px-4">{message}</p>
          {onRetry && (
            <button onClick={onRetry} className="terminal-button">
              [RETRY]
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
