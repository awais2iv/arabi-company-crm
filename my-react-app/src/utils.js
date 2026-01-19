// Utility functions for data processing and bilingual support
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility function for merging Tailwind CSS classes
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Detects if text contains Arabic characters
 */
export const isArabic = (text) => {
  if (!text || typeof text !== 'string') return false;
  return /[\u0600-\u06FF]/.test(text);
};

/**
 * Parses CSV text into array of objects
 */
export const parseCSV = (csvText) => {
  const lines = csvText.trim().split('\n');
  if (lines.length === 0) return [];

  const headers = lines[0].split(',').map(h => h.trim());
  const data = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length === headers.length) {
      const row = {};
      headers.forEach((header, index) => {
        row[header] = values[index].trim();
      });
      data.push(row);
    }
  }

  return data;
};

/**
 * Parse a single CSV line handling quoted values
 */
const parseCSVLine = (line) => {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"' && inQuotes && nextChar === '"') {
      current += '"';
      i++;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current);
  return result;
};

/**
 * Converts string value to array if it contains comma-separated values or JSON array
 */
export const parseArrayField = (value) => {
  if (!value || value === '' || value === 'null' || value === 'undefined') {
    return [];
  }

  // Try parsing as JSON array
  if (value.startsWith('[') && value.endsWith(']')) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.map(item => String(item).trim()).filter(Boolean);
      }
    } catch (e) {
      // Continue with comma-separated parsing
    }
  }

  // Parse as comma-separated
  return value
    .split(',')
    .map(item => item.trim())
    .filter(Boolean);
};

/**
 * Sanitizes and normalizes a single value
 */
export const sanitizeValue = (value) => {
  if (value === null || value === undefined || value === '') {
    return '';
  }
  return String(value).trim();
};

/**
 * Preprocesses raw data from Google Sheet
 */
export const preprocessData = (rawData) => {
  if (!Array.isArray(rawData) || rawData.length === 0) {
    return { agents: {}, allRecords: [] };
  }

  // Array fields that need to be converted
  const arrayFields = [
    'key_points',
    'risks',
    'opportunities',
    'positive_signals',
    'negative_signals'
  ];

  const processedData = rawData.map(row => {
    const processed = {};

    // Process each field
    Object.keys(row).forEach(key => {
      const value = sanitizeValue(row[key]);

      if (arrayFields.includes(key)) {
        processed[key] = parseArrayField(value);
      } else {
        processed[key] = value;
      }
    });

    return processed;
  });

  // Group by agent
  const agents = {};
  processedData.forEach(record => {
    const agentName = record['Agent Name'] || 'Unknown';
    if (!agents[agentName]) {
      agents[agentName] = [];
    }
    agents[agentName].push(record);
  });

  return {
    agents,
    allRecords: processedData
  };
};

/**
 * Calculates average of numeric field across records
 */
export const calculateAverage = (records, field) => {
  if (!records || records.length === 0) return 0;

  const values = records
    .map(r => parseFloat(r[field]))
    .filter(v => !isNaN(v));

  if (values.length === 0) return 0;

  const sum = values.reduce((acc, val) => acc + val, 0);
  return (sum / values.length).toFixed(2);
};

/**
 * Counts occurrences of values in a field
 */
export const countOccurrences = (records, field) => {
  const counts = {};

  records.forEach(record => {
    const value = record[field];
    if (value && value !== '') {
      counts[value] = (counts[value] || 0) + 1;
    }
  });

  return counts;
};

/**
 * Counts total occurrences in array fields
 */
export const countArrayOccurrences = (records, field) => {
  const counts = {};

  records.forEach(record => {
    const values = record[field];
    if (Array.isArray(values)) {
      values.forEach(value => {
        if (value && value !== '') {
          counts[value] = (counts[value] || 0) + 1;
        }
      });
    }
  });

  return counts;
};

/**
 * Gets top N items by count
 */
export const getTopItems = (counts, n = 5) => {
  return Object.entries(counts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, n)
    .map(([item, count]) => ({ item, count }));
};

/**
 * Formats percentage
 */
export const formatPercentage = (value) => {
  const num = parseFloat(value);
  return isNaN(num) ? '0%' : `${num.toFixed(1)}%`;
};

/**
 * Gets color based on value (for risk indicators)
 */
export const getRiskColor = (value) => {
  const num = parseFloat(value);
  if (isNaN(num)) return '#6b7280';
  if (num >= 7) return '#dc2626';
  if (num >= 4) return '#f59e0b';
  return '#10b981';
};

/**
 * Gets color based on satisfaction value
 */
export const getSatisfactionColor = (value) => {
  const num = parseFloat(value);
  if (isNaN(num)) return '#6b7280';
  if (num >= 8) return '#10b981';
  if (num >= 5) return '#f59e0b';
  return '#dc2626';
};
