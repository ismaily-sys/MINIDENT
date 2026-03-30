import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import Appointments from './pages/Appointments';
import Treatments from './pages/Treatments';
import Invoices from './pages/Invoices';
import Settings from './pages/Settings';
import { ClinicSetupWizard } from './pages/Auth/ClinicSetupWizard';
import { ClinicSettings } from './pages/Settings/ClinicSettings';

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
      <Router>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'var(--color-surface-container-lowest)',
              color: 'var(--color-on-surface)',
              border: '1px solid var(--color-outline-variant)',
            },
            success: {
              iconTheme: {
                primary: 'var(--color-success)',
                secondary: 'var(--color-on-success)',
              },
            },
            error: {
              iconTheme: {
                primary: 'var(--color-error)',
                secondary: 'var(--color-on-error)',
              },
            },
          }}
        />
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/setup" element={<ClinicSetupWizard />} />
          
          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/patients" element={<Patients />} />
              <Route path="/appointments" element={<Appointments />} />
              <Route path="/treatments" element={<Treatments />} />
              <Route path="/invoices" element={<Invoices />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/settings/clinic" element={<ClinicSettings />} />
            </Route>
          </Route>
        </Routes>
      </Router>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
