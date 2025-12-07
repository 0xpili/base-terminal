// CSV utility functions for data export

/**
 * Escapes a CSV field value by wrapping it in quotes if it contains special characters
 */
function escapeCSVField(field: any): string {
  if (field === null || field === undefined) {
    return '';
  }

  const stringValue = String(field);

  // If field contains comma, quote, or newline, wrap in quotes and escape internal quotes
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}

/**
 * Converts an array of objects to CSV format
 * @param data - Array of objects to convert
 * @param headers - Optional custom headers. If not provided, will use object keys
 * @returns CSV string
 */
export function convertToCSV<T extends Record<string, any>>(
  data: T[],
  headers?: { key: keyof T; label: string }[]
): string {
  if (!data || data.length === 0) {
    return '';
  }

  // Determine headers
  let csvHeaders: { key: keyof T; label: string }[];

  if (headers) {
    csvHeaders = headers;
  } else {
    // Auto-generate headers from first object's keys
    const firstItem = data[0];
    csvHeaders = Object.keys(firstItem).map(key => ({
      key: key as keyof T,
      label: key,
    }));
  }

  // Create header row
  const headerRow = csvHeaders.map(h => escapeCSVField(h.label)).join(',');

  // Create data rows
  const dataRows = data.map(item => {
    return csvHeaders
      .map(h => escapeCSVField(item[h.key]))
      .join(',');
  });

  // Combine header and data rows
  return [headerRow, ...dataRows].join('\n');
}

/**
 * Triggers a browser download of CSV data
 * @param csvData - CSV string to download
 * @param filename - Name of the file (without .csv extension)
 */
export function downloadCSV(csvData: string, filename: string): void {
  // Create blob with UTF-8 BOM for Excel compatibility
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvData], { type: 'text/csv;charset=utf-8;' });

  // Create download link
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up
  URL.revokeObjectURL(url);
}

/**
 * Formats a date for CSV export
 * @param timestamp - Unix timestamp in seconds
 */
export function formatDateForCSV(timestamp: number): string {
  // Handle invalid timestamps
  if (!timestamp || isNaN(timestamp) || timestamp <= 0) {
    return 'Invalid Date';
  }

  // If timestamp seems to be in milliseconds (very large number), convert it
  const ts = timestamp > 10000000000 ? timestamp : timestamp * 1000;

  const date = new Date(ts);

  // Check if date is valid
  if (isNaN(date.getTime())) {
    return 'Invalid Date';
  }

  return date.toISOString();
}
