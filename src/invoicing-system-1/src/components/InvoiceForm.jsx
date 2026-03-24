import React, { useState, useEffect } from 'react';
import { useForm } from '../hooks/useForm';
import { useList } from '../hooks/useList';
import { invoiceService } from '../services/invoiceService';
import { patientService } from '../services/patientService';
import { treatmentService } from '../services/treatmentService';

const InvoiceForm = () => {
  const [patients, setPatients] = useState([]);
  const [treatments, setTreatments] = useState([]);
  const [selectedTreatments, setSelectedTreatments] = useState([]);
  const { values, handleChange, handleSubmit, reset } = useForm(
    { patientId: '', treatmentIds: [] },
    handleInvoiceCreation
  );

  const { items: patientList, refetch: refetchPatients } = useList(patientService);
  const { items: treatmentList, refetch: refetchTreatments } = useList(treatmentService);

  useEffect(() => {
    refetchPatients();
    refetchTreatments();
  }, [refetchPatients, refetchTreatments]);

  useEffect(() => {
    setPatients(patientList);
    setTreatments(treatmentList);
  }, [patientList, treatmentList]);

  const handleInvoiceCreation = async (formData) => {
    const totalAmount = calculateTotal(selectedTreatments);
    await invoiceService.createInvoice({
      patient_id: formData.patientId,
      treatment_ids: selectedTreatments.map(t => t.id),
      total: totalAmount,
    });
    reset();
    setSelectedTreatments([]);
  };

  const calculateTotal = (treatments) => {
    return treatments.reduce((total, treatment) => total + treatment.price, 0);
  };

  const handleTreatmentSelect = (treatment) => {
    setSelectedTreatments(prev => [...prev, treatment]);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="patientId">Select Patient:</label>
        <select name="patientId" onChange={handleChange} required>
          <option value="">Select a patient</option>
          {patients.map(patient => (
            <option key={patient.id} value={patient.id}>
              {patient.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <h3>Select Treatments:</h3>
        {treatments.map(treatment => (
          <div key={treatment.id}>
            <input
              type="checkbox"
              id={treatment.id}
              onChange={() => handleTreatmentSelect(treatment)}
            />
            <label htmlFor={treatment.id}>{treatment.name} - ${treatment.price}</label>
          </div>
        ))}
      </div>
      <button type="submit">Create Invoice</button>
    </form>
  );
};

export default InvoiceForm;