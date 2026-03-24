import { supabase } from './supabaseClient';

const invoiceService = {
  createInvoice: async (clinicId, patientId, treatments) => {
    const { data, error } = await supabase
      .from('invoices')
      .insert([{ clinic_id: clinicId, patient_id: patientId, total: calculateTotal(treatments) }])
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  addItemToInvoice: async (invoiceId, treatment) => {
    const { data, error } = await supabase
      .from('invoice_items')
      .insert([{ invoice_id: invoiceId, treatment_id: treatment.id, amount: treatment.amount }]);

    if (error) throw new Error(error.message);
    return data;
  },

  getInvoices: async (clinicId) => {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('clinic_id', clinicId);

    if (error) throw new Error(error.message);
    return data;
  },

  getInvoiceDetails: async (invoiceId) => {
    const { data, error } = await supabase
      .from('invoices')
      .select('*, invoice_items(*)')
      .eq('id', invoiceId)
      .single();

    if (error) throw new Error(error.message);
    return data;
  },
};

const calculateTotal = (treatments) => {
  return treatments.reduce((total, treatment) => total + treatment.amount, 0);
};

export default invoiceService;