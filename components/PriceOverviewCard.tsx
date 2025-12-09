'use client';

import { formatCurrency, formatPercent, getChangeColor, getChangeIcon, calculatePriceChange, getBaseScanUrl } from '@/lib/utils';
import type { PriceCurrentResponse, PriceHourResponse, Token } from '@/types/cambrian';

interface PriceOverviewCardProps {
  token?: Token;
  currentPrice?: PriceCurrentResponse;
  priceHistory?: PriceHourResponse[];
  onRefresh?: () => void;
}

export default function PriceOverviewCard({ token, currentPrice, priceHistory, onRefresh }: PriceOverviewCardProps) {

  if (!token) {
    return (
      <div className="terminal-card">
        <div className="flex items-center mb-3">
          <span className="text-terminal-textBright mr-2 text-sm">{'>'}</span>
          <h3 className="text-sm font-bold text-terminal-textBright m-0">PRICE_OVERVIEW</h3>
        </div>
        <p className="text-terminal-textDim text-sm">No token data available</p>
      </div>
    );
  }

  const price24hAgo = priceHistory && priceHistory.length > 0
    ? priceHistory[0]?.price_usd
    : currentPrice?.price_usd || 0;

  const change24h = currentPrice ? calculatePriceChange(currentPrice.price_usd, price24hAgo) : 0;

  const getHigh24h = () => {
    if (!currentPrice) return 0;
    if (!priceHistory || priceHistory.length === 0) return currentPrice.price_usd;
    return Math.max(...priceHistory.map(p => p.price_usd), currentPrice.price_usd);
  };

  const getLow24h = () => {
    if (!currentPrice) return 0;
    if (!priceHistory || priceHistory.length === 0) return currentPrice.price_usd;
    return Math.min(...priceHistory.map(p => p.price_usd), currentPrice.price_usd);
  };

  const high24h = getHigh24h();
  const low24h = getLow24h();

  return (
    <div className="terminal-card">
      {/* Token Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h2 className="text-2xl md:text-3xl font-bold text-terminal-textBright mb-1">
            {token.symbol}
          </h2>
          <p className="text-terminal-textDim text-sm">
            {token.name}
          </p>
        </div>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="text-terminal-textDim hover:text-terminal-text transition-colors p-2 rounded hover:bg-terminal-border"
            title="Refresh data"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
              <path d="M3 3v5h5"/>
              <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/>
              <path d="M16 16h5v5"/>
            </svg>
          </button>
        )}
      </div>

      {/* Contract & Decimals */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 mb-4 border-b border-terminal-border">
        <div>
          <div className="text-terminal-textDim text-xs mb-1 uppercase tracking-wide">Contract</div>
          <a
            href={getBaseScanUrl(token.address, 'token')}
            target="_blank"
            rel="noopener noreferrer"
            className="text-terminal-text hover:text-terminal-textBright font-mono text-xs underline break-all"
            title="View token on BaseScan"
          >
            {token.address}
          </a>
        </div>
        <div>
          <div className="text-terminal-textDim text-xs mb-1 uppercase tracking-wide">Decimals</div>
          <span className="text-terminal-text text-sm font-mono">
            {token.decimals}
          </span>
        </div>
      </div>

      {/* Price Section */}
      {currentPrice ? (
        <div className="space-y-3">
          {/* Current Price */}
          <div>
            <div className="text-terminal-textDim text-xs mb-1">[CURRENT_PRICE]</div>
            <div className="text-3xl font-bold text-terminal-textBright">
              {formatCurrency(currentPrice.price_usd, 4)}
            </div>
          </div>

          {/* 24h Change */}
          <div>
            <div className="text-terminal-textDim text-xs mb-1">[24H_CHANGE]</div>
            <div className={`text-xl font-bold ${getChangeColor(change24h)}`}>
              {getChangeIcon(change24h)} {formatPercent(change24h)}
            </div>
          </div>

          {/* 24h High/Low */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-terminal-textDim text-xs mb-1">[24H_HIGH]</div>
              <div className="text-terminal-text text-sm">
                {formatCurrency(high24h, 4)}
              </div>
            </div>
            <div>
              <div className="text-terminal-textDim text-xs mb-1">[24H_LOW]</div>
              <div className="text-terminal-text text-sm">
                {formatCurrency(low24h, 4)}
              </div>
            </div>
          </div>

          {/* Simple ASCII Chart */}
          {priceHistory && priceHistory.length > 0 && (
            <div className="mt-3">
              <div className="text-terminal-textDim text-xs mb-1.5">[24H_CHART]</div>
              <div className="h-20 border border-terminal-border rounded p-1.5 relative">
                <SimpleChart data={priceHistory} />
              </div>
            </div>
          )}

          {/* Last Update */}
          <div className="text-terminal-textDim text-xs pt-2 border-t border-terminal-border">
            {'>'} {new Date(currentPrice.timestamp * 1000).toLocaleTimeString()}
          </div>
        </div>
      ) : (
        <p className="text-terminal-textDim text-sm">No price data available</p>
      )}
    </div>
  );
}

// Simple SVG-based chart component
function SimpleChart({ data }: { data: PriceHourResponse[] }) {
  if (data.length === 0) return null;

  const prices = data.map(d => d.price_usd);
  const max = Math.max(...prices);
  const min = Math.min(...prices);
  const range = max - min;

  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = range === 0 ? 50 : 100 - ((d.price_usd - min) / range) * 100;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="text-terminal-text"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
