import React from 'react';
import InvoiceList from '../components/InvoiceList';
import InvoiceForm from '../components/InvoiceForm';

const DashboardPage = () => {
  return (
    <div>
      <h1>Dashboard</h1>
      <InvoiceForm />
      <InvoiceList />
    </div>
  );
};

export default DashboardPage;