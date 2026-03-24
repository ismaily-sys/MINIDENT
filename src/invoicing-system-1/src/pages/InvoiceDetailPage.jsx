import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useData } from '../hooks/useData';
import { invoiceService } from '../services/invoiceService';
import InvoiceDetail from '../components/InvoiceDetail';

const InvoiceDetailPage = () => {
  const { id } = useParams();
  const { data: invoice, loading, error, refetch } = useData(() => invoiceService.getInvoiceById(id), [id]);

  useEffect(() => {
    if (error) {
      console.error('Error fetching invoice:', error);
    }
  }, [error]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error loading invoice details.</div>;

  return (
    <div>
      <h1>Invoice Details</h1>
      {invoice ? <InvoiceDetail invoice={invoice} /> : <div>No invoice found.</div>}
    </div>
  );
};

export default InvoiceDetailPage;