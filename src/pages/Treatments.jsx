import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { treatmentsService, patientsService, dentalCodesService } from '../services';
import { Plus, Search, Stethoscope, User, Trash2, Edit2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal, { ModalFooter } from '../components/ui/Modal';
import Table from '../components/ui/Table';

/**
 * Treatments Page
 * Manage treatment records
 */
const Treatments = () => {
  const { clinic } = useAuth();
  const [treatments, setTreatments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [dentalCodes, setDentalCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    patient_id: '',
    code: '',
    description: '',
    price: '',
  });
  const [saving, setSaving] = useState(false);

  // Load treatments
  const loadTreatments = useCallback(async () => {
    if (!clinic?.id) return;
    
    try {
      setLoading(true);
      const data = await treatmentsService.getAll(clinic.id);
      setTreatments(data);
    } catch (error) {
      console.error('Error loading treatments:', error);
      toast.error('Erreur lors du chargement des traitements');
    } finally {
      setLoading(false);
    }
  }, [clinic?.id]);

  // Load patients and dental codes
  const loadInitialData = useCallback(async () => {
    if (!clinic?.id) return;
    
    try {
      const [patientsData, codesData] = await Promise.all([
        patientsService.getAll(clinic.id),
        dentalCodesService.getAll(),
      ]);
      setPatients(patientsData);
      setDentalCodes(codesData);
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  }, [clinic?.id]);

  useEffect(() => {
    loadTreatments();
    loadInitialData();
  }, [loadTreatments, loadInitialData]);

  // Handle dental code selection
  const handleCodeSelect = (code) => {
    const selectedCode = dentalCodes.find((c) => c.code === code);
    if (selectedCode) {
      setFormData({
        ...formData,
        code: selectedCode.code,
        description: selectedCode.description,
        price: selectedCode.default_price || '',
      });
    }
  };

  // Open modal for new treatment
  const handleAddTreatment = () => {
    setFormData({
      patient_id: '',
      code: '',
      description: '',
      price: '',
    });
    setIsModalOpen(true);
  };

  // Save treatment
  const handleSaveTreatment = async (e) => {
    e.preventDefault();
    if (!clinic?.id) return;
    
    if (!formData.patient_id) {
      toast.error('Veuillez sélectionner un patient');
      return;
    }
    if (!formData.description) {
      toast.error('La description est requise');
      return;
    }
    if (!formData.price || formData.price <= 0) {
      toast.error('Le prix doit être supérieur à 0');
      return;
    }
    
    try {
      setSaving(true);
      await treatmentsService.create(clinic.id, {
        patient_id: formData.patient_id,
        code: formData.code || null,
        description: formData.description,
        price: parseFloat(formData.price),
      });
      toast.success('Traitement enregistré');
      setIsModalOpen(false);
      loadTreatments();
    } catch (error) {
      console.error('Error saving treatment:', error);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  // Delete treatment
  const handleDeleteTreatment = async (treatmentId) => {
    if (!clinic?.id) return;
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce traitement?')) return;
    
    try {
      await treatmentsService.delete(clinic.id, treatmentId);
      toast.success('Traitement supprimé');
      loadTreatments();
    } catch (error) {
      console.error('Error deleting treatment:', error);
      toast.error('Erreur lors de la suppression');
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
      header: 'Code',
      accessor: 'code',
      render: (value) => value ? (
        <span className="px-2 py-1 bg-primary/10 text-primary rounded text-xs font-medium">
          {value}
        </span>
      ) : (
        <span className="text-secondary">-</span>
      ),
    },
    {
      header: 'Description',
      accessor: 'description',
    },
    {
      header: 'Prix',
      accessor: 'price',
      render: (value) => (
        <span className="font-medium text-success">{formatCurrency(value)}</span>
      ),
    },
    {
      header: 'Actions',
      accessor: 'id',
      render: (_, row) => (
        <Button
          variant="ghost"
          size="sm"
          icon={Trash2}
          className="text-error hover:bg-error/10"
          onClick={(e) => {
            e.stopPropagation();
            handleDeleteTreatment(row.id);
          }}
        />
      ),
    },
  ];

  // Filter treatments by search
  const filteredTreatments = treatments.filter((t) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      t.patient?.name?.toLowerCase().includes(query) ||
      t.description?.toLowerCase().includes(query) ||
      t.code?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-on-surface">Traitements</h1>
          <p className="text-secondary mt-1">Historique des traitements</p>
        </div>
        <Button icon={Plus} onClick={handleAddTreatment}>
          Nouveau traitement
        </Button>
      </div>

      {/* Search */}
      <div className="max-w-md">
        <Input
          icon={Search}
          placeholder="Rechercher par patient, code ou description..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Treatments Table */}
      <div className="bg-surface-container-lowest rounded-2xl overflow-hidden">
        <Table
          columns={columns}
          data={filteredTreatments}
          loading={loading}
          emptyMessage="Aucun traitement trouvé"
        />
      </div>

      {/* Add Treatment Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Nouveau traitement"
        size="md"
      >
        <form onSubmit={handleSaveTreatment}>
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
            
            <div>
              <label className="block text-sm font-medium text-on-surface mb-1">
                Code dentaire (optionnel)
              </label>
              <select
                value={formData.code}
                onChange={(e) => handleCodeSelect(e.target.value)}
                className="w-full py-2.5 px-4 bg-surface-container-low border border-outline-variant rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">Sélectionner un code (optionnel)</option>
                {dentalCodes.map((code) => (
                  <option key={code.code} value={code.code}>
                    {code.code} - {code.description} ({formatCurrency(code.default_price || 0)})
                  </option>
                ))}
              </select>
            </div>
            
            <Input
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Description du traitement"
              required
            />
            
            <Input
              label="Prix (MAD)"
              type="number"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              placeholder="0.00"
              min="0"
              step="0.01"
              required
            />
          </div>
          
          <ModalFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" loading={saving}>
              Enregistrer
            </Button>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  );
};

export default Treatments;
