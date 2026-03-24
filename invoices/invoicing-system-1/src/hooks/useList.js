import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for managing a list of invoices with CRUD operations
 * Includes optimistic UI updates
 */
export const useList = (service) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all invoices
  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await service.getAll();
      setItems(data);
    } catch (err) {
      setError(err.message || 'An error occurred while fetching invoices');
      console.error('Error fetching invoices:', err);
    } finally {
      setLoading(false);
    }
  }, [service]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Create with optimistic update
  const create = async (data) => {
    const tempId = 'temp-' + Date.now();
    const optimisticItem = { id: tempId, ...data };
    
    // Optimistic update
    setItems(prev => [optimisticItem, ...prev]);
    
    try {
      const newItem = await service.create(data);
      // Replace temp with real data
      setItems(prev => prev.map(item => item.id === tempId ? newItem : item));
      return newItem;
    } catch (err) {
      // Revert on error
      setItems(prev => prev.filter(item => item.id !== tempId));
      throw err;
    }
  };

  // Update with optimistic update
  const update = async (id, data) => {
    const previousItems = items;
    
    // Optimistic update
    setItems(prev => prev.map(item => item.id === id ? { ...item, ...data } : item));
    
    try {
      const updatedItem = await service.update(id, data);
      setItems(prev => prev.map(item => item.id === id ? updatedItem : item));
      return updatedItem;
    } catch (err) {
      // Revert on error
      setItems(previousItems);
      throw err;
    }
  };

  // Delete with optimistic update
  const remove = async (id) => {
    const previousItems = items;
    
    // Optimistic update
    setItems(prev => prev.filter(item => item.id !== id));
    
    try {
      await service.delete(id);
    } catch (err) {
      // Revert on error
      setItems(previousItems);
      throw err;
    }
  };

  return {
    items,
    loading,
    error,
    refetch: fetchItems,
    create,
    update,
    remove,
  };
};