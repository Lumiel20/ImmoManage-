import React from 'react';
import { Plus, Eye, Edit, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';

interface TenantsTabProps {
  openNewLocataire: () => void;
  locataires: any[];
  setSelectedClientForDetails: (loc: any) => void;
  setIsClientDetailsOpen: (isOpen: boolean) => void;
  formatPrice: (amount: number | null | undefined, rawOnlySymbol?: boolean) => string;
  openEditLocataire: (loc: any) => void;
  handleDeleteLocataire: (id: number) => void;
}

export function TenantsTab({
  openNewLocataire,
  locataires,
  setSelectedClientForDetails,
  setIsClientDetailsOpen,
  formatPrice,
  openEditLocataire,
  handleDeleteLocataire
}: TenantsTabProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }} 
      className="space-y-6 animate-fade-in"
    >
      <header className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-white tracking-tight font-sans">Tenants</h2>
        <button onClick={openNewLocataire} className="bg-indigo-600 hover:bg-indigo-500 text-sm font-semibold px-4 py-2 rounded-xl text-white transition-all transform active:scale-95 flex items-center gap-2 shadow-lg shadow-indigo-600/20 cursor-pointer font-sans">
          <Plus className="w-4 h-4" /> Add tenant
        </button>
      </header>
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
        {locataires.length === 0 ? (
          <div className="p-8 text-center text-neutral-500 italic font-sans animate-fade-in">No tenants found.</div>
        ) : (
          <div className="overflow-x-auto w-full scrollbar-none">
            <table className="w-full text-left border-collapse min-w-[700px] md:min-w-0 font-sans">
              <thead>
                <tr className="border-b border-neutral-800 text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  <th className="px-6 py-4">Full Name</th>
                  <th className="px-6 py-4">Email / Phone</th>
                  <th className="px-6 py-4">Occupation</th>
                  <th className="px-6 py-4">Monthly Income</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800 text-sm">
                {locataires.map(loc => (
                  <tr key={loc.id} className="hover:bg-neutral-800/40 transition-colors">
                    <td className="px-6 py-4">
                      <button
                        onClick={() => {
                          setSelectedClientForDetails(loc);
                          setIsClientDetailsOpen(true);
                        }}
                        className="font-semibold text-indigo-400 hover:text-indigo-300 hover:underline transition-colors focus:outline-none text-left cursor-pointer flex items-center gap-1.5 group font-sans bg-transparent border-0 p-0"
                        title="View Detailed Record"
                      >
                        {loc.first_name} {loc.last_name}
                        <Eye className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-indigo-400" />
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-white">{loc.email}</p>
                      <p className="text-neutral-500 text-xs">{loc.phone || 'No phone number'}</p>
                    </td>
                    <td className="px-6 py-4">{loc.profession || 'N/A'}</td>
                    <td className="px-6 py-4 font-mono">{formatPrice(loc.revenu_mensuel)}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEditLocataire(loc)} className="text-amber-400 hover:bg-amber-500/10 p-2 rounded-lg transition-colors cursor-pointer border-0 bg-transparent" title="Edit">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDeleteLocataire(loc.id)} className="text-rose-500 hover:bg-rose-500/10 p-2 rounded-lg transition-colors cursor-pointer border-0 bg-transparent" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  );
}
