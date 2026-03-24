import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  Stethoscope, 
  FileText, 
  Settings,
  HelpCircle,
  UserCircle,
  LogOut
} from 'lucide-react';

const Sidebar = () => {
  const { profile, clinic, signOut } = useAuth();
  const navigate = useNavigate();

  const navItems = [
    { icon: LayoutDashboard, label: 'Tableau de bord', path: '/' },
    { icon: Users, label: 'Patients', path: '/patients' },
    { icon: Calendar, label: 'Rendez-vous', path: '/appointments' },
    { icon: Stethoscope, label: 'Traitements', path: '/treatments' },
    { icon: FileText, label: 'Factures', path: '/invoices' },
    { icon: Settings, label: 'Paramètres', path: '/settings' },
  ];

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <aside className="w-64 bg-surface-container-lowest border-r border-outline-variant flex flex-col h-screen sticky top-0">
      <div className="p-8">
        <h1 className="text-2xl font-display font-bold text-primary">MINIDENT</h1>
        <p className="text-xs text-secondary tracking-widest uppercase mt-1">
          {clinic?.name || 'Chargement...'}
        </p>
      </div>

      <nav className="flex-1 px-4 space-y-2">
        <p className="px-4 text-xs font-semibold text-secondary uppercase tracking-wider mb-4">Menu Principal</p>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => 
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                isActive 
                ? 'bg-primary/10 text-primary font-semibold' 
                : 'text-secondary hover:bg-surface-container-low hover:text-primary'
              }`
            }
          >
            <item.icon size={20} className="group-hover:scale-110 transition-transform" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 mt-auto">
        <div className="bg-surface-container-low rounded-xl p-4 mb-4">
          <div className="flex items-center gap-3 text-sm text-secondary">
            <HelpCircle size={18} />
            <span>Besoin d'assistance ?</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between p-4 border-t border-outline-variant">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
              <UserCircle size={24} />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold">
                {profile?.full_name || 'Utilisateur'}
              </span>
              <span className="text-xs text-secondary capitalize">
                {profile?.role === 'admin' ? 'Administrateur' : 'Assistant'}
              </span>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="p-2 rounded-lg hover:bg-error/10 text-secondary hover:text-error transition-colors"
            title="Se déconnecter"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
