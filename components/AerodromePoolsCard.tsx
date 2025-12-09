'use client';

import { formatCurrency, formatAddress, getBaseScanUrl } from '@/lib/utils';
import { convertToCSV, downloadCSV } from '@/lib/csv-utils';
import type { AerodromePool } from '@/types/cambrian';

interface AerodromePoolsCardProps {
  pools?: AerodromePool[];
  loading?: boolean;
}

export default function AerodromePoolsCard({ pools, loading = false }: AerodromePoolsCardProps) {
  const handleDownloadCSV = () => {
    if (!pools || pools.length === 0) return;

    // Only export pools with meaningful data
    const poolsToExport = pools.filter(pool => {
      const hasTVL = pool.tvl_usd && pool.tvl_usd > 0;
      const hasVolume = pool.volume_24h && pool.volume_24h > 0;
      return hasTVL || hasVolume;
    });

    if (poolsToExport.length === 0) return;

    const csvData = convertToCSV(
      poolsToExport.map(pool => ({
        Pool: `${pool.token0_symbol}/${pool.token1_symbol}`,
        'Pool Address': pool.pool_address,
        'Token0 Symbol': pool.token0_symbol,
        'Token0 Address': pool.token0_address,
        'Token1 Symbol': pool.token1_symbol,
        'Token1 Address': pool.token1_address,
        Type: pool.pool_type,
        'TVL (USD)': pool.tvl_usd || 0,
        '24h Volume (USD)': pool.volume_24h || 0,
        '7d Volume (USD)': pool.volume_7d || 0,
        'Fee APR (%)': pool.fee_apr || 0,
        '24h Swaps': pool.swap_count_24h || 0,
        '24h Unique Swappers': pool.unique_swappers_24h || 0,
        '24h Fees (USD)': pool.fees_24h || 0,
      }))
    );

    const timestamp = new Date().toISOString().split('T')[0];
    downloadCSV(csvData, `aerodrome-pools-${timestamp}`);
  };

  if (loading) {
    return (
      <div className="terminal-card">
        <div className="flex items-center mb-4">
          <span className="text-terminal-textBright mr-2">{'>'}</span>
          <h3 className="terminal-heading m-0">💧 AERODROME_POOLS</h3>
        </div>
        <div className="flex items-center gap-3 text-terminal-text">
          <div className="animate-spin h-5 w-5 border-2 border-terminal-text border-t-transparent rounded-full"></div>
          <p className="text-terminal-textDim">Loading Aerodrome pool data...</p>
        </div>
      </div>
    );
  }

  // Filter out pools with no meaningful data (both TVL and volume are 0)
  const filteredPools = pools?.filter(pool => {
    const hasTVL = pool.tvl_usd && pool.tvl_usd > 0;
    const hasVolume = pool.volume_24h && pool.volume_24h > 0;
    return hasTVL || hasVolume;
  }) || [];

  if (filteredPools.length === 0) {
    return (
      <div className="terminal-card">
        <div className="flex items-center mb-4">
          <span className="text-terminal-textBright mr-2">{'>'}</span>
          <h3 className="terminal-heading m-0">💧 AERODROME_POOLS</h3>
        </div>
        <p className="text-terminal-textDim">No Aerodrome pool data available</p>
      </div>
    );
  }

  return (
    <div className="terminal-card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <span className="text-terminal-textBright mr-2">{'>'}</span>
          <h3 className="terminal-heading m-0">💧 AERODROME_POOLS</h3>
          <span className="ml-2 text-terminal-textDim text-sm">(Base&apos;s Leading DEX)</span>
        </div>
        <button
          onClick={handleDownloadCSV}
          className="text-terminal-text hover:text-terminal-textBright transition-colors text-sm px-3 py-1 border border-terminal-border hover:border-terminal-text rounded min-w-[80px]"
          title="Download CSV"
        >
          💾 CSV
        </button>
      </div>

      {/* Pools Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-terminal-border">
              <th className="text-left py-2 px-2 text-terminal-textDim font-mono">[POOL]</th>
              <th className="text-left py-2 px-2 text-terminal-textDim font-mono">[TYPE]</th>
              <th className="text-right py-2 px-2 text-terminal-textDim font-mono">[TVL]</th>
              <th className="text-right py-2 px-2 text-terminal-textDim font-mono">[24H_VOL]</th>
              <th className="text-right py-2 px-2 text-terminal-textDim font-mono">[APR]</th>
            </tr>
          </thead>
          <tbody>
            {filteredPools.map((pool, index) => (
              <tr
                key={`${pool.pool_address || 'pool'}-${index}`}
                className="border-b border-terminal-border hover:bg-terminal-bg transition-colors"
              >
                <td className="py-3 px-2">
                  <div className="text-terminal-text font-mono">
                    {pool.token0_symbol}/{pool.token1_symbol}
                  </div>
                  <a
                    href={getBaseScanUrl(pool.pool_address)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-terminal-textDim hover:text-terminal-text text-xs mt-1 underline inline-block"
                    title="View pool on BaseScan"
                  >
                    {formatAddress(pool.pool_address)}
                  </a>
                </td>
                <td className="py-3 px-2">
                  <span
                    className={`px-2 py-1 rounded text-xs font-mono ${
                      pool.pool_type === 'stable'
                        ? 'bg-terminal-success/20 text-terminal-success'
                        : 'bg-terminal-info/20 text-terminal-info'
                    }`}
                  >
                    {pool.pool_type?.toUpperCase() || 'N/A'}
                  </span>
                </td>
                <td className="py-3 px-2 text-right text-terminal-text font-mono">
                  {formatCurrency(pool.tvl_usd || 0)}
                </td>
                <td className="py-3 px-2 text-right text-terminal-text font-mono">
                  {formatCurrency(pool.volume_24h || 0)}
                </td>
                <td className="py-3 px-2 text-right text-terminal-textBright font-mono font-bold">
                  {pool.fee_apr ? `${pool.fee_apr.toFixed(2)}%` : 'N/A'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="text-terminal-textDim text-xs pt-4 mt-4 border-t border-terminal-border">
        {'>'} Showing {filteredPools.length} Aerodrome pool{filteredPools.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
}
