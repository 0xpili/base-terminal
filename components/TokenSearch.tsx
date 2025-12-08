'use client';

import { useState } from 'react';

interface TokenSearchProps {
  onSearch: (query: string) => void;
  isLoading?: boolean;
  minimal?: boolean;
}

export default function TokenSearch({ onSearch, isLoading = false, minimal = false }: TokenSearchProps) {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  if (minimal) {
    return (
      <div className="terminal-card">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-terminal-textDim text-sm text-center mb-3">
              [ENTER TOKEN SYMBOL OR CONTRACT ADDRESS]
            </label>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="USDC, WETH, or 0x..."
              className="terminal-input w-full text-center"
              disabled={isLoading}
              autoComplete="off"
              data-1p-ignore
              data-lpignore="true"
              data-form-type="other"
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !query.trim()}
            className="terminal-button w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <span className="animate-pulse">SCANNING...</span>
              </span>
            ) : (
              '[EXECUTE]'
            )}
          </button>

          <div className="text-center text-terminal-textDim text-xs pt-2 border-t border-terminal-border">
            <p>Examples: USDC, WETH, 0x...</p>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="terminal-card mb-8">
      <div className="flex items-center mb-4">
        <span className="text-terminal-textBright mr-2">{'>'}</span>
        <h2 className="terminal-heading m-0">TOKEN_SCANNER</h2>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <label className="block text-terminal-textDim text-sm mb-2">
            [ENTER TOKEN SYMBOL OR CONTRACT ADDRESS]
          </label>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="USDC, WETH, or 0x..."
            className="terminal-input w-full"
            disabled={isLoading}
            autoComplete="off"
            data-1p-ignore
            data-lpignore="true"
            data-form-type="other"
          />
        </div>

        <div className="flex items-end">
          <button
            type="submit"
            disabled={isLoading || !query.trim()}
            className="terminal-button w-full md:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <span className="animate-pulse">SCANNING...</span>
              </span>
            ) : (
              '[EXECUTE]'
            )}
          </button>
        </div>
      </form>

      <div className="mt-4 text-terminal-textDim text-xs">
        <p>
          {'>'} Examples: &quot;USDC&quot;, &quot;WETH&quot;, or paste contract address (0x...)
        </p>
      </div>
    </div>
  );
}
