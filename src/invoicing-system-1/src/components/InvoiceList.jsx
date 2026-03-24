import React from 'react';
import { useList } from '../hooks/useList';
import { invoiceService } from '../services/invoiceService';

const InvoiceList = () => {
  const { items: invoices, loading, error, refetch } = useList(invoiceService);

  if (loading) return <div>Loading invoices...</div>;
  if (error) return <div>Error loading invoices: {error}</div>;

  return (
    <div>
      <h2>Invoice List</h2>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Patient</th>
            <th>Total Amount</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map(invoice => (
            <tr key={invoice.id}>
              <td>{invoice.id}</td>
              <td>{invoice.patient_id}</td>
              <td>{invoice.total}</td>
              <td>{invoice.status}</td>
              <td>
                <button onClick={() => {/* Navigate to invoice detail */}}>View</button>
                <button onClick={() => {/* Handle delete invoice */}}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button onClick={refetch}>Refresh Invoices</button>
    </div>
  );
};

export default InvoiceList;