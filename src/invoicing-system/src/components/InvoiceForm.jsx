import React, { useState } from 'react';
import { useForm } from '../hooks/useForm';
import { useList } from '../hooks/useList';
import { invoiceService } from '../services/invoiceService';
import PatientSelect from './PatientSelect';

const InvoiceForm = () => {
  const { items: treatments } = useList(treatmentService);
  const [selectedTreatments, setSelectedTreatments] = useState([]);
  
  const { values, handleChange, handleSubmit, reset } = useForm(
    { patientId: '', total: 0 },
    async (formData) => {
      const invoiceData = {
        patient_id: formData.patientId,
        treatments: selectedTreatments,
        total: calculateTotal(),
      };
      await invoiceService.create(invoiceData);
      reset();
      setSelectedTreatments([]);
    }
  );

  const calculateTotal = () => {
    return selectedTreatments.reduce((total, treatment) => total + treatment.price, 0);
  };

  const handleTreatmentSelect = (treatment) => {
    setSelectedTreatments(prev => [...prev, treatment]);
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Create Invoice</h2>
      <PatientSelect onChange={handleChange} />
      <div>
        <h3>Treatments</h3>
        {treatments.map(treatment => (
          <div key={treatment.id}>
            <input
              type="checkbox"
              onChange={() => handleTreatmentSelect(treatment)}
            />
            {treatment.name} - ${treatment.price}
          </div>
        ))}
      </div>
      <div>
        <strong>Total: ${calculateTotal()}</strong>
      </div>
      <button type="submit">Generate Invoice</button>
    </form>
  );
};

export default InvoiceForm;