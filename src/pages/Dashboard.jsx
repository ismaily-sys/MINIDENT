import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { patientsService, appointmentsService, treatmentsService, invoicesService } from '../services';
import { Users, Calendar, FileText, TrendingUp, Clock, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';

/**
 * Dashboard Page
 * Shows statistics and today's appointments
 */
const Dashboard = () => {
  const { clinic } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPatients: 0,
    todayAppointments: 0,
    pendingInvoices: 0,
    monthlyRevenue: 0,
  });
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);

  useEffect(() => {
    if (clinic?.id) {
      loadDashboardData();
    } else {
      setLoading(false);
    }
  }, [clinic?.id]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load all data in parallel
      const [
        patientsStats,
        todayCount,
        pendingCount,
        monthlyRevenue,
        todayAppts,
        upcomingAppts,
      ] = await Promise.all([
        patientsService.getStats(clinic.id),
        appointmentsService.getTodayCount(clinic.id),
        invoicesService.getPendingCount(clinic.id),
        treatmentsService.getMonthlyRevenue(clinic.id),
        appointmentsService.getByDate(clinic.id, new Date().toISOString().split('T')[0]),
        appointmentsService.getUpcoming(clinic.id, 5),
      ]);
      
      setStats({
        totalPatients: patientsStats.total,
        todayAppointments: todayCount,
        pendingInvoices: pendingCount,
        monthlyRevenue,
      });
      setTodayAppointments(todayAppts);
      setUpcomingAppointments(upcomingAppts);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-MA', {
      style: 'currency',
      currency: 'MAD',
    }).format(amount);
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-display font-bold text-on-surface">Tableau de bord</h1>
        <p className="text-secondary mt-1">Bienvenue! Voici un aperçu de votre activité.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Patients"
          value={stats.totalPatients}
          icon={Users}
          color="primary"
        />
        <StatCard
          title="Rendez-vous aujourd'hui"
          value={stats.todayAppointments}
          icon={Calendar}
          color="secondary"
        />
        <StatCard
          title="Factures en attente"
          value={stats.pendingInvoices}
          icon={FileText}
          color="warning"
        />
        <StatCard
          title="Revenu mensuel"
          value={formatCurrency(stats.monthlyRevenue)}
          icon={TrendingUp}
          color="success"
        />
      </div>

      {/* Today's Appointments */}
      <div className="bg-surface-container-lowest rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-on-surface">Rendez-vous d'aujourd'hui</h2>
          <Link to="/appointments">
            <Button variant="ghost" size="sm" icon={ArrowRight} iconPosition="right">
              Voir tout
            </Button>
          </Link>
        </div>
        
        {todayAppointments.length === 0 ? (
          <p className="text-secondary text-center py-8">Aucun rendez-vous aujourd'hui</p>
        ) : (
          <div className="space-y-3">
            {todayAppointments.map((appointment) => (
              <div
                key={appointment.id}
                className="flex items-center justify-between p-4 bg-surface-container-low rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <Clock size={18} className="text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-on-surface">
                      {appointment.patient?.name || 'Patient inconnu'}
                    </p>
                    <p className="text-sm text-secondary">
                      {formatTime(appointment.date)}
                    </p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  appointment.status === 'completed'
                    ? 'bg-success/20 text-success'
                    : appointment.status === 'cancelled'
                    ? 'bg-error/20 text-error'
                    : 'bg-warning/20 text-warning'
                }`}>
                  {appointment.status === 'completed' ? 'Terminé' : 
                   appointment.status === 'cancelled' ? 'Annulé' : 'En attente'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upcoming Appointments */}
      <div className="bg-surface-container-lowest rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-on-surface">Prochains rendez-vous</h2>
          <Link to="/appointments">
            <Button variant="ghost" size="sm" icon={ArrowRight} iconPosition="right">
              Voir tout
            </Button>
          </Link>
        </div>
        
        {upcomingAppointments.length === 0 ? (
          <p className="text-secondary text-center py-8">Aucun rendez-vous à venir</p>
        ) : (
          <div className="space-y-3">
            {upcomingAppointments.map((appointment) => (
              <div
                key={appointment.id}
                className="flex items-center justify-between p-4 bg-surface-container-low rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center">
                    <Calendar size={18} className="text-secondary" />
                  </div>
                  <div>
                    <p className="font-medium text-on-surface">
                      {appointment.patient?.name || 'Patient inconnu'}
                    </p>
                    <p className="text-sm text-secondary">
                      {new Date(appointment.date).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Stat Card Component
 */
const StatCard = ({ title, value, icon: Icon, color }) => {
  const colors = {
    primary: 'bg-primary/20 text-primary',
    secondary: 'bg-secondary/20 text-secondary',
    success: 'bg-success/20 text-success',
    warning: 'bg-warning/20 text-warning',
    error: 'bg-error/20 text-error',
  };
  
  return (
    <div className="bg-surface-container-lowest rounded-2xl p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-secondary">{title}</p>
          <p className="text-2xl font-bold text-on-surface mt-1">{value}</p>
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colors[color]}`}>
          <Icon size={24} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
