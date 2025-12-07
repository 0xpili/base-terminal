import { convertToCSV, formatDateForCSV } from './csv-utils';

describe('CSV Utilities', () => {
  describe('convertToCSV', () => {
    it('should convert simple array of objects to CSV', () => {
      const data = [
        { name: 'Alice', age: 30, city: 'New York' },
        { name: 'Bob', age: 25, city: 'San Francisco' },
      ];

      const csv = convertToCSV(data);
      const lines = csv.split('\n');

      expect(lines[0]).toBe('name,age,city');
      expect(lines[1]).toBe('Alice,30,New York');
      expect(lines[2]).toBe('Bob,25,San Francisco');
    });

    it('should handle fields with commas by wrapping in quotes', () => {
      const data = [
        { name: 'Smith, John', value: 100 },
      ];

      const csv = convertToCSV(data);
      const lines = csv.split('\n');

      expect(lines[1]).toBe('"Smith, John",100');
    });

    it('should handle fields with quotes by escaping them', () => {
      const data = [
        { name: 'John "Johnny" Doe', value: 100 },
      ];

      const csv = convertToCSV(data);
      const lines = csv.split('\n');

      expect(lines[1]).toBe('"John ""Johnny"" Doe",100');
    });

    it('should handle fields with newlines', () => {
      const data = [
        { description: 'Line 1\nLine 2', value: 100 },
      ];

      const csv = convertToCSV(data);

      // Check that the field is properly wrapped in quotes
      expect(csv).toContain('"Line 1\nLine 2"');
      expect(csv).toContain(',100');
    });

    it('should handle null and undefined values', () => {
      const data = [
        { name: 'Alice', age: null, city: undefined },
      ];

      const csv = convertToCSV(data);
      const lines = csv.split('\n');

      expect(lines[1]).toBe('Alice,,');
    });

    it('should handle empty array', () => {
      const data: any[] = [];
      const csv = convertToCSV(data);

      expect(csv).toBe('');
    });

    it('should use custom headers when provided', () => {
      const data = [
        { firstName: 'Alice', lastName: 'Smith', age: 30 },
      ];

      const headers = [
        { key: 'firstName' as const, label: 'First Name' },
        { key: 'lastName' as const, label: 'Last Name' },
        { key: 'age' as const, label: 'Age' },
      ];

      const csv = convertToCSV(data, headers);
      const lines = csv.split('\n');

      expect(lines[0]).toBe('First Name,Last Name,Age');
      expect(lines[1]).toBe('Alice,Smith,30');
    });

    it('should handle numbers and booleans correctly', () => {
      const data = [
        { name: 'Test', count: 42, active: true, price: 99.99 },
      ];

      const csv = convertToCSV(data);
      const lines = csv.split('\n');

      expect(lines[1]).toBe('Test,42,true,99.99');
    });

    it('should handle objects with different key orders', () => {
      const data = [
        { a: 1, b: 2, c: 3 },
        { a: 4, b: 5, c: 6 },
      ];

      const csv = convertToCSV(data);
      const lines = csv.split('\n');

      expect(lines[0]).toBe('a,b,c');
      expect(lines[1]).toBe('1,2,3');
      expect(lines[2]).toBe('4,5,6');
    });

    it('should handle token pool data structure', () => {
      const data = [
        {
          DEX: 'Uniswap V3',
          Pool: 'WETH/USDC',
          'Pool Address': '0x1234567890abcdef',
          'TVL (USD)': 1500000,
          '24h Volume (USD)': 250000,
        },
      ];

      const csv = convertToCSV(data);
      const lines = csv.split('\n');

      expect(lines[0]).toBe('DEX,Pool,Pool Address,TVL (USD),24h Volume (USD)');
      expect(lines[1]).toBe('Uniswap V3,WETH/USDC,0x1234567890abcdef,1500000,250000');
    });

    it('should handle holder data structure', () => {
      const data = [
        {
          Rank: 1,
          'Holder Address': '0xabcdef1234567890',
          Balance: '1000000',
          'Balance (USD)': 50000,
          'Percentage (%)': 5.1234,
        },
      ];

      const csv = convertToCSV(data);
      const lines = csv.split('\n');

      expect(lines[0]).toBe('Rank,Holder Address,Balance,Balance (USD),Percentage (%)');
      expect(lines[1]).toBe('1,0xabcdef1234567890,1000000,50000,5.1234');
    });
  });

  describe('formatDateForCSV', () => {
    it('should format unix timestamp to ISO string', () => {
      const timestamp = 1700000000; // Unix timestamp in seconds
      const formatted = formatDateForCSV(timestamp);

      expect(formatted).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it('should handle timestamp 0 or negative as invalid', () => {
      expect(formatDateForCSV(0)).toBe('Invalid Date');
      expect(formatDateForCSV(-1)).toBe('Invalid Date');
    });

    it('should handle NaN as invalid', () => {
      expect(formatDateForCSV(NaN)).toBe('Invalid Date');
    });

    it('should handle undefined/null as invalid', () => {
      expect(formatDateForCSV(undefined as any)).toBe('Invalid Date');
      expect(formatDateForCSV(null as any)).toBe('Invalid Date');
    });

    it('should produce valid ISO 8601 format', () => {
      const timestamp = 1699999999;
      const formatted = formatDateForCSV(timestamp);
      const date = new Date(formatted);

      expect(date.toISOString()).toBe(formatted);
    });

    it('should auto-detect milliseconds vs seconds', () => {
      const timestampSeconds = 1700000000; // in seconds
      const timestampMillis = 1700000000000; // in milliseconds

      const formattedSeconds = formatDateForCSV(timestampSeconds);
      const formattedMillis = formatDateForCSV(timestampMillis);

      // Both should produce valid dates
      expect(formattedSeconds).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      expect(formattedMillis).toMatch(/^\d{4}-\d{2}-\d{2}T/);

      // They should be the same date
      expect(formattedSeconds).toBe(formattedMillis);
    });
  });

  describe('CSV Integration', () => {
    it('should create valid CSV for complete pool dataset', () => {
      const pools = [
        {
          DEX: 'Uniswap V3',
          Pool: 'WETH/USDC',
          'Pool Address': '0x1234567890abcdef1234567890abcdef12345678',
          'TVL (USD)': 1500000,
          '24h Volume (USD)': 250000,
          'Fee (%)': '0.3000',
        },
        {
          DEX: 'PancakeSwap',
          Pool: 'CAKE/BUSD',
          'Pool Address': '0xfedcba0987654321fedcba0987654321fedcba09',
          'TVL (USD)': 850000,
          '24h Volume (USD)': 120000,
          'Fee (%)': '0.2500',
        },
      ];

      const csv = convertToCSV(pools);
      const lines = csv.split('\n');

      expect(lines.length).toBe(3); // Header + 2 data rows
      expect(lines[0]).toContain('DEX');
      expect(lines[0]).toContain('Pool');
      expect(lines[1]).toContain('Uniswap V3');
      expect(lines[2]).toContain('PancakeSwap');
    });

    it('should handle price history data', () => {
      const priceHistory = [
        {
          Timestamp: '2024-01-01T00:00:00.000Z',
          'Unix Timestamp': 1704067200,
          'Price (USD)': 2500.50,
          Interval: '1h',
        },
        {
          Timestamp: '2024-01-01T01:00:00.000Z',
          'Unix Timestamp': 1704070800,
          'Price (USD)': 2505.75,
          Interval: '1h',
        },
      ];

      const csv = convertToCSV(priceHistory);
      const lines = csv.split('\n');

      expect(lines.length).toBe(3);
      expect(lines[0]).toBe('Timestamp,Unix Timestamp,Price (USD),Interval');
      expect(lines[1]).toContain('2024-01-01T00:00:00.000Z');
      expect(lines[2]).toContain('2505.75');
    });
  });
});
