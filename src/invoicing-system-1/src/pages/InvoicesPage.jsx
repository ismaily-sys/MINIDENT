import React from 'react';
import InvoiceList from '../components/InvoiceList';
import { Link } from 'react-router-dom';

const InvoicesPage = () => {
  return (
    <div>
      <h1>Invoices</h1>
      <Link to="/create-invoice" className="btn btn-primary">Create New Invoice</Link>
      <InvoiceList />
    </div>
  );
};

export default InvoicesPage;