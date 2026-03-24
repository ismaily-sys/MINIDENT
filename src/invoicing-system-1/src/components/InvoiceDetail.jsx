import React from 'react';
import { useParams } from 'react-router-dom';
import { useData } from '../hooks/useData';
import invoiceService from '../services/invoiceService';

const InvoiceDetail = () => {
  const { id } = useParams();
  const { data: invoice, loading, error } = useData(() => invoiceService.getInvoiceById(id), [id]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>Invoice Details</h2>
      <p><strong>Invoice ID:</strong> {invoice.id}</p>
      <p><strong>Patient ID:</strong> {invoice.patient_id}</p>
      <p><strong>Total Amount:</strong> ${invoice.total.toFixed(2)}</p>
      <h3>Treatments</h3>
      <ul>
        {invoice.treatments.map(treatment => (
          <li key={treatment.id}>
            {treatment.name} - ${treatment.price.toFixed(2)}
          </li>
        ))}
      </ul>
      <p><strong>Status:</strong> {invoice.status}</p>
      <p><strong>Created At:</strong> {new Date(invoice.created_at).toLocaleDateString()}</p>
    </div>
  );
};

export default InvoiceDetail;