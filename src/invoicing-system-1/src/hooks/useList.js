import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for managing a list with CRUD operations
 * Includes optimistic UI updates
 */
export const useList = (service, clinicId) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all items
  const fetchItems = useCallback(async () => {
    if (!clinicId) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await service.getAll(clinicId);
      setItems(data);
    } catch (err) {
      setError(err.message || 'An error occurred');
      console.error('Error fetching items:', err);
    } finally {
      setLoading(false);
    }
  }, [service, clinicId]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Create with optimistic update
  const create = async (data) => {
    const tempId = 'temp-' + Date.now();
    const optimisticItem = { id: tempId, ...data, clinic_id: clinicId };
    
    // Optimistic update
    setItems(prev => [optimisticItem, ...prev]);
    
    try {
      const newItem = await service.create(clinicId, data);
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
      const updatedItem = await service.update(clinicId, id, data);
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
      await service.delete(clinicId, id);
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