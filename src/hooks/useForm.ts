import { useState } from 'react'

type FieldRules = {
  required?: boolean
  email?: boolean
  minLength?: number
  min?: number
}

type Rules = Record<string, FieldRules>

export const useForm = <T extends Record<string, any>>(
  initialValues: T,
  onSubmit?: (values: T) => Promise<void> | void
) => {
  const [values, setValues] = useState<T>(initialValues)
  const [errors, setErrors] = useState<Record<string, string | null>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [submitting, setSubmitting] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setValues(prev => ({ ...prev, [name]: value }))
    setTouched(prev => ({ ...prev, [name]: true }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }))
    }
  }

  const setValue = (name: string, value: any) => {
    setValues(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }))
    }
  }

  const validate = (rules: Rules): boolean => {
    const newErrors: Record<string, string> = {}

    Object.entries(rules).forEach(([field, fieldRules]) => {
      const value = (values as any)[field]

      if (fieldRules.required && !value?.toString().trim()) {
        newErrors[field] = 'This field is required'
      }
      if (fieldRules.email && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        newErrors[field] = 'Invalid email'
      }
      if (fieldRules.minLength && value?.length < fieldRules.minLength) {
        newErrors[field] = `Minimum ${fieldRules.minLength} characters required`
      }
      if (fieldRules.min !== undefined && Number(value) < fieldRules.min) {
        newErrors[field] = `Minimum value is ${fieldRules.min}`
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent, rules?: Rules) => {
    e.preventDefault()
    if (rules && !validate(rules)) return

    if (onSubmit) {
      setSubmitting(true)
      try {
        await onSubmit(values)
      } finally {
        setSubmitting(false)
      }
    }
  }

  const reset = () => {
    setValues(initialValues)
    setErrors({})
    setTouched({})
  }

  return {
    values,
    errors,
    touched,
    submitting,
    handleChange,
    setValue,
    setErrors,
    validate,
    handleSubmit,
    reset,
  }
}
