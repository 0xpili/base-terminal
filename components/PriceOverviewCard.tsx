'use client';

import { formatCurrency, formatPercent, getChangeColor, getChangeIcon, calculatePriceChange } from '@/lib/utils';
import type { PriceCurrentResponse, PriceHourResponse } from '@/types/cambrian';

interface PriceOverviewCardProps {
  currentPrice?: PriceCurrentResponse;
  priceHistory?: PriceHourResponse[];
}

export default function PriceOverviewCard({ currentPrice, priceHistory }: PriceOverviewCardProps) {

  if (!currentPrice) {
    return (
      <div className="terminal-card">
        <div className="flex items-center mb-3">
          <span className="text-terminal-textBright mr-2 text-sm">{'>'}</span>
          <h3 className="text-sm font-bold text-terminal-textBright m-0">PRICE_OVERVIEW</h3>
        </div>
        <p className="text-terminal-textDim text-sm">No price data available</p>
      </div>
    );
  }

  const price24hAgo = priceHistory && priceHistory.length > 0
    ? priceHistory[0]?.price_usd
    : currentPrice.price_usd;

  const change24h = calculatePriceChange(currentPrice.price_usd, price24hAgo);

  const getHigh24h = () => {
    if (!priceHistory || priceHistory.length === 0) return currentPrice.price_usd;
    return Math.max(...priceHistory.map(p => p.price_usd), currentPrice.price_usd);
  };

  const getLow24h = () => {
    if (!priceHistory || priceHistory.length === 0) return currentPrice.price_usd;
    return Math.min(...priceHistory.map(p => p.price_usd), currentPrice.price_usd);
  };

  const high24h = getHigh24h();
  const low24h = getLow24h();

  return (
    <div className="terminal-card">
      <div className="flex items-center mb-3">
        <span className="text-terminal-textBright mr-2 text-sm">{'>'}</span>
        <h3 className="text-sm font-bold text-terminal-textBright m-0">PRICE_OVERVIEW</h3>
      </div>

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
