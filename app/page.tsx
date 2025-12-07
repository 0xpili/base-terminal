'use client';

import { useState } from 'react';
import TokenSearch from '@/components/TokenSearch';
import PriceOverviewCard from '@/components/PriceOverviewCard';
import TopHoldersCard from '@/components/TopHoldersCard';
import AerodromePoolsCard from '@/components/AerodromePoolsCard';
import OtherDEXPoolsCard from '@/components/OtherDEXPoolsCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';
import {
  searchToken,
  getCurrentPrice,
  getPriceHistory,
  getTopHolders,
  getAerodromeV2Pools,
  getUniswapV3Pools,
  getPancakeV3Pools,
  getSushiV3Pools,
  getAlienV3Pools,
  enrichPoolsWithDetails,
  CambrianAPIError,
} from '@/lib/cambrian-api';
import { getBaseScanUrl } from '@/lib/utils';
import type {
  Token,
  PriceCurrentResponse,
  PriceHourResponse,
  TopHoldersResponse,
  AerodromePool,
  UniswapV3Pool,
} from '@/types/cambrian';

interface DashboardData {
  token: Token;
  currentPrice?: PriceCurrentResponse;
  priceHistory?: PriceHourResponse[];
  topHolders?: TopHoldersResponse;
  aerodomePools?: AerodromePool[];
  uniswapPools?: UniswapV3Pool[];
  pancakePools?: UniswapV3Pool[];
  sushiPools?: UniswapV3Pool[];
  alienPools?: UniswapV3Pool[];
}

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [loadingAerodomePools, setLoadingAerodomePools] = useState(false);
  const [loadingOtherPools, setLoadingOtherPools] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);

  const handleSearch = async (query: string) => {
    setLoading(true);
    setError(null);
    setDashboardData(null);

    try {
      // Step 1: Search for token
      const tokenResults = await searchToken(query);

      if (!tokenResults.tokens || tokenResults.tokens.length === 0) {
        setError(
          `No token found matching "${query}". Please check the symbol or contract address.`
        );
        setLoading(false);
        return;
      }

      const token = tokenResults.tokens[0];

      // Step 2: Fetch critical data first (fast endpoints)
      const [currentPrice, priceHistory, topHolders] = await Promise.allSettled([
        getCurrentPrice(token.address),
        getPriceHistory(token.address, 24),
        getTopHolders(token.address, 10),
      ]);

      // Show initial data immediately
      const initialData: DashboardData = {
        token,
        currentPrice:
          currentPrice.status === 'fulfilled' ? currentPrice.value : undefined,
        priceHistory:
          priceHistory.status === 'fulfilled' ? priceHistory.value : undefined,
        topHolders:
          topHolders.status === 'fulfilled' ? topHolders.value : undefined,
      };

      setDashboardData(initialData);
      setLoading(false);

      // Step 3: Load Aerodrome pools first (fast, no enrichment needed)
      setLoadingAerodomePools(true);
      console.log('[UI] Loading Aerodrome pools for token:', token.address);

      getAerodromeV2Pools(token.address, 100)
        .then((result) => {
          console.log('[UI] Aerodrome pools loaded:', result.pools.length);
          setDashboardData((prev) => ({
            ...prev!,
            aerodomePools: result.pools,
          }));
          setLoadingAerodomePools(false);
        })
        .catch((error) => {
          console.error('[UI] Error loading Aerodrome pools:', error);
          setLoadingAerodomePools(false);
        });

      // Step 4: Load Other DEX pools separately (slower, needs enrichment)
      setLoadingOtherPools(true);
      console.log('[UI] Loading Other DEX pools for token:', token.address);

      Promise.allSettled([
        getUniswapV3Pools(token.address, 100),
        getPancakeV3Pools(token.address, 100),
        getSushiV3Pools(token.address, 100),
        getAlienV3Pools(token.address, 100),
      ])
        .then(async ([uniswapPools, pancakePools, sushiPools, alienPools]) => {
          console.log('[UI] Other DEX pool lists loaded:', {
            uniswap: uniswapPools.status === 'fulfilled' ? uniswapPools.value.pools.length : 'failed',
            pancake: pancakePools.status === 'fulfilled' ? pancakePools.value.pools.length : 'failed',
            sushi: sushiPools.status === 'fulfilled' ? sushiPools.value.pools.length : 'failed',
            alien: alienPools.status === 'fulfilled' ? alienPools.value.pools.length : 'failed',
          });

          // Enrich pools with detailed TVL data in parallel
          const [enrichedUniswap, enrichedPancake, enrichedSushi, enrichedAlien] =
            await Promise.allSettled([
              uniswapPools.status === 'fulfilled'
                ? enrichPoolsWithDetails(uniswapPools.value.pools, 'uniswap')
                : Promise.resolve([]),
              pancakePools.status === 'fulfilled'
                ? enrichPoolsWithDetails(pancakePools.value.pools, 'pancake')
                : Promise.resolve([]),
              sushiPools.status === 'fulfilled'
                ? enrichPoolsWithDetails(sushiPools.value.pools, 'sushi')
                : Promise.resolve([]),
              alienPools.status === 'fulfilled'
                ? enrichPoolsWithDetails(alienPools.value.pools, 'alien')
                : Promise.resolve([]),
            ]);

          console.log('[UI] Other DEX pools enriched with TVL details');

          // Update with enriched pool data
          setDashboardData((prev) => ({
            ...prev!,
            uniswapPools:
              enrichedUniswap.status === 'fulfilled'
                ? enrichedUniswap.value
                : undefined,
            pancakePools:
              enrichedPancake.status === 'fulfilled'
                ? enrichedPancake.value
                : undefined,
            sushiPools:
              enrichedSushi.status === 'fulfilled'
                ? enrichedSushi.value
                : undefined,
            alienPools:
              enrichedAlien.status === 'fulfilled'
                ? enrichedAlien.value
                : undefined,
          }));

          setLoadingOtherPools(false);
        })
        .catch((error) => {
          console.error('[UI] Error loading Other DEX pools:', error);
          setLoadingOtherPools(false);
        });
    } catch (err) {
      if (err instanceof CambrianAPIError) {
        setError(`API Error: ${err.message}`);
      } else {
        setError(
          `An unexpected error occurred: ${
            err instanceof Error ? err.message : 'Unknown error'
          }`
        );
      }
      setLoading(false);
    }
  };

  const handleRetry = () => {
    if (dashboardData?.token) {
      handleSearch(dashboardData.token.symbol);
    }
  };

  return (
    <main className="min-h-screen p-3 md:p-6">
      {/* Header */}
      <header className="mb-4">
        <div className="terminal-card">
          <div className="flex items-center gap-3">
            <div className="text-2xl">⚡</div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-terminal-textBright mb-0">
                BASE TERMINAL
              </h1>
              <p className="text-terminal-textDim text-xs md:text-sm">
                {'>'} Powered by{' '}
                <a
                  href="https://www.cambrian.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-terminal-text hover:text-terminal-textBright underline"
                >
                  Cambrian API
                </a>{' '}
                | BASE
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Search */}
      <TokenSearch onSearch={handleSearch} isLoading={loading} />

      {/* Loading State */}
      {loading && <LoadingSpinner />}

      {/* Error State */}
      {error && <ErrorMessage message={error} onRetry={handleRetry} />}

      {/* Dashboard */}
      {dashboardData && !loading && (
        <div className="space-y-4">
          {/* Token Header */}
          <div className="terminal-card">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg md:text-xl font-bold text-terminal-textBright mb-1">
                  {dashboardData.token.name} ({dashboardData.token.symbol})
                </h2>
                <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-4 text-xs md:text-sm text-terminal-textDim">
                  <div>
                    <span className="mr-2">[CONTRACT]</span>
                    <a
                      href={getBaseScanUrl(dashboardData.token.address, 'token')}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-terminal-text hover:text-terminal-textBright font-mono text-xs underline"
                      title="View token on BaseScan"
                    >
                      {dashboardData.token.address}
                    </a>
                  </div>
                  <div>
                    <span className="mr-2">[DECIMALS]</span>
                    <span className="text-terminal-text">
                      {dashboardData.token.decimals}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleSearch(dashboardData.token.symbol)}
                className="text-terminal-text hover:text-terminal-textBright transition-colors text-xs"
                title="Refresh data"
              >
                🔄
              </button>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <PriceOverviewCard
              currentPrice={dashboardData.currentPrice}
              priceHistory={dashboardData.priceHistory}
            />
            <TopHoldersCard holdersData={dashboardData.topHolders} />
          </div>

          {/* Pools Section - Load independently */}
          <AerodromePoolsCard
            pools={dashboardData.aerodomePools}
            loading={loadingAerodomePools}
          />
          <OtherDEXPoolsCard
            uniswapPools={dashboardData.uniswapPools}
            pancakePools={dashboardData.pancakePools}
            sushiPools={dashboardData.sushiPools}
            alienPools={dashboardData.alienPools}
            loading={loadingOtherPools}
          />
        </div>
      )}

      {/* Footer */}
      <footer className="mt-6 mb-3">
        <div className="terminal-card text-center text-xs">
          <p className="text-terminal-textDim">
            made by <a href='https://0xpili.xyz/' target='_blank' className='text-terminal-text hover:text-terminal-textBright underline'>pili</a> |{' '}
            <a
              href="https://cambrian.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-terminal-text hover:text-terminal-textBright underline"
            >
              cambrian.org
            </a>
          </p>
        </div>
      </footer>
    </main>
  );
}
