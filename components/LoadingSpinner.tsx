export default function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-[40vh]">
      <div className="terminal-card max-w-md">
        <div className="flex flex-col items-center gap-6 py-8">
          <div className="relative w-20 h-20">
            <div className="absolute inset-0 border-4 border-terminal-border rounded-full" />
            <div className="absolute inset-0 border-4 border-terminal-text rounded-full border-t-transparent animate-spin" />
          </div>
          <div className="text-center">
            <div className="text-terminal-textBright font-mono text-lg mb-2 animate-pulse">
              LOADING DATA
            </div>
            <div className="text-terminal-textDim text-xs">
              Fetching token information...
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
