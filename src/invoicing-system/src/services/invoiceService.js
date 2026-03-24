import { supabase } from './supabaseClient';

export const invoiceService = {
  createInvoice: async (patientId, treatments) => {
    const { data, error } = await supabase
      .from('invoices')
      .insert([{ patient_id: patientId, total_amount: calculateTotal(treatments) }])
      .single();

    if (error) throw new Error(error.message);
    await addInvoiceItems(data.id, treatments);
    return data;
  },

  getInvoices: async () => {
    const { data, error } = await supabase
      .from('invoices')
      .select('*');

    if (error) throw new Error(error.message);
    return data;
  },

  getInvoiceById: async (id) => {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  deleteInvoice: async (id) => {
    const { error } = await supabase
      .from('invoices')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
  },
};

const calculateTotal = (treatments) => {
  return treatments.reduce((total, treatment) => total + treatment.price, 0);
};

const addInvoiceItems = async (invoiceId, treatments) => {
  const items = treatments.map(treatment => ({
    invoice_id: invoiceId,
    treatment_id: treatment.id,
    price: treatment.price,
  }));

  const { error } = await supabase
    .from('invoice_items')
    .insert(items);

  if (error) throw new Error(error.message);
};