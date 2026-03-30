import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { patientsService } from '../services';
import { Plus, Search, Edit2, Trash2, Phone, Mail, User } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal, { ModalFooter } from '../components/ui/Modal';
import Table from '../components/ui/Table';

/**
 * Patients Page
 * List, search, and manage patients
 */
const Patients = () => {
  const { clinic } = useAuth();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);
  const [formData, setFormData] = useState({ name: '', phone: '', email: '' });
  const [saving, setSaving] = useState(false);

  // Load patients
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

  // Search patients
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

  // Open modal for new patient
  const handleAddPatient = () => {
    setEditingPatient(null);
    setFormData({ name: '', phone: '', email: '' });
    setIsModalOpen(true);
  };

  // Open modal for editing
  const handleEditPatient = (patient) => {
    setEditingPatient(patient);
    setFormData({
      name: patient.name,
      phone: patient.phone || '',
      email: patient.email || '',
    });
    setIsModalOpen(true);
  };

  // Save patient (create or update)
  const handleSavePatient = async (e) => {
    e.preventDefault();
    if (!clinic?.id) return;
    
    if (!formData.name.trim()) {
      toast.error('Le nom est requis');
      return;
    }
    
    try {
      setSaving(true);
      
      if (editingPatient) {
        // Update existing patient
        await patientsService.update(clinic.id, editingPatient.id, formData);
        toast.success('Patient mis à jour');
      } else {
        // Create new patient
        await patientsService.create(clinic.id, formData);
        toast.success('Patient créé');
      }
      
      setIsModalOpen(false);
      loadPatients();
    } catch (error) {
      console.error('Error saving patient:', error);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  // Delete patient
  const handleDeletePatient = async (patient) => {
    if (!clinic?.id) return;
    if (!confirm(`Êtes-vous sûr de vouloir supprimer ${patient.name}?`)) return;
    
    try {
      await patientsService.delete(clinic.id, patient.id);
      toast.success('Patient supprimé');
      loadPatients();
    } catch (error) {
      console.error('Error deleting patient:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  // Table columns
  const columns = [
    {
      header: 'Nom',
      accessor: 'name',
      render: (value, row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <User size={18} className="text-primary" />
          </div>
          <span className="font-medium">{value}</span>
        </div>
      ),
    },
    {
      header: 'Téléphone',
      accessor: 'phone',
      render: (value) => value ? (
        <div className="flex items-center gap-2">
          <Phone size={14} className="text-secondary" />
          <span>{value}</span>
        </div>
      ) : (
        <span className="text-secondary">-</span>
      ),
    },
    {
      header: 'Email',
      accessor: 'email',
      render: (value) => value ? (
        <div className="flex items-center gap-2">
          <Mail size={14} className="text-secondary" />
          <span>{value}</span>
        </div>
      ) : (
        <span className="text-secondary">-</span>
      ),
    },
    {
      header: 'Actions',
      accessor: 'id',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            icon={Edit2}
            onClick={(e) => {
              e.stopPropagation();
              handleEditPatient(row);
            }}
          />
          <Button
            variant="ghost"
            size="sm"
            icon={Trash2}
            className="text-error hover:bg-error/10"
            onClick={(e) => {
              e.stopPropagation();
              handleDeletePatient(row);
            }}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-on-surface">Patients</h1>
          <p className="text-secondary mt-1">Gérez vos patients</p>
        </div>
        <Button icon={Plus} onClick={handleAddPatient}>
          Nouveau patient
        </Button>
      </div>

      {/* Search */}
      <div className="max-w-md">
        <Input
          icon={Search}
          placeholder="Rechercher par nom, téléphone ou email..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
        />
      </div>

      {/* Patients Table */}
      <div className="bg-surface-container-lowest rounded-2xl overflow-hidden">
        <Table
          columns={columns}
          data={patients}
          loading={loading}
          emptyMessage="Aucun patient trouvé"
        />
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingPatient ? 'Modifier le patient' : 'Nouveau patient'}
        size="md"
      >
        <form onSubmit={handleSavePatient}>
          <div className="space-y-4">
            <Input
              label="Nom complet"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Dr. Jean Dupont"
              required
            />
            <Input
              label="Téléphone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+212 6XX XXX XXX"
              type="tel"
            />
            <Input
              label="Email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="email@exemple.com"
              type="email"
            />
          </div>
          
          <ModalFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" loading={saving}>
              {editingPatient ? 'Mettre à jour' : 'Créer'}
            </Button>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  );
};

export default Patients;
