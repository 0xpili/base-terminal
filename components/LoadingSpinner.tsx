export default function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 border-4 border-terminal-border rounded-full" />
          <div className="absolute inset-0 border-4 border-terminal-text rounded-full border-t-transparent animate-spin" />
        </div>
        <div className="text-terminal-text font-mono animate-pulse">
          [LOADING DATA...]
        </div>
      </div>
    </div>
  );
}
