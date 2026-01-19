import { useState, useEffect, useMemo } from 'react';
import { parseCSV, preprocessData } from './utils';

/**
 * Custom hook to fetch and process Google Sheet data
 * Fetches data from public Google Sheet via CSV export
 * Auto-updates every 5 minutes
 */
const useGoogleSheetData = () => {
  const [rawData, setRawData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Google Sheet ID from the URL
  const SHEET_ID = '1a5bFYy6IFBEDP6cHkiKq9K0OwfGCgoFSVlg4oYQbUrk';
  const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv`;

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(CSV_URL);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`);
      }

      const csvText = await response.text();
      
      if (!csvText || csvText.trim() === '') {
        throw new Error('Empty response from Google Sheet');
      }

      const parsed = parseCSV(csvText);
      
      if (parsed.length === 0) {
        throw new Error('No data found in Google Sheet');
      }

      setRawData(parsed);
      setLastUpdated(new Date());
      setLoading(false);
    } catch (err) {
      console.error('Error fetching Google Sheet data:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchData();

    // Auto-refresh every 5 minutes
    const interval = setInterval(() => {
      fetchData();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  // Process data with memoization
  const processedData = useMemo(() => {
    if (rawData.length === 0) {
      return { agents: {}, allRecords: [] };
    }
    return preprocessData(rawData);
  }, [rawData]);

  return {
    data: processedData,
    loading,
    error,
    lastUpdated,
    refresh: fetchData
  };
};

export default useGoogleSheetData;
