'use client';

import { formatCurrency, formatNumber, formatAddress, getBaseScanUrl } from '@/lib/utils';
import { convertToCSV, downloadCSV } from '@/lib/csv-utils';
import type { UniswapV3Pool } from '@/types/cambrian';

interface OtherDEXPoolsCardProps {
  uniswapPools?: UniswapV3Pool[];
  pancakePools?: UniswapV3Pool[];
  sushiPools?: UniswapV3Pool[];
  alienPools?: UniswapV3Pool[];
  loading?: boolean;
}

export default function OtherDEXPoolsCard({
  uniswapPools = [],
  pancakePools = [],
  sushiPools = [],
  alienPools = [],
  loading = false
}: OtherDEXPoolsCardProps) {
  if (loading) {
    return (
      <div className="terminal-card">
        <div className="flex items-center mb-4">
          <span className="text-terminal-textBright mr-2">{'>'}</span>
          <h3 className="terminal-heading m-0">🔄 OTHER_DEXES</h3>
        </div>
        <div className="flex items-center gap-3 text-terminal-text">
          <div className="animate-spin h-5 w-5 border-2 border-terminal-text border-t-transparent rounded-full"></div>
          <p className="text-terminal-textDim">Loading pool data from multiple DEXes...</p>
        </div>
      </div>
    );
  }

  const allPools = [
    ...uniswapPools.map(p => ({ ...p, dex: 'Uniswap V3' })),
    ...pancakePools.map(p => ({ ...p, dex: 'PancakeSwap V3' })),
    ...sushiPools.map(p => ({ ...p, dex: 'Sushi V3' })),
    ...alienPools.map(p => ({ ...p, dex: 'Alien V3' })),
  ];

  // Log what we received
  console.log('[OtherDEXPools] Received pools:', {
    uniswap: uniswapPools.length,
    pancake: pancakePools.length,
    sushi: sushiPools.length,
    alien: alienPools.length,
    total: allPools.length
  });

  // Show ALL pools - if enrichment returned them, they're valid
  // Only filter out truly empty pools (no data at all)
  const filteredPools = allPools.filter(pool => {
    // Keep pool if it has ANY of these
    const hasTVL = pool.tvl_usd && pool.tvl_usd > 0;
    const hasFeeAPR = pool.fee_apr && pool.fee_apr > 0;
    const hasVolume = pool.volume_24h && pool.volume_24h > 0;
    const hasFeeTier = pool.fee_tier && pool.fee_tier > 0;

    const keepPool = hasTVL || hasFeeAPR || hasVolume || hasFeeTier;

    if (!keepPool) {
      console.log('[OtherDEXPools] Filtering out pool:', {
        pair: `${pool.token0_symbol}/${pool.token1_symbol}`,
        dex: pool.dex,
        tvl: pool.tvl_usd,
        apr: pool.fee_apr,
        volume: pool.volume_24h,
        feeTier: pool.fee_tier
      });
    }

    return keepPool;
  });

  console.log('[OtherDEXPools] After filtering:', {
    total: filteredPools.length,
    withTVL: filteredPools.filter(p => p.tvl_usd > 0).length,
    withAPR: filteredPools.filter(p => p.fee_apr && p.fee_apr > 0).length,
    withVolume: filteredPools.filter(p => p.volume_24h > 0).length,
    withFeeTier: filteredPools.filter(p => p.fee_tier > 0).length
  });

  // Sort pools by TVL (highest first)
  const sortedPools = [...filteredPools].sort((a, b) => {
    const tvlA = a.tvl_usd || 0;
    const tvlB = b.tvl_usd || 0;
    return tvlB - tvlA; // Descending order
  });

  console.log('[OtherDEXPools] Top 3 pools by TVL:', sortedPools.slice(0, 3).map(p => ({
    pair: `${p.token0_symbol}/${p.token1_symbol}`,
    dex: p.dex,
    tvl: p.tvl_usd
  })));

  const handleDownloadCSV = () => {
    if (allPools.length === 0) return;

    const csvData = convertToCSV(
      allPools.map(pool => ({
        DEX: pool.dex,
        Pool: `${pool.token0_symbol}/${pool.token1_symbol}`,
        'Pool Address': pool.pool_address,
        'Token0 Symbol': pool.token0_symbol,
        'Token0 Address': pool.token0_address,
        'Token1 Symbol': pool.token1_symbol,
        'Token1 Address': pool.token1_address,
        'TVL (USD)': pool.tvl_usd || 0,
        '7d Volume (USD)': pool.volume_7d || 0,
        'Fee APR (%)': pool.fee_apr ? pool.fee_apr.toFixed(2) : 'N/A',
        'Fee Tier (bps)': pool.fee_tier || 0,
        'Fee Tier (%)': pool.fee_tier ? (pool.fee_tier / 10000).toFixed(4) : 'N/A',
      }))
    );

    const timestamp = new Date().toISOString().split('T')[0];
    downloadCSV(csvData, `other-dex-pools-${timestamp}`);
  };

  if (sortedPools.length === 0) {
    return (
      <div className="terminal-card">
        <div className="flex items-center mb-4">
          <span className="text-terminal-textBright mr-2">{'>'}</span>
          <h3 className="terminal-heading m-0">🔄 OTHER_DEXES</h3>
        </div>
        <p className="text-terminal-textDim">No additional DEX pool data available (received {allPools.length} pools but none with meaningful data)</p>
      </div>
    );
  }

  return (
    <div className="terminal-card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <span className="text-terminal-textBright mr-2">{'>'}</span>
          <h3 className="terminal-heading m-0">🔄 OTHER_DEXES.CFG</h3>
        </div>
        <button
          onClick={handleDownloadCSV}
          className="text-terminal-text hover:text-terminal-textBright transition-colors text-sm px-2 py-1 border border-terminal-border hover:border-terminal-text rounded"
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
              <th className="text-left py-2 px-2 text-terminal-textDim font-mono">[DEX]</th>
              <th className="text-right py-2 px-2 text-terminal-textDim font-mono">[TVL]</th>
              <th className="text-right py-2 px-2 text-terminal-textDim font-mono">[FEE APR]</th>
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
                  <span className="px-2 py-1 rounded text-xs font-mono bg-terminal-info/20 text-terminal-info">
                    {pool.dex}
                  </span>
                </td>
                <td className="py-3 px-2 text-right text-terminal-text font-mono">
                  {formatCurrency(pool.tvl_usd || 0)}
                </td>
                <td className="py-3 px-2 text-right text-terminal-textBright font-mono">
                  {pool.fee_apr && pool.fee_apr > 0 ? `${pool.fee_apr.toFixed(2)}%` : pool.fee_tier ? `${(pool.fee_tier / 10000).toFixed(2)}%` : 'N/A'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="text-terminal-textDim text-xs pt-4 mt-4 border-t border-terminal-border">
        {'>'} Showing {sortedPools.length} pool{sortedPools.length !== 1 ? 's' : ''} across multiple DEXes (sorted by TVL)
      </div>
    </div>
  );
}
