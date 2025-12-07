// Cambrian API Response Types for Base/EVM

export interface PriceCurrentResponse {
  token_address: string;
  price_usd: number;
  timestamp: number;
}

export interface PriceHourResponse {
  token_address: string;
  timestamp: number;
  price_usd: number;
  interval: string;
}

export interface TopHolder {
  holder_address: string;
  balance: string;
  balance_usd: number;
  percentage: number;
}

export interface TopHoldersResponse {
  token_address: string;
  holders: TopHolder[];
  total_holders: number;
  top_10_concentration: number;
}

export interface AerodromePool {
  pool_address: string;
  token0_address: string;
  token0_symbol: string;
  token1_address: string;
  token1_symbol: string;
  pool_type: 'stable' | 'volatile';
  tvl_usd: number;
  volume_24h: number;
  volume_7d: number;
  fee_apr: number;
  swap_count_24h: number;
  unique_swappers_24h: number;
  fees_24h: number;
  created_at: number;
}

export interface AerodromePoolsResponse {
  pools: AerodromePool[];
  total_pools: number;
}

export interface UniswapV3Pool {
  pool_address: string;
  token0_address: string;
  token0_symbol: string;
  token0_decimals: number;
  token1_address: string;
  token1_symbol: string;
  token1_decimals: number;
  fee_tier: number;
  tvl_usd: number;
  volume_24h: number;
  volume_1h: number;
  volume_7d: number;
  swap_count_24h: number;
  unique_users_24h: number;
  created_timestamp: number;
  fee_apr?: number; // Annual Percentage Rate from fees
}

export interface UniswapV3PoolsResponse {
  pools: UniswapV3Pool[];
  total_count: number;
}

export interface Chain {
  chain_id: number;
  chain_name: string;
  native_currency: string;
  rpc_url?: string;
}

export interface ChainsResponse {
  chains: Chain[];
}

export interface Token {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  chain_id: number;
}

export interface TokensResponse {
  tokens: Token[];
  total_count: number;
}

export interface DEX {
  dex_name: string;
  dex_type: string;
  chain_id: number;
  factory_address?: string;
}

export interface DexesResponse {
  dexes: DEX[];
}

// Dashboard aggregate type
export interface TokenDashboardData {
  tokenAddress: string;
  tokenInfo?: Token;
  currentPrice?: PriceCurrentResponse;
  priceHistory?: PriceHourResponse[];
  topHolders?: TopHoldersResponse;
  aerodomePools?: AerodromePool[];
  uniswapPools?: UniswapV3Pool[];
  otherPools?: UniswapV3Pool[];
}
