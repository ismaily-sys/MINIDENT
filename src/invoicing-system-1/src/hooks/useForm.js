import { useState } from 'react';

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
        newErrors[field] = 'This field is required';
      }
      if (fieldRules.email && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        newErrors[field] = 'Invalid email';
      }
      if (fieldRules.minLength && value?.length < fieldRules.minLength) {
        newErrors[field] = `Minimum ${fieldRules.minLength} characters required`;
      }
      if (fieldRules.min && Number(value) < fieldRules.min) {
        newErrors[field] = `Minimum value is ${fieldRules.min}`;
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