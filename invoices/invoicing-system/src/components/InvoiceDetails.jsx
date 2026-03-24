import React from 'react';

const InvoiceDetails = ({ invoice }) => {
  if (!invoice) {
    return <div>No invoice selected.</div>;
  }

  return (
    <div>
      <h2>Invoice Details</h2>
      <p><strong>Invoice ID:</strong> {invoice.id}</p>
      <p><strong>Patient:</strong> {invoice.patientName}</p>
      <p><strong>Date:</strong> {new Date(invoice.date).toLocaleDateString()}</p>
      <h3>Treatments</h3>
      <ul>
        {invoice.treatments.map((treatment) => (
          <li key={treatment.id}>
            {treatment.name} - ${treatment.amount}
          </li>
        ))}
      </ul>
      <h3>Total Amount: ${invoice.totalAmount}</h3>
    </div>
  );
};

export default InvoiceDetails;