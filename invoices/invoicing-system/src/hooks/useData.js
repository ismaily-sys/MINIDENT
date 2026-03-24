import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for fetching data with loading and error states
 * Includes automatic re-fetch capability
 */
export const useData = (fetchFunction, dependencies = []) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchFunction();
      setData(result);
    } catch (err) {
      setError(err.message || 'An error occurred');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  }, [fetchFunction]);

  useEffect(() => {
    fetchData();
  }, dependencies);

  return { data, loading, error, refetch: fetchData, setData };
};