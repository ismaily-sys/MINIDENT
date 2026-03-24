import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import InvoicesPage from './pages/InvoicesPage';
import CreateInvoicePage from './pages/CreateInvoicePage';
import InvoiceDetailPage from './pages/InvoiceDetailPage';
import './styles/index.css';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<InvoicesPage />} />
        <Route path="/create-invoice" element={<CreateInvoicePage />} />
        <Route path="/invoice/:id" element={<InvoiceDetailPage />} />
      </Routes>
    </Router>
  );
};

export default App;