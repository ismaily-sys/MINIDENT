import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { patientsService } from '../services';
import { Plus, Search, Edit2, Trash2, Phone, Mail, User } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal, { ModalFooter } from '../components/ui/Modal';
import Table from '../components/ui/Table';

const Patients = () => {
  const { clinic } = useAuth();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);
  const [formData, setFormData] = useState({ name: '', phone: '', email: '' });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const loadPatients = useCallback(async () => {
    if (!clinic?.id) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await patientsService.getAll(clinic.id);
      setPatients(data);
    } catch (error) {
      console.error('Error loading patients:', error);
      toast.error('Erreur lors du chargement des patients');
    } finally {
      setLoading(false);
    }
  }, [clinic?.id]);

  useEffect(() => {
    loadPatients();
  }, [loadPatients]);

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (!clinic?.id) return;
    if (query.trim()) {
      try {
        const results = await patientsService.search(clinic.id, query);
        setPatients(results);
      } catch (error) {
        console.error('Error searching patients:', error);
      }
    } else {
      loadPatients();
    }
  };

  const handleAddPatient = () => {
    setEditingPatient(null);
    setFormData({ name: '', phone: '', email: '' });
    setErrors({});
    setIsModalOpen(true);
  };

  const handleEditPatient = (patient) => {
    setEditingPatient(patient);
    setFormData({
      name: patient.name,
      phone: patient.phone || '',
      email: patient.email || '',
    });
    setErrors({});
    setIsModalOpen(true);
  };

  const validate = () => {
    const next = {};
    if (!formData.name.trim()) next.name = 'Le nom est requis';
    if (!formData.phone.trim()) next.phone = 'Le téléphone est requis';
    return next;
  };

  const handleSavePatient = async (e) => {
    e.preventDefault();

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    if (!clinic?.id) {
      toast.error('Clinique non trouvée. Rechargez la page et réessayez.');
      return;
    }

    try {
      setSaving(true);
      console.log('Submitting patient:', formData);

      if (editingPatient) {
        const updated = await patientsService.update(clinic.id, editingPatient.id, formData);
        console.log('Patient updated:', updated);
        toast.success('Patient mis à jour');
      } else {
        const created = await patientsService.create(clinic.id, formData);
        console.log('Patient created:', created);
        toast.success('Patient créé avec succès');
      }

      setIsModalOpen(false);
      setFormData({ name: '', phone: '', email: '' });
      setErrors({});
      loadPatients();
    } catch (error) {
      console.error('Error saving patient:', error);
      toast.error(error?.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePatient = async (patient) => {
    if (!clinic?.id) return;
    if (!confirm(`Supprimer ${patient.name} ?`)) return;
    try {
      await patientsService.delete(clinic.id, patient.id);
      toast.success('Patient supprimé');
      loadPatients();
    } catch (error) {
      console.error('Error deleting patient:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const columns = [
    {
      header: 'Nom',
      accessor: 'name',
      render: (value) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <User size={16} className="text-primary" />
          </div>
          <span className="font-medium text-on-surface">{value}</span>
        </div>
      ),
    },
    {
      header: 'Téléphone',
      accessor: 'phone',
      render: (value) => value ? (
        <div className="flex items-center gap-2 text-on-surface">
          <Phone size={14} className="text-secondary" />
          <span>{value}</span>
        </div>
      ) : <span className="text-secondary">—</span>,
    },
    {
      header: 'Email',
      accessor: 'email',
      render: (value) => value ? (
        <div className="flex items-center gap-2 text-on-surface">
          <Mail size={14} className="text-secondary" />
          <span>{value}</span>
        </div>
      ) : <span className="text-secondary">—</span>,
    },
    {
      header: 'Actions',
      accessor: 'id',
      render: (_, row) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            icon={Edit2}
            onClick={(e) => { e.stopPropagation(); handleEditPatient(row); }}
          />
          <Button
            variant="ghost"
            size="sm"
            icon={Trash2}
            className="text-error hover:bg-error/10"
            onClick={(e) => { e.stopPropagation(); handleDeletePatient(row); }}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-on-surface">Patients</h1>
          <p className="text-secondary mt-1">Gérez vos patients</p>
        </div>
        <Button icon={Plus} onClick={handleAddPatient}>
          Nouveau patient
        </Button>
      </div>

      <div className="max-w-md">
        <Input
          icon={Search}
          placeholder="Rechercher par nom, téléphone ou email..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
        />
      </div>

      <div className="bg-surface-container-lowest rounded-2xl overflow-hidden">
        <Table
          columns={columns}
          data={patients}
          loading={loading}
          emptyMessage="Aucun patient trouvé"
        />
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setErrors({}); }}
        title={editingPatient ? 'Modifier le patient' : 'Nouveau patient'}
        size="sm"
      >
        <form onSubmit={handleSavePatient} noValidate>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-on-surface mb-1.5">
                Nom complet <span className="text-error">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  if (errors.name) setErrors({ ...errors, name: undefined });
                }}
                placeholder="Mohamed Alami"
                autoFocus
                className={`w-full px-4 py-3 rounded-xl bg-surface-container-low border text-on-surface placeholder:text-secondary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all ${
                  errors.name ? 'border-error focus:ring-error' : 'border-outline-variant'
                }`}
              />
              {errors.name && (
                <p className="mt-1 text-xs text-error">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-on-surface mb-1.5">
                Téléphone <span className="text-error">*</span>
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => {
                  setFormData({ ...formData, phone: e.target.value });
                  if (errors.phone) setErrors({ ...errors, phone: undefined });
                }}
                placeholder="+212 6XX XXX XXX"
                className={`w-full px-4 py-3 rounded-xl bg-surface-container-low border text-on-surface placeholder:text-secondary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all ${
                  errors.phone ? 'border-error focus:ring-error' : 'border-outline-variant'
                }`}
              />
              {errors.phone && (
                <p className="mt-1 text-xs text-error">{errors.phone}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-on-surface mb-1.5">
                Email <span className="text-secondary font-normal text-xs">(optionnel)</span>
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@exemple.com"
                className="w-full px-4 py-3 rounded-xl bg-surface-container-low border border-outline-variant text-on-surface placeholder:text-secondary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
            </div>
          </div>

          <ModalFooter>
            <button
              type="button"
              onClick={() => { setIsModalOpen(false); setErrors({}); }}
              className="px-4 py-2 text-sm font-medium rounded-lg border border-outline-variant text-secondary hover:bg-surface-container-low transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-sm font-medium rounded-lg bg-primary text-white hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {saving && (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              )}
              {saving ? 'Enregistrement...' : editingPatient ? 'Mettre à jour' : 'Créer'}
            </button>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  );
};

export default Patients;
