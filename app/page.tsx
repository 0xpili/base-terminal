'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

/** Enable debug logging via browser console: window.__CAMBRIAN_DEBUG__ = true */
const DEBUG = typeof window !== 'undefined' && (window as any).__CAMBRIAN_DEBUG__ === true;
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
import type {
  Token,
  PriceCurrentResponse,
  PriceHourResponse,
  TopHoldersResponse,
  AerodromePool,
  UniswapV3Pool,
} from '@/types/cambrian';

// Helper to filter pools by token address (safety check after enrichment)
function filterPoolsByToken(pools: UniswapV3Pool[] | undefined, tokenAddress: string): UniswapV3Pool[] {
  if (!pools || pools.length === 0) return [];
  const addrLower = tokenAddress.toLowerCase();

  const filtered = pools.filter(pool => {
    const t0 = (pool.token0_address || '').toLowerCase();
    const t1 = (pool.token1_address || '').toLowerCase();
    return t0 === addrLower || t1 === addrLower;
  });

  if (DEBUG) console.log(`[Filter] Pools containing ${tokenAddress}: ${filtered.length} of ${pools.length}`);
  return filtered;
}

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

function HomeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingAerodomePools, setLoadingAerodomePools] = useState(false);
  const [loadingOtherPools, setLoadingOtherPools] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSearch = useCallback(async (query: string, updateUrl = true) => {
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

      // Update URL with token address for sharing
      if (updateUrl) {
        router.replace(`?token=${token.address}`, { scroll: false });
      }

      // Step 3: Load Aerodrome pools first (fast, no enrichment needed)
      setLoadingAerodomePools(true);
      if (DEBUG) console.log('[UI] Loading Aerodrome pools for token:', token.address);

      getAerodromeV2Pools(token.address, 100)
        .then((result) => {
          if (DEBUG) console.log('[UI] Aerodrome pools loaded:', result.pools.length);
          setDashboardData((prev) => ({
            ...prev!,
            aerodomePools: result.pools,
          }));
          setLoadingAerodomePools(false);
        })
        .catch((error) => {
          if (DEBUG) console.error('[UI] Error loading Aerodrome pools:', error);
          setLoadingAerodomePools(false);
        });

      // Step 4: Load Other DEX pools separately (slower, needs enrichment)
      setLoadingOtherPools(true);
      if (DEBUG) console.log('[UI] Loading Other DEX pools for token:', token.address);

      Promise.allSettled([
        getUniswapV3Pools(token.address, 100),
        getPancakeV3Pools(token.address, 100),
        getSushiV3Pools(token.address, 100),
        getAlienV3Pools(token.address, 100),
      ])
        .then(async ([uniswapPools, pancakePools, sushiPools, alienPools]) => {
          if (DEBUG) {
            console.log('[UI] Other DEX pool lists loaded:', {
              uniswap: uniswapPools.status === 'fulfilled' ? uniswapPools.value.pools.length : 'failed',
              pancake: pancakePools.status === 'fulfilled' ? pancakePools.value.pools.length : 'failed',
              sushi: sushiPools.status === 'fulfilled' ? sushiPools.value.pools.length : 'failed',
              alien: alienPools.status === 'fulfilled' ? alienPools.value.pools.length : 'failed',
            });
          }

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

          if (DEBUG) console.log('[UI] Other DEX pools enriched with TVL details');

          // Apply final safety filter to ensure only pools with searched token are shown
          const filteredUniswap = enrichedUniswap.status === 'fulfilled'
            ? filterPoolsByToken(enrichedUniswap.value, token.address)
            : [];
          const filteredPancake = enrichedPancake.status === 'fulfilled'
            ? filterPoolsByToken(enrichedPancake.value, token.address)
            : [];
          const filteredSushi = enrichedSushi.status === 'fulfilled'
            ? filterPoolsByToken(enrichedSushi.value, token.address)
            : [];
          const filteredAlien = enrichedAlien.status === 'fulfilled'
            ? filterPoolsByToken(enrichedAlien.value, token.address)
            : [];

          // Update with filtered pool data
          setDashboardData((prev) => ({
            ...prev!,
            uniswapPools: filteredUniswap.length > 0 ? filteredUniswap : undefined,
            pancakePools: filteredPancake.length > 0 ? filteredPancake : undefined,
            sushiPools: filteredSushi.length > 0 ? filteredSushi : undefined,
            alienPools: filteredAlien.length > 0 ? filteredAlien : undefined,
          }));

          setLoadingOtherPools(false);
        })
        .catch((error) => {
          if (DEBUG) console.error('[UI] Error loading Other DEX pools:', error);
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
  }, [router]);

  // Auto-search token from URL on page load
  useEffect(() => {
    const tokenFromUrl = searchParams.get('token');
    if (tokenFromUrl && !dashboardData && !loading) {
      handleSearch(tokenFromUrl, false);
    }
  }, [searchParams, dashboardData, loading, handleSearch]);

  const handleRetry = () => {
    if (dashboardData?.token) {
      handleSearch(dashboardData.token.symbol);
    }
  };

  const handleReset = () => {
    setDashboardData(null);
    setError(null);
    setLoading(false);
    router.replace('/', { scroll: false });
  };

  const handleShare = async () => {
    if (!dashboardData?.token) return;

    const shareUrl = `${window.location.origin}?token=${dashboardData.token.address}`;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <main className="min-h-screen p-3 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Centered Header + Search (when no data) */}
        {!dashboardData && !loading && !error && (
          <div className="flex items-center justify-center min-h-[70vh]">
            <div className="w-full max-w-xl px-4">
              <div className="text-center mb-8">
                <h1 className="text-3xl md:text-4xl font-bold text-terminal-textBright mb-2 tracking-wide">
                  BASE TERMINAL
                </h1>
                <p className="text-terminal-textDim text-sm">
                  Powered by{' '}
                  <a
                    href="https://www.cambrian.org/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-terminal-text hover:text-terminal-textBright underline"
                  >
                    Cambrian API
                  </a>
                </p>
              </div>
              <TokenSearch onSearch={handleSearch} isLoading={loading} minimal />
            </div>
          </div>
        )}

        {/* Compact Header (when data is shown) */}
        {(dashboardData || loading || error) && (
          <>
            <header className="mb-6">
              <div className="flex items-center justify-between py-2">
                <button
                  onClick={handleReset}
                  className="text-lg md:text-xl font-bold text-terminal-textBright hover:text-terminal-text transition-colors tracking-wide"
                  title="Back to home"
                >
                  BASE TERMINAL
                </button>
                <div className="flex items-center gap-4">
                  {dashboardData && (
                    <button
                      onClick={handleShare}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-terminal-border rounded hover:border-terminal-text hover:text-terminal-textBright transition-colors"
                      title="Copy shareable link"
                    >
                      {copied ? (
                        <>
                          <span className="text-terminal-textBright">✓</span>
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <span>⎘</span>
                          <span>Share</span>
                        </>
                      )}
                    </button>
                  )}
                  <p className="text-terminal-textDim text-xs hidden md:block">
                    Powered by{' '}
                    <a
                      href="https://www.cambrian.org/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-terminal-text hover:text-terminal-textBright underline"
                    >
                      Cambrian API
                    </a>
                  </p>
                </div>
              </div>
            </header>

            {/* Search */}
            <TokenSearch onSearch={handleSearch} isLoading={loading} />
          </>
        )}

        {/* Loading State */}
        {loading && <LoadingSpinner />}

        {/* Error State */}
        {error && <ErrorMessage message={error} onRetry={handleRetry} />}

        {/* Dashboard */}
        {dashboardData && !loading && (
          <div className="space-y-6">
            {/* Metrics Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <PriceOverviewCard
                token={dashboardData.token}
                currentPrice={dashboardData.currentPrice}
                priceHistory={dashboardData.priceHistory}
                onRefresh={() => handleSearch(dashboardData.token.symbol)}
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
        <footer className="mt-16 py-6">
          <div className="text-center text-xs text-terminal-textDim">
            <p>
              made by{' '}
              <a
                href="https://0xpili.xyz/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-terminal-text hover:text-terminal-textBright underline"
              >
                pili
              </a>
              {' · '}
              <a
                href="https://github.com/0xpili/base-terminal"
                target="_blank"
                rel="noopener noreferrer"
                className="text-terminal-text hover:text-terminal-textBright underline"
              >
                GitHub Repository
              </a>
            </p>
          </div>
        </footer>
      </div>
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <HomeContent />
    </Suspense>
  );
}
