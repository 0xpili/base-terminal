'use client';

import { formatCurrency, formatAddress, getBaseScanUrl } from '@/lib/utils';
import { convertToCSV, downloadCSV } from '@/lib/csv-utils';
import type { UniswapV3Pool } from '@/types/cambrian';

interface UniswapV3PoolsCardProps {
  pools?: UniswapV3Pool[];
  loading?: boolean;
}

export default function UniswapV3PoolsCard({
  pools = [],
  loading = false
}: UniswapV3PoolsCardProps) {
  if (loading) {
    return (
      <div className="terminal-card">
        <div className="flex items-center mb-4">
          <span className="text-terminal-textBright mr-2">{'>'}</span>
          <h3 className="terminal-heading m-0">UNISWAP_V3_POOLS</h3>
        </div>
        <div className="flex items-center gap-3 text-terminal-text">
          <div className="animate-spin h-5 w-5 border-2 border-terminal-text border-t-transparent rounded-full"></div>
          <p className="text-terminal-textDim">Loading Uniswap V3 pool data...</p>
        </div>
      </div>
    );
  }

  // Filter pools with meaningful data
  const filteredPools = pools.filter(pool => {
    const hasTVL = pool.tvl_usd && pool.tvl_usd > 0;
    const hasFeeAPR = pool.fee_apr && pool.fee_apr > 0;
    const hasVolume = pool.volume_24h && pool.volume_24h > 0;
    const hasFeeTier = pool.fee_tier && pool.fee_tier > 0;
    return hasTVL || hasFeeAPR || hasVolume || hasFeeTier;
  });

  // Sort pools by TVL (highest first)
  const sortedPools = [...filteredPools].sort((a, b) => {
    const tvlA = a.tvl_usd || 0;
    const tvlB = b.tvl_usd || 0;
    return tvlB - tvlA;
  });

  const handleDownloadCSV = () => {
    if (pools.length === 0) return;

    const csvData = convertToCSV(
      pools.map(pool => ({
        Pool: `${pool.token0_symbol}/${pool.token1_symbol}`,
        'Pool Address': pool.pool_address,
        'Token0 Symbol': pool.token0_symbol,
        'Token0 Address': pool.token0_address,
        'Token1 Symbol': pool.token1_symbol,
        'Token1 Address': pool.token1_address,
        'TVL (USD)': pool.tvl_usd || 0,
        '24h Volume (USD)': pool.volume_24h || 0,
        '7d Volume (USD)': pool.volume_7d || 0,
        'Fee APR (%)': pool.fee_apr ? pool.fee_apr.toFixed(2) : 'N/A',
        'Fee Tier (bps)': pool.fee_tier || 0,
      }))
    );

    const timestamp = new Date().toISOString().split('T')[0];
    downloadCSV(csvData, `uniswap-v3-pools-${timestamp}`);
  };

  if (sortedPools.length === 0) {
    return (
      <div className="terminal-card">
        <div className="flex items-center mb-4">
          <span className="text-terminal-textBright mr-2">{'>'}</span>
          <h3 className="terminal-heading m-0">UNISWAP_V3_POOLS</h3>
        </div>
        <p className="text-terminal-textDim">No Uniswap V3 pool data available</p>
      </div>
    );
  }

  return (
    <div className="terminal-card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <span className="text-terminal-textBright mr-2">{'>'}</span>
          <h3 className="terminal-heading m-0">UNISWAP_V3_POOLS</h3>
        </div>
        <button
          onClick={handleDownloadCSV}
          className="text-terminal-text hover:text-terminal-textBright transition-colors text-sm px-3 py-1 border border-terminal-border hover:border-terminal-text rounded min-w-[80px]"
          title="Download CSV"
        >
          CSV
        </button>
      </div>

      {/* Pools Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-terminal-border">
              <th className="text-left py-2 px-2 text-terminal-textDim font-mono">[POOL]</th>
              <th className="text-right py-2 px-2 text-terminal-textDim font-mono">[TVL]</th>
              <th className="text-right py-2 px-2 text-terminal-textDim font-mono">[FEE]</th>
            </tr>
          </thead>
          <tbody>
            {sortedPools.map((pool, index) => (
              <tr
                key={`${pool.pool_address || 'pool'}-${index}`}
                className="border-b border-terminal-border hover:bg-terminal-bg transition-colors"
              >
                <td className="py-3 px-2">
                  <div className="text-terminal-text font-mono">
                    {pool.token0_symbol || formatAddress(pool.token0_address)}/{pool.token1_symbol || formatAddress(pool.token1_address)}
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
                <td className="py-3 px-2 text-right text-terminal-text font-mono">
                  {formatCurrency(pool.tvl_usd || 0)}
                </td>
                <td className="py-3 px-2 text-right text-terminal-textBright font-mono">
                  {pool.fee_tier ? `${(pool.fee_tier / 10000).toFixed(2)}%` : 'N/A'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="text-terminal-textDim text-xs pt-4 mt-4 border-t border-terminal-border">
        {'>'} Showing {sortedPools.length} pool{sortedPools.length !== 1 ? 's' : ''} (sorted by TVL)
      </div>
    </div>
  );
}
