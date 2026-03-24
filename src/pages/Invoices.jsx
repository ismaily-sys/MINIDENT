import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { invoicesService, patientsService } from '../services';
import { Plus, Search, FileText, User, Eye, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal, { ModalFooter } from '../components/ui/Modal';
import Table from '../components/ui/Table';

/**
 * Invoices Page
 * Manage invoices and billing
 */
const Invoices = () => {
  const { clinic } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [formData, setFormData] = useState({
    patient_id: '',
    notes: '',
    items: [{ description: '', price: '' }],
  });
  const [saving, setSaving] = useState(false);

  // Load invoices
  const loadInvoices = useCallback(async () => {
    if (!clinic?.id) return;
    
    try {
      setLoading(true);
      const data = await invoicesService.getAll(clinic.id);
      setInvoices(data);
    } catch (error) {
      console.error('Error loading invoices:', error);
      toast.error('Erreur lors du chargement des factures');
    } finally {
      setLoading(false);
    }
  }, [clinic?.id]);

  // Load patients
  const loadPatients = useCallback(async () => {
    if (!clinic?.id) return;
    
    try {
      const data = await patientsService.getAll(clinic.id);
      setPatients(data);
    } catch (error) {
      console.error('Error loading patients:', error);
    }
  }, [clinic?.id]);

  useEffect(() => {
    loadInvoices();
    loadPatients();
  }, [loadInvoices, loadPatients]);

  // Open modal for new invoice
  const handleAddInvoice = () => {
    setFormData({
      patient_id: '',
      notes: '',
      items: [{ description: '', price: '' }],
    });
    setIsModalOpen(true);
  };

  // Add item to form
  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { description: '', price: '' }],
    });
  };

  // Remove item from form
  const handleRemoveItem = (index) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  // Update item
  const handleUpdateItem = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData({ ...formData, items: newItems });
  };

  // Save invoice
  const handleSaveInvoice = async (e) => {
    e.preventDefault();
    if (!clinic?.id) return;
    
    if (!formData.patient_id) {
      toast.error('Veuillez sélectionner un patient');
      return;
    }
    
    const validItems = formData.items.filter(
      (item) => item.description && item.price && parseFloat(item.price) > 0
    );
    
    if (validItems.length === 0) {
      toast.error('Ajoutez au moins un article valide');
      return;
    }
    
    try {
      setSaving(true);
      await invoicesService.create(clinic.id, {
        patient_id: formData.patient_id,
        notes: formData.notes,
        items: validItems.map((item) => ({
          description: item.description,
          price: parseFloat(item.price),
        })),
      });
      toast.success('Facture créée');
      setIsModalOpen(false);
      loadInvoices();
    } catch (error) {
      console.error('Error saving invoice:', error);
      toast.error('Erreur lors de la création');
    } finally {
      setSaving(false);
    }
  };

  // View invoice details
  const handleViewInvoice = async (invoice) => {
    if (!clinic?.id) return;
    
    try {
      const data = await invoicesService.getById(clinic.id, invoice.id);
      setSelectedInvoice(data);
      setIsViewModalOpen(true);
    } catch (error) {
      console.error('Error loading invoice:', error);
      toast.error('Erreur lors du chargement');
    }
  };

  // Update invoice status
  const handleUpdateStatus = async (invoiceId, status) => {
    if (!clinic?.id) return;
    
    try {
      await invoicesService.updateStatus(clinic.id, invoiceId, status);
      toast.success('Statut mis à jour');
      loadInvoices();
      if (selectedInvoice?.id === invoiceId) {
        const updated = await invoicesService.getById(clinic.id, invoiceId);
        setSelectedInvoice(updated);
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-MA', {
      style: 'currency',
      currency: 'MAD',
    }).format(amount);
  };

  // Format date
  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  // Get status badge
  const getStatusBadge = (status) => {
    const styles = {
      unpaid: 'bg-error/20 text-error',
      paid: 'bg-success/20 text-success',
      cancelled: 'bg-secondary/20 text-secondary',
    };
    const labels = {
      unpaid: 'Non payée',
      paid: 'Payée',
      cancelled: 'Annulée',
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  // Table columns
  const columns = [
    {
      header: 'Date',
      accessor: 'created_at',
      render: (value) => formatDate(value),
    },
    {
      header: 'Patient',
      accessor: 'patient',
      render: (patient) => (
        <div className="flex items-center gap-2">
          <User size={14} className="text-secondary" />
          <span>{patient?.name || 'Inconnu'}</span>
        </div>
      ),
    },
    {
      header: 'Total',
      accessor: 'total',
      render: (value) => (
        <span className="font-medium">{formatCurrency(value)}</span>
      ),
    },
    {
      header: 'Statut',
      accessor: 'status',
      render: (status) => getStatusBadge(status),
    },
    {
      header: 'Actions',
      accessor: 'id',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            icon={Eye}
            onClick={(e) => {
              e.stopPropagation();
              handleViewInvoice(row);
            }}
          />
          {row.status === 'unpaid' && (
            <>
              <Button
                variant="ghost"
                size="sm"
                icon={Check}
                className="text-success hover:bg-success/10"
                onClick={(e) => {
                  e.stopPropagation();
                  handleUpdateStatus(row.id, 'paid');
                }}
              />
              <Button
                variant="ghost"
                size="sm"
                icon={X}
                className="text-error hover:bg-error/10"
                onClick={(e) => {
                  e.stopPropagation();
                  handleUpdateStatus(row.id, 'cancelled');
                }}
              />
            </>
          )}
        </div>
      ),
    },
  ];

  // Filter invoices by search
  const filteredInvoices = invoices.filter((inv) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return inv.patient?.name?.toLowerCase().includes(query);
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-on-surface">Factures</h1>
          <p className="text-secondary mt-1">Gestion de la facturation</p>
        </div>
        <Button icon={Plus} onClick={handleAddInvoice}>
          Nouvelle facture
        </Button>
      </div>

      {/* Search */}
      <div className="max-w-md">
        <Input
          icon={Search}
          placeholder="Rechercher par patient..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Invoices Table */}
      <div className="bg-surface-container-lowest rounded-2xl overflow-hidden">
        <Table
          columns={columns}
          data={filteredInvoices}
          loading={loading}
          emptyMessage="Aucune facture trouvée"
        />
      </div>

      {/* Add Invoice Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Nouvelle facture"
        size="lg"
      >
        <form onSubmit={handleSaveInvoice}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-on-surface mb-1">
                Patient
              </label>
              <select
                value={formData.patient_id}
                onChange={(e) => setFormData({ ...formData, patient_id: e.target.value })}
                className="w-full py-2.5 px-4 bg-surface-container-low border border-outline-variant rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              >
                <option value="">Sélectionner un patient</option>
                {patients.map((patient) => (
                  <option key={patient.id} value={patient.id}>
                    {patient.name}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Items */}
            <div>
              <label className="block text-sm font-medium text-on-surface mb-2">
                Articles
              </label>
              <div className="space-y-2">
                {formData.items.map((item, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder="Description"
                      value={item.description}
                      onChange={(e) => handleUpdateItem(index, 'description', e.target.value)}
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      placeholder="Prix"
                      value={item.price}
                      onChange={(e) => handleUpdateItem(index, 'price', e.target.value)}
                      className="w-32"
                      min="0"
                      step="0.01"
                    />
                    {formData.items.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        icon={X}
                        className="text-error"
                        onClick={() => handleRemoveItem(index)}
                      />
                    )}
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                icon={Plus}
                onClick={handleAddItem}
                className="mt-2"
              >
                Ajouter un article
              </Button>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-on-surface mb-1">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full py-2.5 px-4 bg-surface-container-low border border-outline-variant rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                rows={2}
                placeholder="Notes optionnelles..."
              />
            </div>
            
            {/* Total */}
            <div className="flex justify-end">
              <div className="text-right">
                <span className="text-secondary">Total: </span>
                <span className="text-xl font-bold text-on-surface">
                  {formatCurrency(
                    formData.items.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0)
                  )}
                </span>
              </div>
            </div>
          </div>
          
          <ModalFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" loading={saving}>
              Créer la facture
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* View Invoice Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Détails de la facture"
        size="lg"
      >
        {selectedInvoice && (
          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-secondary text-sm">Patient</p>
                <p className="font-medium text-on-surface">
                  {selectedInvoice.patient?.name}
                </p>
              </div>
              <div className="text-right">
                <p className="text-secondary text-sm">Date</p>
                <p className="font-medium text-on-surface">
                  {formatDate(selectedInvoice.created_at)}
                </p>
              </div>
            </div>
            
            <div className="border-t border-outline-variant pt-4">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-secondary">
                    <th className="pb-2">Description</th>
                    <th className="pb-2 text-right">Prix</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedInvoice.items?.map((item, index) => (
                    <tr key={index} className="border-b border-outline-variant/50">
                      <td className="py-2">{item.description}</td>
                      <td className="py-2 text-right">{formatCurrency(item.price)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td className="pt-2 font-semibold">Total</td>
                    <td className="pt-2 text-right font-bold text-lg">
                      {formatCurrency(selectedInvoice.total)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
            
            <div className="flex items-center justify-between pt-4 border-t border-outline-variant">
              <div>{getStatusBadge(selectedInvoice.status)}</div>
              {selectedInvoice.status === 'unpaid' && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => handleUpdateStatus(selectedInvoice.id, 'cancelled')}
                  >
                    Annuler
                  </Button>
                  <Button
                    onClick={() => handleUpdateStatus(selectedInvoice.id, 'paid')}
                  >
                    Marquer comme payée
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Invoices;
