import { isEmail } from 'validator';

/**
 * Validates the invoice form fields
 * @param {Object} values - The form values
 * @returns {Object} - An object containing validation errors
 */
export const validateInvoiceForm = (values) => {
  const errors = {};

  if (!values.patientId) {
    errors.patientId = 'Patient is required';
  }

  if (!values.treatments || values.treatments.length === 0) {
    errors.treatments = 'At least one treatment is required';
  }

  if (values.total <= 0) {
    errors.total = 'Total amount must be greater than zero';
  }

  return errors;
};

/**
 * Validates patient data
 * @param {Object} patient - The patient data
 * @returns {Object} - An object containing validation errors
 */
export const validatePatientData = (patient) => {
  const errors = {};

  if (!patient.name) {
    errors.name = 'Name is required';
  }

  if (!isEmail(patient.email)) {
    errors.email = 'Invalid email address';
  }

  return errors;
};

/**
 * Validates treatment data
 * @param {Object} treatment - The treatment data
 * @returns {Object} - An object containing validation errors
 */
export const validateTreatmentData = (treatment) => {
  const errors = {};

  if (!treatment.description) {
    errors.description = 'Description is required';
  }

  if (treatment.cost <= 0) {
    errors.cost = 'Cost must be greater than zero';
  }

  return errors;
};