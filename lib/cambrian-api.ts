import type {
  PriceCurrentResponse,
  PriceHourResponse,
  TopHoldersResponse,
  AerodromePoolsResponse,
  UniswapV3PoolsResponse,
  ChainsResponse,
  TokensResponse,
  DexesResponse,
  Token,
  AerodromePool,
  UniswapV3Pool,
} from '@/types/cambrian';

const BASE_CHAIN_ID = 8453; // Base chain ID

class CambrianAPIError extends Error {
  constructor(
    message: string,
    public status?: number,
    public response?: any
  ) {
    super(message);
    this.name = 'CambrianAPIError';
  }
}

// Columnar response format from Cambrian API
interface ColumnarResponse {
  columns: Array<{ name: string; type: string }>;
  data: any[][];
  rows?: number;
}

// Transform columnar data to array of objects
function transformColumnarToObjects<T>(columnarData: ColumnarResponse[]): T[] {
  if (!columnarData || columnarData.length === 0) {
    return [];
  }

  const firstResult = columnarData[0];
  if (!firstResult || !firstResult.columns || !firstResult.data) {
    return [];
  }

  const { columns, data } = firstResult;
  const columnNames = columns.map(col => col.name);

  return data.map(row => {
    const obj: any = {};
    columnNames.forEach((name, index) => {
      obj[name] = row[index];
    });
    return obj as T;
  });
}

async function fetchCambrian<T>(
  endpoint: string,
  params?: Record<string, string | number>
): Promise<T> {
  // Use our Next.js API route as a proxy to avoid CORS issues
  const url = new URL('/api/cambrian', window.location.origin);

  // Add endpoint as a parameter
  url.searchParams.append('endpoint', endpoint);

  // Add all other params
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, String(value));
    });
  }

  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      // Special handling for authentication errors
      if (response.status === 401 || response.status === 403 || response.status === 500) {
        throw new CambrianAPIError(
          'Invalid API key. Please get a new API key from https://www.cambrian.org/dashboard',
          response.status,
          errorData
        );
      }

      throw new CambrianAPIError(
        errorData.message || errorData.error || `API error: ${response.statusText}`,
        response.status,
        errorData
      );
    }

    return await response.json();
  } catch (error) {
    if (error instanceof CambrianAPIError) {
      throw error;
    }
    throw new CambrianAPIError(
      `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

// Price endpoints
export async function getCurrentPrice(
  tokenAddress: string
): Promise<PriceCurrentResponse> {
  const data = await fetchCambrian<ColumnarResponse[]>('/evm/price-current', {
    token_address: tokenAddress,
    chain_id: BASE_CHAIN_ID,
  });

  const transformed = transformColumnarToObjects<any>(data);
  if (transformed.length === 0) {
    throw new CambrianAPIError('No price data found');
  }

  const result = transformed[0];
  return {
    token_address: result.tokenAddress || result.token_address,
    price_usd: result.priceUSD || result.price_usd,
    timestamp: new Date(result.updatedAt || result.updated_at).getTime() / 1000,
  };
}

export async function getPriceHistory(
  tokenAddress: string,
  hours: number = 24
): Promise<PriceHourResponse[]> {
  const data = await fetchCambrian<ColumnarResponse[]>('/evm/price-hour', {
    token_address: tokenAddress,
    chain_id: BASE_CHAIN_ID,
    hours,
  });

  const transformed = transformColumnarToObjects<any>(data);
  return transformed.map(item => ({
    token_address: item.tokenAddress || item.token_address || tokenAddress,
    timestamp: new Date(item.timestamp || item.updatedAt).getTime() / 1000,
    price_usd: item.priceUSD || item.price_usd || item.price,
    interval: '1h',
  }));
}

// Holder endpoints
export async function getTopHolders(
  tokenAddress: string,
  limit: number = 10
): Promise<TopHoldersResponse> {
  const data = await fetchCambrian<ColumnarResponse[]>('/evm/tvl/top-owners', {
    token_address: tokenAddress,
    chain_id: BASE_CHAIN_ID,
  });

  const transformed = transformColumnarToObjects<any>(data);

  // Calculate total token supply from holders
  const totalSupply = transformed.reduce((sum, item) =>
    sum + Number(item.tokenAmount || 0), 0
  );

  const holders = transformed.slice(0, limit).map(item => {
    const tokenAmount = Number(item.tokenAmount || 0);
    const percentage = totalSupply > 0 ? (tokenAmount / totalSupply) * 100 : 0;

    return {
      holder_address: item.owner || item.holderAddress || item.holder_address,
      balance: String(tokenAmount),
      balance_usd: Number(item.valueUSD || item.balanceUSD || item.balance_usd || 0),
      percentage,
    };
  });

  const totalHolders = transformed.length;
  const top10Concentration = holders
    .slice(0, 10)
    .reduce((sum, h) => sum + h.percentage, 0);

  return {
    token_address: tokenAddress,
    holders,
    total_holders: totalHolders,
    top_10_concentration: top10Concentration,
  };
}

// Aerodrome pool endpoints
export async function getAerodromeV2Pools(
  tokenAddress?: string,
  limit: number = 10
): Promise<AerodromePoolsResponse> {
  // Note: Aerodrome V2 API doesn't accept chain_id or token_address parameters
  // We fetch all pools and filter client-side
  const data = await fetchCambrian<ColumnarResponse[]>('/evm/aero/v2/pools', {});
  const transformed = transformColumnarToObjects<any>(data);

  console.log(`[Aerodrome V2] Total pools fetched: ${transformed.length}`);

  // Filter by token if address provided (client-side filtering)
  let filtered = transformed;
  if (tokenAddress) {
    const addrLower = tokenAddress.toLowerCase();
    console.log(`[Aerodrome V2] Filtering ${transformed.length} pools for token: ${tokenAddress}`);
    console.log(`[Aerodrome V2] Sample pool tokens:`, transformed.slice(0, 3).map(p => ({
      token0: p.token0 || p.token0Address,
      token1: p.token1 || p.token1Address
    })));

    filtered = transformed.filter(item => {
      // Check all possible field name variations (token0, token0Address, token0_address)
      const t0 = item.token0 || item.token0Address || item.token0_address;
      const t1 = item.token1 || item.token1Address || item.token1_address;
      return (t0 && t0.toLowerCase() === addrLower) ||
             (t1 && t1.toLowerCase() === addrLower);
    });
    console.log(`[Aerodrome V2] Filtered pools for ${tokenAddress}: ${filtered.length}`);

    if (filtered.length > 0) {
      console.log(`[Aerodrome V2] First matching pool:`, filtered[0]);
    }
  }

  const pools: AerodromePool[] = filtered.slice(0, limit).map((item, index) => {
      const pool: AerodromePool = {
        pool_address: item.poolId || item.poolAddress || item.pool_address,
        token0_address: item.token0 || item.token0Address || item.token0_address,
        token0_symbol: item.token0Symbol || item.token0_symbol,
        token1_address: item.token1 || item.token1Address || item.token1_address,
        token1_symbol: item.token1Symbol || item.token1_symbol,
        pool_type: 'volatile',
        tvl_usd: Number(item.poolTvlUSD || item.tvlUSD || item.tvl_usd || 0),
        volume_24h: Number(item.volume24hUSD || item.volume24h || item.volume_24h || 0),
        volume_7d: Number(item.volume7dUSD || item.volume7d || item.volume_7d || 0),
        fee_apr: Number(item.swapFeeApr7d || item.feeApr || item.fee_apr || 0),
        swap_count_24h: 0,
        unique_swappers_24h: 0,
        fees_24h: 0,
        created_at: new Date(item.createdAt || Date.now()).getTime() / 1000,
      };

      // Data validation warnings
      if (pool.tvl_usd === 0 && pool.volume_24h === 0) {
        console.warn(`[Aerodrome V2] Pool ${index + 1} has 0 TVL and 0 volume:`, {
          pool: `${pool.token0_symbol}/${pool.token1_symbol}`,
          address: pool.pool_address,
          raw: item
        });
      }

      return pool;
    });

  return {
    pools,
    total_pools: filtered.length,
  };
}

export async function getAerodromeV3Pools(
  tokenAddress?: string,
  limit: number = 10
): Promise<UniswapV3PoolsResponse> {
  return getUniV3StylePools('/evm/aero/v3/pools', tokenAddress, limit);
}

// Uniswap V3 pools
export async function getUniswapV3Pools(
  tokenAddress?: string,
  limit: number = 10
): Promise<UniswapV3PoolsResponse> {
  return getUniV3StylePools('/evm/uniswap/v3/pools', tokenAddress, limit);
}

// Other DEX pools (PancakeSwap, Sushi, Alien)
export async function getPancakeV3Pools(
  tokenAddress?: string,
  limit: number = 10
): Promise<UniswapV3PoolsResponse> {
  return getUniV3StylePools('/evm/pancake/v3/pools', tokenAddress, limit);
}

export async function getSushiV3Pools(
  tokenAddress?: string,
  limit: number = 10
): Promise<UniswapV3PoolsResponse> {
  return getUniV3StylePools('/evm/sushi/v3/pools', tokenAddress, limit);
}

export async function getAlienV3Pools(
  tokenAddress?: string,
  limit: number = 10
): Promise<UniswapV3PoolsResponse> {
  return getUniV3StylePools('/evm/alien/v3/pools', tokenAddress, limit);
}

// Helper for UniV3-style pools
async function getUniV3StylePools(
  endpoint: string,
  tokenAddress?: string,
  limit: number = 10
): Promise<UniswapV3PoolsResponse> {
  const dexName = endpoint.includes('uniswap') ? 'Uniswap'
    : endpoint.includes('pancake') ? 'PancakeSwap'
    : endpoint.includes('sushi') ? 'Sushi'
    : endpoint.includes('alien') ? 'Alien'
    : endpoint.includes('aero') ? 'Aerodrome'
    : 'DEX';

  // Build query params
  const params: Record<string, string | number> = {
    chain_id: BASE_CHAIN_ID,
  };

  // Add token_address if provided (API may support server-side filtering)
  if (tokenAddress) {
    params.token_address = tokenAddress;
  }

  const data = await fetchCambrian<ColumnarResponse[]>(endpoint, params);
  const transformed = transformColumnarToObjects<any>(data);

  console.log(`[${dexName}] Total pools fetched: ${transformed.length}`);

  // DEBUG: Log actual field names from API response
  if (transformed.length > 0) {
    console.log(`[${dexName}] Sample pool keys:`, Object.keys(transformed[0]));
    console.log(`[${dexName}] Sample pool data:`, JSON.stringify(transformed[0], null, 2));
  }

  // Filter out pools with missing token symbols or metadata
  let filtered = transformed.filter(item => {
    const hasToken0Symbol = item.token0Symbol && item.token0Symbol.trim() !== '';
    const hasToken1Symbol = item.token1Symbol && item.token1Symbol.trim() !== '';
    return hasToken0Symbol && hasToken1Symbol;
  });

  console.log(`[${dexName}] Total pools after filtering invalid data: ${filtered.length} (removed ${transformed.length - filtered.length} incomplete pools)`);

  // Filter by token if address provided - ALWAYS filter client-side since API may not support it
  if (tokenAddress) {
    const addrLower = tokenAddress.toLowerCase();
    console.log(`[${dexName}] Filtering pools for token: ${tokenAddress}`);
    if (filtered.length > 0) {
      console.log(`[${dexName}] Sample pool raw data:`, JSON.stringify(filtered[0], null, 2).slice(0, 500));
    }

    const beforeCount = filtered.length;
    filtered = filtered.filter(item => {
      // Check all possible field names for token addresses
      const token0Addr = (item.token0 || item.token0Address || item.token0_address || '').toLowerCase();
      const token1Addr = (item.token1 || item.token1Address || item.token1_address || '').toLowerCase();
      return token0Addr === addrLower || token1Addr === addrLower;
    });
    console.log(`[${dexName}] Filtered pools for ${tokenAddress}: ${filtered.length} (from ${beforeCount})`);
  }

  const pools: UniswapV3Pool[] = filtered.slice(0, limit).map((item, index) => {
      const pool: UniswapV3Pool = {
        pool_address: item.poolId || item.poolAddress || item.pool_address || item.address,
        token0_address: item.token0 || item.token0Address || item.token0_address,
        token0_symbol: item.token0Symbol || item.token0_symbol,
        token0_decimals: Number(item.token0Decimals || item.token0_decimals || 18),
        token1_address: item.token1 || item.token1Address || item.token1_address,
        token1_symbol: item.token1Symbol || item.token1_symbol,
        token1_decimals: Number(item.token1Decimals || item.token1_decimals || 18),
        fee_tier: Number(item.feeTier || item.fee_tier || item.fee || 0),
        tvl_usd: Number(item.poolTvlUSD || item.tvlUSD || item.tvl_usd || item.tvl || 0),
        volume_24h: Number(item.volume24hUSD || item.volume24h || item.volume_24h || 0),
        volume_1h: Number(item.volume1hUSD || item.volume1h || item.volume_1h || 0),
        volume_7d: Number(item.volume7dUSD || item.volume7d || item.volume_7d || 0),
        swap_count_24h: 0,
        unique_users_24h: 0,
        created_timestamp: new Date(item.createdAt || item.createdTimestamp || Date.now()).getTime() / 1000,
      };

      // Data validation warnings
      if (pool.tvl_usd === 0 && pool.volume_24h === 0) {
        console.warn(`[${dexName}] Pool ${index + 1} has 0 TVL and 0 volume:`, {
          pool: `${pool.token0_symbol}/${pool.token1_symbol}`,
          address: pool.pool_address,
          raw: item
        });
      }

      return pool;
    });

  return {
    pools,
    total_count: filtered.length,
  };
}

// Helper function to enrich pools with detailed information
export async function enrichPoolsWithDetails(
  pools: UniswapV3Pool[],
  dex: 'uniswap' | 'pancake' | 'sushi' | 'alien' | 'aero'
): Promise<UniswapV3Pool[]> {
  const detailFetchers = {
    uniswap: getUniswapV3PoolDetail,
    pancake: getPancakeV3PoolDetail,
    sushi: getSushiV3PoolDetail,
    alien: getAlienV3PoolDetail,
    aero: getAerodromeV3PoolDetail,
  };

  const fetcher = detailFetchers[dex];

  // Strategy: Try to enrich pools, but don't discard original data if enrichment fails
  const MAX_POOLS_TO_ENRICH = 30;
  const poolsToEnrich = pools.slice(0, MAX_POOLS_TO_ENRICH);

  console.log(`[${dex}] Starting enrichment for top ${poolsToEnrich.length} of ${pools.length} pools`);
  console.log(`[${dex}] Pools before enrichment - with TVL: ${pools.filter(p => p.tvl_usd > 0).length}, without TVL: ${pools.filter(p => p.tvl_usd === 0).length}`);

  // Process pools in batches
  const BATCH_SIZE = 10;
  const enrichedPools: UniswapV3Pool[] = [];
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < poolsToEnrich.length; i += BATCH_SIZE) {
    const batch = poolsToEnrich.slice(i, i + BATCH_SIZE);

    const batchPromises = batch.map(async (pool) => {
      try {
        const detailedPool = await fetcher(pool.pool_address);

        if (detailedPool && (detailedPool.tvl_usd > 0 || (detailedPool.fee_apr && detailedPool.fee_apr > 0))) {
          // Enrichment succeeded with meaningful data
          successCount++;
          return {
            ...pool,
            ...detailedPool,
            token0_symbol: detailedPool.token0_symbol || pool.token0_symbol,
            token1_symbol: detailedPool.token1_symbol || pool.token1_symbol,
          };
        } else {
          // Enrichment returned empty data - keep original if it has data
          failCount++;
          if (pool.tvl_usd > 0 || pool.volume_24h > 0) {
            console.log(`[${dex}] Enrichment returned empty for ${pool.token0_symbol}/${pool.token1_symbol} - keeping original data (TVL: $${pool.tvl_usd})`);
            return pool;
          }
          return null; // No data from either source
        }
      } catch (error) {
        failCount++;
        // On error, keep original pool if it has data
        if (pool.tvl_usd > 0 || pool.volume_24h > 0) {
          console.warn(`[${dex}] Enrichment failed for ${pool.token0_symbol}/${pool.token1_symbol} - keeping original data (TVL: $${pool.tvl_usd})`);
          return pool;
        }
        console.warn(`[${dex}] Enrichment failed for ${pool.pool_address} with no fallback data:`, error);
        return null;
      }
    });

    const batchResults = await Promise.all(batchPromises);
    const validPools = batchResults.filter(pool => pool !== null) as UniswapV3Pool[];
    enrichedPools.push(...validPools);

    console.log(`[${dex}] Batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(poolsToEnrich.length / BATCH_SIZE)} complete - ${validPools.length} pools with data`);
  }

  console.log(`[${dex}] Enrichment complete - Success: ${successCount}, Failed: ${failCount}, Total returned: ${enrichedPools.length}`);
  console.log(`[${dex}] After enrichment - with TVL: ${enrichedPools.filter(p => p.tvl_usd > 0).length}, with APR: ${enrichedPools.filter(p => p.fee_apr && p.fee_apr > 0).length}`);

  return enrichedPools as UniswapV3Pool[];
}

// Individual pool detail endpoints
export async function getUniswapV3PoolDetail(poolAddress: string): Promise<UniswapV3Pool | null> {
  try {
    const data = await fetchCambrian<ColumnarResponse[]>('/evm/uniswap/v3/pool', {
      chain_id: BASE_CHAIN_ID,
      pool_address: poolAddress,
    });
    const transformed = transformColumnarToObjects<any>(data);
    if (transformed.length === 0) return null;

    const item = transformed[0];
    // DEBUG: Log actual field names from pool detail API
    console.log(`[Uniswap] Pool detail keys for ${poolAddress}:`, Object.keys(item));
    console.log(`[Uniswap] Pool detail raw data:`, JSON.stringify(item, null, 2).slice(0, 1000));

    // Field mappings based on Cambrian API docs:
    // - poolTvlUSD: Total TVL (single Float64 value)
    // - feeApr: Map with keys '1 day', '1 week', etc.
    // - swapVolumeUSD: Map with keys '1 day', '1 week', etc.
    const poolDetail = {
      pool_address: item.poolId || item.poolAddress || item.pool_address || poolAddress,
      token0_address: item.token0 || item.token0Address || item.token0_address,
      token0_symbol: item.token0Symbol || item.token0_symbol,
      token0_decimals: Number(item.token0Decimals || item.token0_decimals || 18),
      token1_address: item.token1 || item.token1Address || item.token1_address,
      token1_symbol: item.token1Symbol || item.token1_symbol,
      token1_decimals: Number(item.token1Decimals || item.token1_decimals || 18),
      fee_tier: Number(item.feeTier || item.fee_tier || item.fee || 0),
      // TVL: poolTvlUSD is the total TVL (not time-ranged)
      tvl_usd: Number(item.poolTvlUSD || item.tvlUSD || item.tvl_usd || item.tvl || 0),
      // Volume: swapVolumeUSD is a Map - access '1 day' key
      volume_24h: Number(item.swapVolumeUSD?.['1 day'] || item.volumeUSD1d || item.volume24hUSD || item.volume_24h || 0),
      volume_1h: Number(item.swapVolumeUSD?.['1 hour'] || item.volumeUSD1h || item.volume1hUSD || item.volume_1h || 0),
      volume_7d: Number(item.swapVolumeUSD?.['1 week'] || item.volumeUSD7d || item.volume7dUSD || item.volume_7d || 0),
      swap_count_24h: Number(item.swapCount?.['1 day'] || item.swapCount1d || item.swap_count_24h || 0),
      unique_users_24h: Number(item.uniqueUserCount?.['1 day'] || item.uniqueUsers1d || item.unique_users_24h || 0),
      created_timestamp: new Date(item.createdAt || item.createdTimestamp || Date.now()).getTime() / 1000,
      // Fee APR: feeApr is a Map - access '1 day' key
      fee_apr: Number(item.feeApr?.['1 day'] || item.feeAPR1d || item.fee_apr || item.feeAPR || 0),
    };

    console.log(`[Uniswap] Pool ${poolAddress} - TVL: $${poolDetail.tvl_usd}, Volume24h: $${poolDetail.volume_24h}, FeeAPR: ${poolDetail.fee_apr}%`);

    return poolDetail;
  } catch (error) {
    console.error(`Failed to fetch Uniswap pool ${poolAddress}:`, error);
    return null;
  }
}

export async function getPancakeV3PoolDetail(poolAddress: string): Promise<UniswapV3Pool | null> {
  try {
    const data = await fetchCambrian<ColumnarResponse[]>('/evm/pancake/v3/pool', {
      chain_id: BASE_CHAIN_ID,
      pool_address: poolAddress,
    });
    const transformed = transformColumnarToObjects<any>(data);
    if (transformed.length === 0) return null;

    const item = transformed[0];
    // Field mappings based on Cambrian API docs:
    // - poolTvlUSD: Total TVL (single Float64 value)
    // - feeApr: Map with keys '1 day', '1 week', etc.
    // - swapVolumeUSD: Map with keys '1 day', '1 week', etc.
    const poolDetail = {
      pool_address: item.poolId || item.poolAddress || item.pool_address || poolAddress,
      token0_address: item.token0 || item.token0Address || item.token0_address,
      token0_symbol: item.token0Symbol || item.token0_symbol,
      token0_decimals: Number(item.token0Decimals || item.token0_decimals || 18),
      token1_address: item.token1 || item.token1Address || item.token1_address,
      token1_symbol: item.token1Symbol || item.token1_symbol,
      token1_decimals: Number(item.token1Decimals || item.token1_decimals || 18),
      fee_tier: Number(item.feeTier || item.fee_tier || item.fee || 0),
      // TVL: poolTvlUSD is the total TVL (not time-ranged)
      tvl_usd: Number(item.poolTvlUSD || item.tvlUSD || item.tvl_usd || item.tvl || 0),
      // Volume: swapVolumeUSD is a Map - access '1 day' key
      volume_24h: Number(item.swapVolumeUSD?.['1 day'] || item.volumeUSD1d || item.volume24hUSD || item.volume_24h || 0),
      volume_1h: Number(item.swapVolumeUSD?.['1 hour'] || item.volumeUSD1h || item.volume1hUSD || item.volume_1h || 0),
      volume_7d: Number(item.swapVolumeUSD?.['1 week'] || item.volumeUSD7d || item.volume7dUSD || item.volume_7d || 0),
      swap_count_24h: Number(item.swapCount?.['1 day'] || item.swapCount1d || item.swap_count_24h || 0),
      unique_users_24h: Number(item.uniqueUserCount?.['1 day'] || item.uniqueUsers1d || item.unique_users_24h || 0),
      created_timestamp: new Date(item.createdAt || item.createdTimestamp || Date.now()).getTime() / 1000,
      // Fee APR: feeApr is a Map - access '1 day' key
      fee_apr: Number(item.feeApr?.['1 day'] || item.feeAPR1d || item.fee_apr || item.feeAPR || 0),
    };

    console.log(`[Pancake] Pool ${poolAddress} - TVL: $${poolDetail.tvl_usd}, Volume24h: $${poolDetail.volume_24h}, FeeAPR: ${poolDetail.fee_apr}%`);

    return poolDetail;
  } catch (error) {
    console.error(`Failed to fetch PancakeSwap pool ${poolAddress}:`, error);
    return null;
  }
}

export async function getSushiV3PoolDetail(poolAddress: string): Promise<UniswapV3Pool | null> {
  try {
    const data = await fetchCambrian<ColumnarResponse[]>('/evm/sushi/v3/pool', {
      chain_id: BASE_CHAIN_ID,
      pool_address: poolAddress,
    });
    const transformed = transformColumnarToObjects<any>(data);
    if (transformed.length === 0) {
      console.warn(`[Sushi] No data returned for pool ${poolAddress}`);
      return null;
    }

    const item = transformed[0];
    // Field mappings based on Cambrian API docs:
    // - poolTvlUSD: Total TVL (single Float64 value)
    // - feeApr: Map with keys '1 day', '1 week', etc.
    // - swapVolumeUSD: Map with keys '1 day', '1 week', etc.
    const poolDetail = {
      pool_address: item.poolId || item.poolAddress || item.pool_address || poolAddress,
      token0_address: item.token0 || item.token0Address || item.token0_address,
      token0_symbol: item.token0Symbol || item.token0_symbol,
      token0_decimals: Number(item.token0Decimals || item.token0_decimals || 18),
      token1_address: item.token1 || item.token1Address || item.token1_address,
      token1_symbol: item.token1Symbol || item.token1_symbol,
      token1_decimals: Number(item.token1Decimals || item.token1_decimals || 18),
      fee_tier: Number(item.feeTier || item.fee_tier || item.fee || 0),
      // TVL: poolTvlUSD is the total TVL (not time-ranged)
      tvl_usd: Number(item.poolTvlUSD || item.tvlUSD || item.tvl_usd || item.tvl || 0),
      // Volume: swapVolumeUSD is a Map - access '1 day' key
      volume_24h: Number(item.swapVolumeUSD?.['1 day'] || item.volumeUSD1d || item.volume24hUSD || item.volume_24h || 0),
      volume_1h: Number(item.swapVolumeUSD?.['1 hour'] || item.volumeUSD1h || item.volume1hUSD || item.volume_1h || 0),
      volume_7d: Number(item.swapVolumeUSD?.['1 week'] || item.volumeUSD7d || item.volume7dUSD || item.volume_7d || 0),
      swap_count_24h: Number(item.swapCount?.['1 day'] || item.swapCount1d || item.swap_count_24h || 0),
      unique_users_24h: Number(item.uniqueUserCount?.['1 day'] || item.uniqueUsers1d || item.unique_users_24h || 0),
      created_timestamp: new Date(item.createdAt || item.createdTimestamp || Date.now()).getTime() / 1000,
      // Fee APR: feeApr is a Map - access '1 day' key
      fee_apr: Number(item.feeApr?.['1 day'] || item.feeAPR1d || item.fee_apr || item.feeAPR || 0),
    };

    console.log(`[Sushi] Pool ${poolAddress} - TVL: $${poolDetail.tvl_usd}, Volume24h: $${poolDetail.volume_24h}, FeeAPR: ${poolDetail.fee_apr}%`);

    return poolDetail;
  } catch (error) {
    console.error(`Failed to fetch Sushi pool ${poolAddress}:`, error);
    return null;
  }
}

export async function getAlienV3PoolDetail(poolAddress: string): Promise<UniswapV3Pool | null> {
  try {
    const data = await fetchCambrian<ColumnarResponse[]>('/evm/alien/v3/pool', {
      chain_id: BASE_CHAIN_ID,
      pool_address: poolAddress,
    });
    const transformed = transformColumnarToObjects<any>(data);
    if (transformed.length === 0) return null;

    const item = transformed[0];
    // Field mappings based on Cambrian API docs:
    // - poolTvlUSD: Total TVL (single Float64 value)
    // - feeApr: Map with keys '1 day', '1 week', etc.
    // - swapVolumeUSD: Map with keys '1 day', '1 week', etc.
    const poolDetail = {
      pool_address: item.poolId || item.poolAddress || item.pool_address || poolAddress,
      token0_address: item.token0 || item.token0Address || item.token0_address,
      token0_symbol: item.token0Symbol || item.token0_symbol,
      token0_decimals: Number(item.token0Decimals || item.token0_decimals || 18),
      token1_address: item.token1 || item.token1Address || item.token1_address,
      token1_symbol: item.token1Symbol || item.token1_symbol,
      token1_decimals: Number(item.token1Decimals || item.token1_decimals || 18),
      fee_tier: Number(item.feeTier || item.fee_tier || item.fee || 0),
      // TVL: poolTvlUSD is the total TVL (not time-ranged)
      tvl_usd: Number(item.poolTvlUSD || item.tvlUSD || item.tvl_usd || item.tvl || 0),
      // Volume: swapVolumeUSD is a Map - access '1 day' key
      volume_24h: Number(item.swapVolumeUSD?.['1 day'] || item.volumeUSD1d || item.volume24hUSD || item.volume_24h || 0),
      volume_1h: Number(item.swapVolumeUSD?.['1 hour'] || item.volumeUSD1h || item.volume1hUSD || item.volume_1h || 0),
      volume_7d: Number(item.swapVolumeUSD?.['1 week'] || item.volumeUSD7d || item.volume7dUSD || item.volume_7d || 0),
      swap_count_24h: Number(item.swapCount?.['1 day'] || item.swapCount1d || item.swap_count_24h || 0),
      unique_users_24h: Number(item.uniqueUserCount?.['1 day'] || item.uniqueUsers1d || item.unique_users_24h || 0),
      created_timestamp: new Date(item.createdAt || item.createdTimestamp || Date.now()).getTime() / 1000,
      // Fee APR: feeApr is a Map - access '1 day' key
      fee_apr: Number(item.feeApr?.['1 day'] || item.feeAPR1d || item.fee_apr || item.feeAPR || 0),
    };

    console.log(`[Alien] Pool ${poolAddress} - TVL: $${poolDetail.tvl_usd}, Volume24h: $${poolDetail.volume_24h}, FeeAPR: ${poolDetail.fee_apr}%`);

    return poolDetail;
  } catch (error) {
    console.error(`Failed to fetch Alien pool ${poolAddress}:`, error);
    return null;
  }
}

export async function getAerodromeV3PoolDetail(poolAddress: string): Promise<UniswapV3Pool | null> {
  try {
    const data = await fetchCambrian<ColumnarResponse[]>('/evm/aero/v3/pool', {
      chain_id: BASE_CHAIN_ID,
      pool_address: poolAddress,
    });
    const transformed = transformColumnarToObjects<any>(data);
    if (transformed.length === 0) return null;

    const item = transformed[0];
    return {
      pool_address: item.poolId || item.poolAddress || item.pool_address || poolAddress,
      token0_address: item.token0 || item.token0Address || item.token0_address,
      token0_symbol: item.token0Symbol || item.token0_symbol,
      token0_decimals: Number(item.token0Decimals || item.token0_decimals || 18),
      token1_address: item.token1 || item.token1Address || item.token1_address,
      token1_symbol: item.token1Symbol || item.token1_symbol,
      token1_decimals: Number(item.token1Decimals || item.token1_decimals || 18),
      fee_tier: Number(item.feeTier || item.fee_tier || item.fee || 0),
      tvl_usd: Number(item.poolTvlUSD || item.tvlUSD || item.tvl_usd || item.tvl || 0),
      volume_24h: Number(item.volume24hUSD || item.volume24h || item.volume_24h || 0),
      volume_1h: Number(item.volume1hUSD || item.volume1h || item.volume_1h || 0),
      volume_7d: Number(item.volume7dUSD || item.volume7d || item.volume_7d || 0),
      swap_count_24h: Number(item.swapCount24h || item.swap_count_24h || 0),
      unique_users_24h: Number(item.uniqueUsers24h || item.unique_users_24h || 0),
      created_timestamp: new Date(item.createdAt || item.createdTimestamp || Date.now()).getTime() / 1000,
    };
  } catch (error) {
    console.error(`Failed to fetch Aerodrome V3 pool ${poolAddress}:`, error);
    return null;
  }
}

// Supporting endpoints
export async function getChains(): Promise<ChainsResponse> {
  const data = await fetchCambrian<ColumnarResponse[]>('/evm/chains');
  const transformed = transformColumnarToObjects<any>(data);

  const chains = transformed.map(item => ({
    chain_id: item.chainId || item.chain_id,
    chain_name: item.chainName || item.chain_name || item.name,
    native_currency: item.nativeCurrency || item.native_currency || 'ETH',
    rpc_url: item.rpcUrl || item.rpc_url,
  }));

  return { chains };
}

export async function getTokens(
  chainId: number = BASE_CHAIN_ID
): Promise<TokensResponse> {
  const data = await fetchCambrian<ColumnarResponse[]>('/evm/tokens', {
    chain_id: chainId,
  });

  const transformed = transformColumnarToObjects<any>(data);
  const tokens: Token[] = transformed.map(item => ({
    address: item.address,
    symbol: item.symbol,
    name: item.name,
    decimals: Number(item.decimals || 18),
    chain_id: item.chainId || item.chain_id || chainId,
  }));

  return {
    tokens,
    total_count: tokens.length,
  };
}

export async function getDexes(chainId: number = BASE_CHAIN_ID): Promise<DexesResponse> {
  const data = await fetchCambrian<ColumnarResponse[]>('/evm/dexes', {
    chain_id: chainId,
  });

  const transformed = transformColumnarToObjects<any>(data);
  const dexes = transformed.map(item => ({
    dex_name: item.dexName || item.dex_name || item.name,
    dex_type: item.dexType || item.dex_type || item.type,
    chain_id: item.chainId || item.chain_id || chainId,
    factory_address: item.factoryAddress || item.factory_address,
  }));

  return { dexes };
}

// Search for token by symbol or address
export async function searchToken(query: string): Promise<TokensResponse> {
  try {
    const tokensResponse = await getTokens(BASE_CHAIN_ID);
    const normalizedQuery = query.toLowerCase().trim();

    // If it looks like an address, search by address
    if (normalizedQuery.startsWith('0x') && normalizedQuery.length === 42) {
      const filtered = tokensResponse.tokens.filter(
        (t) => t.address.toLowerCase() === normalizedQuery
      );
      return { tokens: filtered, total_count: filtered.length };
    }

    // Search by symbol or name
    const filtered = tokensResponse.tokens.filter(
      (t) =>
        t.symbol.toLowerCase().includes(normalizedQuery) ||
        t.name.toLowerCase().includes(normalizedQuery)
    );

    // Sort results: exact symbol match first, then exact name match, then partial matches
    filtered.sort((a, b) => {
      const aSymbolExact = a.symbol.toLowerCase() === normalizedQuery;
      const bSymbolExact = b.symbol.toLowerCase() === normalizedQuery;
      const aNameExact = a.name.toLowerCase() === normalizedQuery;
      const bNameExact = b.name.toLowerCase() === normalizedQuery;

      // Exact symbol match has highest priority
      if (aSymbolExact && !bSymbolExact) return -1;
      if (bSymbolExact && !aSymbolExact) return 1;

      // Then exact name match
      if (aNameExact && !bNameExact) return -1;
      if (bNameExact && !aNameExact) return 1;

      // Then symbol starts with query
      const aSymbolStarts = a.symbol.toLowerCase().startsWith(normalizedQuery);
      const bSymbolStarts = b.symbol.toLowerCase().startsWith(normalizedQuery);
      if (aSymbolStarts && !bSymbolStarts) return -1;
      if (bSymbolStarts && !aSymbolStarts) return 1;

      return 0;
    });

    return { tokens: filtered, total_count: filtered.length };
  } catch (error) {
    console.error('Search token error:', error);
    throw error;
  }
}

export { CambrianAPIError };
