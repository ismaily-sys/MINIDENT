import React from 'react';
import InvoiceForm from '../components/InvoiceForm';
import InvoiceList from '../components/InvoiceList';

const InvoicePage = () => {
  return (
    <div>
      <h1>Invoicing System</h1>
      <InvoiceForm />
      <InvoiceList />
    </div>
  );
};

export default InvoicePage;