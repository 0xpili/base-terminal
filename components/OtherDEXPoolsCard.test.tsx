import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import OtherDEXPoolsCard from './OtherDEXPoolsCard';
import type { UniswapV3Pool } from '@/types/cambrian';

describe('OtherDEXPoolsCard', () => {
  const mockUniswapPool: UniswapV3Pool = {
    pool_address: '0x1234567890abcdef1234567890abcdef12345678',
    token0_address: '0xabcdef1234567890abcdef1234567890abcdef12',
    token0_symbol: 'WETH',
    token0_decimals: 18,
    token1_address: '0xfedcba0987654321fedcba0987654321fedcba09',
    token1_symbol: 'USDC',
    token1_decimals: 6,
    fee_tier: 3000,
    tvl_usd: 1500000,
    volume_24h: 250000,
    volume_1h: 10000,
    volume_7d: 1750000,
    swap_count_24h: 1234,
    unique_users_24h: 567,
    created_timestamp: 1699999999,
  };

  const mockPancakePool: UniswapV3Pool = {
    pool_address: '0xfedcba0987654321fedcba0987654321fedcba09',
    token0_address: '0x1111111111111111111111111111111111111111',
    token0_symbol: 'CAKE',
    token0_decimals: 18,
    token1_address: '0x2222222222222222222222222222222222222222',
    token1_symbol: 'BUSD',
    token1_decimals: 18,
    fee_tier: 2500,
    tvl_usd: 850000,
    volume_24h: 120000,
    volume_1h: 5000,
    volume_7d: 840000,
    swap_count_24h: 890,
    unique_users_24h: 234,
    created_timestamp: 1699999999,
  };

  const mockSushiPool: UniswapV3Pool = {
    pool_address: '0x3333333333333333333333333333333333333333',
    token0_address: '0x4444444444444444444444444444444444444444',
    token0_symbol: 'SUSHI',
    token0_decimals: 18,
    token1_address: '0x5555555555555555555555555555555555555555',
    token1_symbol: 'WETH',
    token1_decimals: 18,
    fee_tier: 3000,
    tvl_usd: 2500000,
    volume_24h: 350000,
    volume_1h: 15000,
    volume_7d: 2450000,
    swap_count_24h: 1500,
    unique_users_24h: 750,
    created_timestamp: 1699999999,
  };

  const mockAlienPool: UniswapV3Pool = {
    pool_address: '0x6666666666666666666666666666666666666666',
    token0_address: '0x7777777777777777777777777777777777777777',
    token0_symbol: 'ALN',
    token0_decimals: 18,
    token1_address: '0x8888888888888888888888888888888888888888',
    token1_symbol: 'USDC',
    token1_decimals: 6,
    fee_tier: 500,
    tvl_usd: 750000,
    volume_24h: 95000,
    volume_1h: 4000,
    volume_7d: 665000,
    swap_count_24h: 650,
    unique_users_24h: 180,
    created_timestamp: 1699999999,
  };

  describe('Empty State', () => {
    it('should render empty state when no pools provided', () => {
      render(<OtherDEXPoolsCard />);

      expect(screen.getByText(/OTHER_DEXs/i)).toBeInTheDocument();
      expect(screen.getByText(/No additional DEX pool data available/i)).toBeInTheDocument();
    });

    it('should render empty state when both arrays are empty', () => {
      render(<OtherDEXPoolsCard uniswapPools={[]} pancakePools={[]} />);

      expect(screen.getByText(/No additional DEX pool data available/i)).toBeInTheDocument();
    });
  });

  describe('Rendering Pools Data', () => {
    it('should render Uniswap pools correctly', () => {
      render(<OtherDEXPoolsCard uniswapPools={[mockUniswapPool]} />);

      // Check for pool pair
      expect(screen.getByText('WETH/USDC')).toBeInTheDocument();

      // Check for DEX badge
      expect(screen.getByText('Uniswap V3')).toBeInTheDocument();

      // Check for pool address (formatted)
      expect(screen.getByText(/0x1234\.\.\.5678/i)).toBeInTheDocument();

      // Check for TVL (appears in both summary and table)
      expect(screen.getAllByText('$1.50M').length).toBeGreaterThan(0);

      // Check for fee tier
      expect(screen.getByText('0.30%')).toBeInTheDocument();
    });

    it('should render PancakeSwap pools correctly', () => {
      render(<OtherDEXPoolsCard pancakePools={[mockPancakePool]} />);

      // Check for pool pair
      expect(screen.getByText('CAKE/BUSD')).toBeInTheDocument();

      // Check for DEX badge
      expect(screen.getByText('PancakeSwap V3')).toBeInTheDocument();
    });

    it('should render Sushi pools correctly', () => {
      render(<OtherDEXPoolsCard sushiPools={[mockSushiPool]} />);

      // Check for pool pair
      expect(screen.getByText('SUSHI/WETH')).toBeInTheDocument();

      // Check for DEX badge
      expect(screen.getByText('Sushi V3')).toBeInTheDocument();

      // Check for TVL
      expect(screen.getAllByText('$2.50M').length).toBeGreaterThan(0);
    });

    it('should render Alien pools correctly', () => {
      render(<OtherDEXPoolsCard alienPools={[mockAlienPool]} />);

      // Check for pool pair
      expect(screen.getByText('ALN/USDC')).toBeInTheDocument();

      // Check for DEX badge
      expect(screen.getByText('Alien V3')).toBeInTheDocument();

      // Check for TVL
      expect(screen.getAllByText('$750.00K').length).toBeGreaterThan(0);
    });

    it('should render all four DEX pools together', () => {
      render(
        <OtherDEXPoolsCard
          uniswapPools={[mockUniswapPool]}
          pancakePools={[mockPancakePool]}
          sushiPools={[mockSushiPool]}
          alienPools={[mockAlienPool]}
        />
      );

      // Check for all pool pairs
      expect(screen.getByText('WETH/USDC')).toBeInTheDocument();
      expect(screen.getByText('CAKE/BUSD')).toBeInTheDocument();
      expect(screen.getByText('SUSHI/WETH')).toBeInTheDocument();
      expect(screen.getByText('ALN/USDC')).toBeInTheDocument();

      // Check for all DEX badges
      expect(screen.getByText('Uniswap V3')).toBeInTheDocument();
      expect(screen.getByText('PancakeSwap V3')).toBeInTheDocument();
      expect(screen.getByText('Sushi V3')).toBeInTheDocument();
      expect(screen.getByText('Alien V3')).toBeInTheDocument();

      // Check footer shows correct count
      expect(screen.getByText(/Showing 4 pools/i)).toBeInTheDocument();
    });

    it('should render N/A for missing fee tier', () => {
      const poolWithoutFee: UniswapV3Pool = {
        ...mockUniswapPool,
        fee_tier: 0,
      };

      render(<OtherDEXPoolsCard uniswapPools={[poolWithoutFee]} />);

      expect(screen.getByText('N/A')).toBeInTheDocument();
    });

    it('should filter out pools with no meaningful data', () => {
      const poolWithZeros: UniswapV3Pool = {
        ...mockUniswapPool,
        tvl_usd: 0,
        volume_24h: 0,
        swap_count_24h: 0,
        fee_tier: 0,  // All values must be 0 to filter
        fee_apr: undefined,  // No fee APR either
      };

      render(<OtherDEXPoolsCard uniswapPools={[poolWithZeros]} />);

      // Should show empty state since pool has no meaningful data
      expect(screen.getByText(/No additional DEX pool data available/i)).toBeInTheDocument();
    });
  });

  describe('TVL Display', () => {
    it('should display individual pool TVLs correctly', () => {
      render(
        <OtherDEXPoolsCard
          uniswapPools={[mockUniswapPool]}
          pancakePools={[mockPancakePool]}
        />
      );

      // Individual pool TVLs should be displayed
      expect(screen.getByText('$1.50M')).toBeInTheDocument();
      expect(screen.getByText('$850.00K')).toBeInTheDocument();
    });

    it('should handle missing TVL values in display', () => {
      const poolWithoutTVL: UniswapV3Pool = {
        ...mockUniswapPool,
        tvl_usd: 0,
      };

      render(
        <OtherDEXPoolsCard
          uniswapPools={[poolWithoutTVL]}
          pancakePools={[mockPancakePool]}
        />
      );

      // Should show $0.00 for pool without TVL and correct value for pancake pool
      expect(screen.getByText('$850.00K')).toBeInTheDocument();
    });

  });

  describe('UI Elements', () => {
    it('should render the header correctly', () => {
      render(<OtherDEXPoolsCard uniswapPools={[mockUniswapPool]} />);

      expect(screen.getByText(/OTHER_DEXs/i)).toBeInTheDocument();
    });

    it('should render table headers', () => {
      render(<OtherDEXPoolsCard uniswapPools={[mockUniswapPool]} />);

      expect(screen.getByText('[POOL]')).toBeInTheDocument();
      expect(screen.getByText('[DEX]')).toBeInTheDocument();
      expect(screen.getByText('[TVL]')).toBeInTheDocument();
      expect(screen.getByText('[FEE APR]')).toBeInTheDocument();
    });

    it('should render footer with correct pool count (singular)', () => {
      render(<OtherDEXPoolsCard uniswapPools={[mockUniswapPool]} />);

      expect(screen.getByText(/Showing 1 pool/i)).toBeInTheDocument();
    });

    it('should render footer with correct pool count (plural)', () => {
      render(
        <OtherDEXPoolsCard
          uniswapPools={[mockUniswapPool]}
          pancakePools={[mockPancakePool]}
        />
      );

      expect(screen.getByText(/Showing 2 pools/i)).toBeInTheDocument();
    });
  });

  describe('Multiple Pools', () => {
    it('should render multiple pools from the same DEX', () => {
      const secondUniswapPool: UniswapV3Pool = {
        ...mockUniswapPool,
        pool_address: '0x9999999999999999999999999999999999999999',
        token0_symbol: 'DAI',
        token1_symbol: 'USDT',
      };

      render(<OtherDEXPoolsCard uniswapPools={[mockUniswapPool, secondUniswapPool]} />);

      expect(screen.getByText('WETH/USDC')).toBeInTheDocument();
      expect(screen.getByText('DAI/USDT')).toBeInTheDocument();
      expect(screen.getByText(/Showing 2 pools/i)).toBeInTheDocument();
    });

    it('should render many pools correctly', () => {
      const pools = Array.from({ length: 10 }, (_, i) => ({
        ...mockUniswapPool,
        pool_address: `0x${i.toString().repeat(40)}`,
        token0_symbol: `TOKEN${i}`,
      }));

      render(<OtherDEXPoolsCard uniswapPools={pools} />);

      expect(screen.getByText(/Showing 10 pools/i)).toBeInTheDocument();
    });
  });
});
