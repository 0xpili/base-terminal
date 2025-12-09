'use client';

import { useState } from 'react';
import { formatAddress, formatCurrency, formatNumber, copyToClipboard, getBaseScanUrl } from '@/lib/utils';
import { convertToCSV, downloadCSV } from '@/lib/csv-utils';
import type { TopHoldersResponse } from '@/types/cambrian';

interface TopHoldersCardProps {
  holdersData?: TopHoldersResponse;
}

export default function TopHoldersCard({ holdersData }: TopHoldersCardProps) {
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  const handleCopy = async (address: string) => {
    try {
      await copyToClipboard(address);
      setCopiedAddress(address);
      setTimeout(() => setCopiedAddress(null), 2000);
    } catch {
      // Silently fail if clipboard is unavailable
    }
  };

  const handleDownloadCSV = () => {
    if (!holdersData || !holdersData.holders || holdersData.holders.length === 0) return;

    const csvData = convertToCSV(
      holdersData.holders.map((holder, index) => ({
        Rank: index + 1,
        'Holder Address': holder.holder_address,
        Balance: holder.balance,
        'Balance (USD)': holder.balance_usd || 0,
        'Percentage (%)': holder.percentage ? holder.percentage.toFixed(4) : 0,
      }))
    );

    const timestamp = new Date().toISOString().split('T')[0];
    downloadCSV(csvData, `top-holders-${timestamp}`);
  };

  if (!holdersData || !holdersData.holders || holdersData.holders.length === 0) {
    return (
      <div className="terminal-card">
        <div className="flex items-center mb-3">
          <span className="text-terminal-textBright mr-2 text-sm">{'>'}</span>
          <h3 className="text-sm font-bold text-terminal-textBright m-0">TOP_HOLDERS</h3>
        </div>
        <p className="text-terminal-textDim text-sm">No holder data available</p>
      </div>
    );
  }

  return (
    <div className="terminal-card">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <span className="text-terminal-textBright mr-2 text-sm">{'>'}</span>
          <h3 className="text-sm font-bold text-terminal-textBright m-0">TOP_HOLDERS</h3>
        </div>
        <button
          onClick={handleDownloadCSV}
          className="text-terminal-text hover:text-terminal-textBright transition-colors text-sm px-3 py-1 border border-terminal-border hover:border-terminal-text rounded min-w-[80px]"
          title="Download CSV"
        >
          💾 CSV
        </button>
      </div>

      {/* Summary Stats */}
      <div className="text-center mb-3 pb-3 border-b border-terminal-border">
        <div className="text-2xl font-bold text-terminal-textBright">
          {holdersData.top_10_concentration?.toFixed(2) || 'N/A'}%
        </div>
        <div className="text-terminal-textDim text-xs">
          Supply held by top 10 addresses
        </div>
      </div>

      {/* Holders List - Compact */}
      <div className="space-y-1.5">
        {holdersData.holders.slice(0, showAll ? 10 : 5).map((holder, index) => (
          <div
            key={holder.holder_address}
            className="border border-terminal-border rounded p-1.5 hover:border-terminal-text transition-colors"
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-1.5">
                <span className="text-terminal-textBright font-bold text-xs">
                  [{index + 1}]
                </span>
                <a
                  href={getBaseScanUrl(holder.holder_address)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-terminal-text hover:text-terminal-textBright transition-colors font-mono text-xs underline"
                  title="View on BaseScan"
                >
                  {formatAddress(holder.holder_address, 6)}
                </a>
                <button
                  onClick={() => handleCopy(holder.holder_address)}
                  className="text-terminal-textDim hover:text-terminal-text transition-colors text-xs"
                  title="Copy address"
                >
                  {copiedAddress === holder.holder_address ? '✓' : '📋'}
                </button>
              </div>
              <div className="text-terminal-textBright font-bold text-sm">
                {holder.percentage?.toFixed(2) || '0.00'}%
              </div>
            </div>

            <div className="flex justify-between text-xs mt-1">
              <span className="text-terminal-textDim">
                {formatNumber(parseFloat(holder.balance))}
              </span>
              <span className="text-terminal-text">
                {formatCurrency(holder.balance_usd)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Expand/Collapse Button */}
      {holdersData.holders.length > 5 && (
        <div className="text-center mt-2">
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-terminal-text hover:text-terminal-textBright text-xs transition-colors px-3 py-1 border border-terminal-border hover:border-terminal-text rounded"
          >
            {showAll ? '▲ Less' : '▼ More'}
          </button>
        </div>
      )}

      {/* Footer */}
      <div className="text-terminal-textDim text-xs pt-2 mt-2 border-t border-terminal-border">
        {'>'} Top {showAll ? Math.min(holdersData.holders.length, 10) : Math.min(holdersData.holders.length, 5)}
      </div>
    </div>
  );
}
