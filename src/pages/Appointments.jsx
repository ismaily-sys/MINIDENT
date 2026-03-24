import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { appointmentsService, patientsService } from '../services';
import { Plus, ChevronLeft, ChevronRight, Clock, User, Check, X, Calendar as CalendarIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal, { ModalFooter } from '../components/ui/Modal';

/**
 * Appointments Page
 * Calendar view and appointment booking
 */
const Appointments = () => {
  const { clinic } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    patient_id: '',
    date: '',
    time: '',
    notes: '',
  });
  const [saving, setSaving] = useState(false);

  // Load appointments for selected date
  const loadAppointments = useCallback(async () => {
    if (!clinic?.id) return;
    
    try {
      setLoading(true);
      const data = await appointmentsService.getByDate(clinic.id, selectedDate);
      setAppointments(data);
    } catch (error) {
      console.error('Error loading appointments:', error);
      toast.error('Erreur lors du chargement des rendez-vous');
    } finally {
      setLoading(false);
    }
  }, [clinic?.id, selectedDate]);

  // Load patients for dropdown
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
    loadAppointments();
  }, [loadAppointments]);

  useEffect(() => {
    loadPatients();
  }, [loadPatients]);

  // Navigate days
  const navigateDay = (direction) => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + direction);
    setSelectedDate(current.toISOString().split('T')[0]);
  };

  // Go to today
  const goToToday = () => {
    setSelectedDate(new Date().toISOString().split('T')[0]);
  };

  // Open modal for new appointment
  const handleAddAppointment = () => {
    setFormData({
      patient_id: '',
      date: selectedDate,
      time: '',
      notes: '',
    });
    setIsModalOpen(true);
  };

  // Save appointment
  const handleSaveAppointment = async (e) => {
    e.preventDefault();
    if (!clinic?.id) return;
    
    if (!formData.patient_id) {
      toast.error('Veuillez sélectionner un patient');
      return;
    }
    if (!formData.time) {
      toast.error('Veuillez sélectionner une heure');
      return;
    }
    
    try {
      setSaving(true);
      await appointmentsService.create(clinic.id, formData);
      toast.success('Rendez-vous créé');
      setIsModalOpen(false);
      loadAppointments();
    } catch (error) {
      console.error('Error saving appointment:', error);
      toast.error('Erreur lors de la création');
    } finally {
      setSaving(false);
    }
  };

  // Update appointment status
  const handleUpdateStatus = async (appointmentId, status) => {
    if (!clinic?.id) return;
    
    try {
      await appointmentsService.updateStatus(clinic.id, appointmentId, status);
      toast.success('Statut mis à jour');
      loadAppointments();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  };

  // Delete appointment
  const handleDeleteAppointment = async (appointmentId) => {
    if (!clinic?.id) return;
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce rendez-vous?')) return;
    
    try {
      await appointmentsService.delete(clinic.id, appointmentId);
      toast.success('Rendez-vous supprimé');
      loadAppointments();
    } catch (error) {
      console.error('Error deleting appointment:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  // Format date for display
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  // Format time
  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get status badge
  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-warning/20 text-warning',
      completed: 'bg-success/20 text-success',
      cancelled: 'bg-error/20 text-error',
    };
    const labels = {
      pending: 'En attente',
      completed: 'Terminé',
      cancelled: 'Annulé',
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-on-surface">Rendez-vous</h1>
          <p className="text-secondary mt-1">Gérez vos rendez-vous</p>
        </div>
        <Button icon={Plus} onClick={handleAddAppointment}>
          Nouveau rendez-vous
        </Button>
      </div>

      {/* Date Navigation */}
      <div className="bg-surface-container-lowest rounded-2xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" icon={ChevronLeft} onClick={() => navigateDay(-1)} />
            <Button variant="outline" size="sm" onClick={goToToday}>
              Aujourd'hui
            </Button>
            <Button variant="outline" size="sm" icon={ChevronRight} onClick={() => navigateDay(1)} />
          </div>
          <div className="flex items-center gap-2">
            <CalendarIcon size={18} className="text-primary" />
            <span className="font-medium text-on-surface capitalize">
              {formatDate(selectedDate)}
            </span>
          </div>
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-auto"
          />
        </div>
      </div>

      {/* Appointments List */}
      <div className="bg-surface-container-lowest rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : appointments.length === 0 ? (
          <div className="text-center py-12 text-secondary">
            Aucun rendez-vous pour cette date
          </div>
        ) : (
          <div className="divide-y divide-outline-variant">
            {appointments.map((appointment) => (
              <div
                key={appointment.id}
                className="p-4 hover:bg-surface-container-low transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-primary">
                      <Clock size={18} />
                      <span className="font-medium">{formatTime(appointment.date)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User size={18} className="text-secondary" />
                      <span className="font-medium text-on-surface">
                        {appointment.patient?.name || 'Patient inconnu'}
                      </span>
                    </div>
                    {appointment.notes && (
                      <span className="text-sm text-secondary">{appointment.notes}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(appointment.status)}
                    {appointment.status === 'pending' && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={Check}
                          className="text-success hover:bg-success/10"
                          onClick={() => handleUpdateStatus(appointment.id, 'completed')}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={X}
                          className="text-error hover:bg-error/10"
                          onClick={() => handleUpdateStatus(appointment.id, 'cancelled')}
                        />
                      </>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteAppointment(appointment.id)}
                      className="text-error hover:bg-error/10"
                    >
                      Supprimer
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Appointment Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Nouveau rendez-vous"
        size="md"
      >
        <form onSubmit={handleSaveAppointment}>
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
            
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
              <Input
                label="Heure"
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-on-surface mb-1">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full py-2.5 px-4 bg-surface-container-low border border-outline-variant rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                rows={3}
                placeholder="Notes optionnelles..."
              />
            </div>
          </div>
          
          <ModalFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" loading={saving}>
              Créer
            </Button>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  );
};

export default Appointments;
