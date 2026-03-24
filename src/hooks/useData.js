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
      setError(err.message || 'Une erreur est survenue');
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
      setError(err.message || 'Une erreur est survenue');
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

/**
 * Custom hook for form state management
 */
export const useForm = (initialValues = {}, onSubmit) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues(prev => ({ ...prev, [name]: value }));
    // Clear error when field is modified
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const setValue = (name, value) => {
    setValues(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validate = (rules) => {
    const newErrors = {};
    
    Object.entries(rules).forEach(([field, fieldRules]) => {
      const value = values[field];
      
      if (fieldRules.required && !value?.toString().trim()) {
        newErrors[field] = 'Ce champ est requis';
      }
      if (fieldRules.email && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        newErrors[field] = 'Email invalide';
      }
      if (fieldRules.minLength && value?.length < fieldRules.minLength) {
        newErrors[field] = `Minimum ${fieldRules.minLength} caractères`;
      }
      if (fieldRules.min && Number(value) < fieldRules.min) {
        newErrors[field] = `La valeur minimum est ${fieldRules.min}`;
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (onSubmit) {
      setSubmitting(true);
      try {
        await onSubmit(values);
      } finally {
        setSubmitting(false);
      }
    }
  };

  const reset = () => {
    setValues(initialValues);
    setErrors({});
  };

  return {
    values,
    errors,
    submitting,
    handleChange,
    setValue,
    setErrors,
    validate,
    handleSubmit,
    reset,
  };
};

export default { useData, useList, useForm };
