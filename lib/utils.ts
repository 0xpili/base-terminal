// Utility functions for the terminal dashboard

export function formatCurrency(value: number, decimals: number = 2): string {
  if (value >= 1_000_000_000) {
    return `$${(value / 1_000_000_000).toFixed(decimals)}B`;
  }
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(decimals)}M`;
  }
  if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(decimals)}K`;
  }
  // For very small values, show all significant digits
  if (value > 0 && value < 0.0001) {
    // Count leading zeros after decimal point and show meaningful digits
    const str = value.toFixed(20);
    const match = str.match(/^0\.(0*)([1-9]\d{0,3})/);
    if (match) {
      const zeros = match[1].length;
      const significantDigits = match[2];
      return `$0.${'0'.repeat(zeros)}${significantDigits}`;
    }
  }
  return `$${value.toFixed(decimals)}`;
}

export function formatNumber(value: number, decimals: number = 2): string {
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(decimals)}B`;
  }
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(decimals)}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(decimals)}K`;
  }
  return value.toFixed(decimals);
}

export function formatPercent(value: number, decimals: number = 2): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(decimals)}%`;
}

export function formatAddress(address: string, chars: number = 4): string {
  if (address.length <= chars * 2 + 2) {
    return address;
  }
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

export function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  return date.toLocaleString();
}

export function getChangeColor(value: number): string {
  if (value > 0) return 'text-terminal-success';
  if (value < 0) return 'text-terminal-error';
  return 'text-terminal-textDim';
}

export function getChangeIcon(value: number): string {
  if (value > 0) return '▲';
  if (value < 0) return '▼';
  return '▬';
}

export function calculatePriceChange(
  current: number,
  previous: number
): number {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
}

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text);
}

export function getBaseScanUrl(address: string, type: 'address' | 'token' | 'tx' = 'address'): string {
  return `https://basescan.org/${type}/${address}`;
}
