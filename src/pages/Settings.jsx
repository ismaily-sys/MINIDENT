import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Building2, User, LogOut, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

/**
 * Settings Page
 * Manage clinic and profile settings
 */
const Settings = () => {
  const { clinic, profile, updateClinic, updateProfile, signOut, isAdmin } = useAuth();
  const [clinicName, setClinicName] = useState(clinic?.name || '');
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [saving, setSaving] = useState(false);

  // Save clinic settings
  const handleSaveClinic = async (e) => {
    e.preventDefault();
    if (!clinicName.trim()) {
      toast.error('Le nom de la clinique est requis');
      return;
    }
    
    try {
      setSaving(true);
      await updateClinic({ name: clinicName });
      toast.success('Clinique mise à jour');
    } catch (error) {
      console.error('Error updating clinic:', error);
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setSaving(false);
    }
  };

  // Save profile settings
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!fullName.trim()) {
      toast.error('Le nom est requis');
      return;
    }
    
    try {
      setSaving(true);
      await updateProfile({ full_name: fullName });
      toast.success('Profil mis à jour');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setSaving(false);
    }
  };

  // Handle sign out
  const handleSignOut = async () => {
    if (!confirm('Êtes-vous sûr de vouloir vous déconnecter?')) return;
    
    try {
      await signOut();
      toast.success('Déconnexion réussie');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Erreur lors de la déconnexion');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-display font-bold text-on-surface">Paramètres</h1>
        <p className="text-secondary mt-1">Gérez vos paramètres de compte</p>
      </div>

      {/* Profile Settings */}
      <div className="bg-surface-container-lowest rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <User size={20} className="text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-on-surface">Profil</h2>
            <p className="text-sm text-secondary">Vos informations personnelles</p>
          </div>
        </div>
        
        <form onSubmit={handleSaveProfile} className="space-y-4 max-w-md">
          <Input
            label="Nom complet"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Dr. Jean Dupont"
          />
          
          <div>
            <label className="block text-sm font-medium text-on-surface mb-1">
              Email
            </label>
            <input
              type="email"
              value={profile?.id ? 'Chargé...' : ''}
              disabled
              className="w-full py-2.5 px-4 bg-surface-container-low border border-outline-variant rounded-lg text-secondary cursor-not-allowed"
            />
            <p className="text-xs text-secondary mt-1">L'email ne peut pas être modifié</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-on-surface mb-1">
              Rôle
            </label>
            <input
              type="text"
              value={profile?.role === 'admin' ? 'Administrateur' : 'Assistant'}
              disabled
              className="w-full py-2.5 px-4 bg-surface-container-low border border-outline-variant rounded-lg text-secondary cursor-not-allowed"
            />
          </div>
          
          <Button type="submit" icon={Save} loading={saving}>
            Enregistrer le profil
          </Button>
        </form>
      </div>

      {/* Clinic Settings (Admin only) */}
      {isAdmin && (
        <div className="bg-surface-container-lowest rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center">
              <Building2 size={20} className="text-secondary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-on-surface">Clinique</h2>
              <p className="text-sm text-secondary">Paramètres de votre clinique</p>
            </div>
          </div>
          
          <form onSubmit={handleSaveClinic} className="space-y-4 max-w-md">
            <Input
              label="Nom de la clinique"
              value={clinicName}
              onChange={(e) => setClinicName(e.target.value)}
              placeholder="Clinique Dentaire"
            />
            
            <Button type="submit" icon={Save} loading={saving}>
              Enregistrer la clinique
            </Button>
          </form>
        </div>
      )}

      {/* Danger Zone */}
      <div className="bg-surface-container-lowest rounded-2xl p-6 border border-error/20">
        <h2 className="text-lg font-semibold text-error mb-4">Zone de danger</h2>
        <p className="text-secondary mb-4">
          Ces actions sont irréversibles. Procédez avec prudence.
        </p>
        <Button variant="danger" icon={LogOut} onClick={handleSignOut}>
          Se déconnecter
        </Button>
      </div>
    </div>
  );
};

export default Settings;
