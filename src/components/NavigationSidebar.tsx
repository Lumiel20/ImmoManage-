import React from 'react';
import { motion } from 'motion/react';
import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  FileText, 
  Euro, 
  History, 
  Sun, 
  Moon, 
  LogOut 
} from 'lucide-react';
import { User } from '../types';

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
  badge?: number;
}

function SidebarItem({ icon, label, active, onClick, badge }: SidebarItemProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all uppercase tracking-wider cursor-pointer group ${
        active 
          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10' 
          : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
      }`}
    >
      <div className="flex items-center gap-3">
        <span className={`w-5 h-5 flex items-center justify-center transition-transform group-hover:scale-105 duration-200 ${
          active ? 'text-white' : 'text-neutral-500'
        }`}>
          {icon}
        </span>
        <span>{label}</span>
      </div>
      {badge !== undefined && badge > 0 && (
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-black ${
          active 
            ? 'bg-neutral-950 text-white' 
            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
        }`}>
          {badge}
        </span>
      )}
    </button>
  );
}

interface NavigationSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currency: 'EUR' | 'USD' | 'FCFA';
  setCurrency: (currency: 'EUR' | 'USD' | 'FCFA') => void;
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
  user: User | null;
  handleLogout: () => void;
  setToastMsg: (msg: string | null) => void;
  expiringBailsCount: number;
  lateContractsCount: number;
}

export function NavigationSidebar({
  activeTab,
  setActiveTab,
  currency,
  setCurrency,
  theme,
  setTheme,
  user,
  handleLogout,
  setToastMsg,
  expiringBailsCount,
  lateContractsCount
}: NavigationSidebarProps) {
  return (
    <motion.aside 
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="hidden md:flex w-64 border-r border-neutral-800 flex-col p-4 bg-neutral-900/50 backdrop-blur-xl shrink-0 h-screen"
    >
      <div id="side-header" className="flex items-center gap-3 px-2 mb-6">
        <img src="/logo.svg" className="w-8 h-8 select-none" alt="ImmoManage Logo" referrerPolicy="no-referrer" />
        <span className="font-bold text-white text-lg tracking-tight">ImmoManage</span>
      </div>

      {/* Currency Switcher (Devise) */}
      <div id="side-currency-wrapper" className="px-2 mb-6 shrink-0">
        <div className="grid grid-cols-3 gap-1 bg-neutral-950 p-1 rounded-xl border border-neutral-800/80">
          {(['EUR', 'USD', 'FCFA'] as const).map((curr) => (
            <button
              id={`curr-btn-${curr}`}
              key={curr}
              onClick={() => {
                setCurrency(curr);
                localStorage.setItem('immo_currency', curr);
                setToastMsg(`Devise configurée sur : ${curr === 'EUR' ? 'Euro (€)' : curr === 'USD' ? 'Dollar ($)' : 'Franc CFA (FCFA)'}`);
              }}
              className={`py-1.5 rounded-lg text-xs font-bold font-mono transition-all duration-200 cursor-pointer ${
                currency === curr
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/10'
                  : 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-900/50'
              }`}
            >
              {curr === 'EUR' ? 'EUR' : curr === 'USD' ? 'USD' : 'CFA'}
            </button>
          ))}
        </div>
      </div>

      <nav id="side-nav" className="flex-1 space-y-1">
        <SidebarItem 
          icon={<LayoutDashboard className="w-4 h-4" />} 
          label="Dashboard" 
          active={activeTab === 'dashboard'} 
          onClick={() => setActiveTab('dashboard')} 
        />
        <SidebarItem 
          icon={<Building2 className="w-4 h-4" />} 
          label="Biens Immo" 
          active={activeTab === 'biens'} 
          onClick={() => setActiveTab('biens')} 
        />
        <SidebarItem 
          icon={<Users className="w-4 h-4" />} 
          label="Clients" 
          active={activeTab === 'clients'} 
          onClick={() => setActiveTab('clients')} 
        />
        <SidebarItem 
          icon={<FileText className="w-4 h-4" />} 
          label="Contrats" 
          active={activeTab === 'contrats'} 
          onClick={() => setActiveTab('contrats')} 
          badge={expiringBailsCount > 0 ? expiringBailsCount : undefined}
        />
        <SidebarItem 
          icon={<Euro className="w-4 h-4" />} 
          label="Paiements" 
          active={activeTab === 'paiements'} 
          onClick={() => setActiveTab('paiements')} 
          badge={lateContractsCount > 0 ? lateContractsCount : undefined}
        />
        <SidebarItem 
          icon={<History className="w-4 h-4" />} 
          label="Historique" 
          active={activeTab === 'historique'} 
          onClick={() => setActiveTab('historique')} 
        />
      </nav>

      <div id="side-footer" className="mt-auto border-t border-neutral-800 pt-4 flex items-center justify-between px-2">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 text-xs font-bold border border-indigo-500/20 uppercase shrink-0">
            {user?.first_name ? user.first_name[0] : 'A'}
          </div>
          <div className="text-xs truncate">
            <p className="text-white font-medium">{user?.first_name ? `${user.first_name} ${user.last_name || ''}` : 'Administrateur'}</p>
            <p className="opacity-50 text-[10px] truncate">{user?.email || 'admin@example.com'}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0 ml-2">
          <button 
            id="theme-toggler"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} 
            className="text-neutral-500 hover:text-indigo-400 p-1.5 rounded-lg hover:bg-neutral-800/50 transition-colors cursor-pointer"
            title={theme === 'dark' ? 'Activer le mode clair' : 'Activer le mode sombre'}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-indigo-500" />}
          </button>
          <button 
            id="logout-btn"
            onClick={handleLogout} 
            className="text-neutral-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-neutral-800/50 transition-colors shrink-0 cursor-pointer" 
            title="Se déconnecter"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.aside>
  );
}
