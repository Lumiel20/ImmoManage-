import React from 'react';
import { Plus, Search, MapPin, Edit, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import { Property } from '../types';
import { BienCardSkeleton } from './Skeletons';

interface PropertiesTabProps {
  openNewBien: () => void;
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  filterType: string;
  setFilterType: (val: string) => void;
  loadingBiens: boolean;
  filteredBiens: Property[];
  formatPrice: (amount: number | null | undefined, rawOnlySymbol?: boolean) => string;
  openEditBien: (prop: Property) => void;
  handleDeleteBien: (id: number) => void;
}

export function PropertiesTab({
  openNewBien,
  searchTerm,
  setSearchTerm,
  filterType,
  setFilterType,
  loadingBiens,
  filteredBiens,
  formatPrice,
  openEditBien,
  handleDeleteBien
}: PropertiesTabProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }} 
      className="space-y-6"
    >
      <header className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-white tracking-tight">Properties</h2>
        <button onClick={openNewBien} className="bg-indigo-600 hover:bg-indigo-500 text-sm font-semibold px-4 py-2 rounded-xl text-white transition-all transform active:scale-95 flex items-center gap-2 shadow-lg shadow-indigo-600/20 cursor-pointer">
          <Plus className="w-4 h-4" /> Add property
        </button>
      </header>
      
      {/* Search filter bar */}
      <div className="flex flex-col sm:flex-row gap-4 p-4 bg-neutral-900 border border-neutral-800 rounded-2xl">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <input 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by city, title..." 
            className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500" 
          />
        </div>
        <select 
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="bg-neutral-950 border border-neutral-800 text-sm rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
        >
          <option value="Tous">Type: All</option>
          <option value="appartement">Apartment</option>
          <option value="maison">House</option>
          <option value="bureau">Office</option>
        </select>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loadingBiens ? (
          Array.from({ length: 6 }).map((_, i) => (
            <BienCardSkeleton key={i} />
          ))
        ) : (
          filteredBiens.map((prop, i) => (
            <motion.div 
              key={prop.id} 
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: Math.min(i * 0.05, 0.3), ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ y: -4, scale: 1.01 }}
              className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden group hover:border-neutral-700 transition-all flex flex-col justify-between shadow-md hover:shadow-xl"
            >
              <div>
                <div className="aspect-[4/3] bg-neutral-800 relative overflow-hidden">
                  <img src={`https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=800`} alt="house" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" referrerPolicy="no-referrer" />
                  <div className="absolute top-4 right-4 px-3 py-1 bg-black/50 backdrop-blur-md rounded-full text-[10px] font-bold text-white uppercase tracking-widest border border-white/10 font-sans">
                    {prop.type === 'appartement' ? 'Apartment' : prop.type === 'bureau' ? 'Office' : 'House'}
                  </div>
                </div>
                <div className="p-5 space-y-2">
                  <div className="flex justify-between items-start gap-2">
                    <h4 className="text-white font-semibold truncate leading-tight font-sans">{prop.titre}</h4>
                    <span className={`px-2 py-0.5 shrink-0 rounded-full text-[10px] font-bold uppercase tracking-widest font-sans ${
                      prop.statut === 'disponible' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}>
                      {prop.statut === 'disponible' ? 'Available' : 'Occupied'}
                    </span>
                  </div>
                  <p className="text-neutral-500 text-xs flex items-center gap-1 font-sans"><MapPin className="w-3 h-3"/> {prop.ville}</p>
                  <p className="text-neutral-400 text-xs line-clamp-2 mt-2 leading-relaxed font-sans">
                    {prop.description || "No description provided for this premium property."}
                  </p>
                  <div className="flex gap-4 text-xs font-mono text-neutral-500 mt-2">
                    <span>{prop.surface || 45} m²</span>
                    <span>•</span>
                    <span>{prop.nb_pieces || 2} rooms</span>
                  </div>
                </div>
              </div>
              <div className="px-5 pb-5 pt-2 flex justify-between items-center bg-neutral-900/50 border-t border-neutral-800/40">
                <span className="text-lg font-bold text-white leading-none font-mono">{formatPrice(prop.prix)}</span>
                <div className="flex items-center gap-1">
                  <button onClick={() => openEditBien(prop)} className="text-amber-400 hover:bg-amber-500/10 p-2 rounded-lg transition-colors cursor-pointer" title="Edit">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDeleteBien(prop.id)} className="text-rose-500 hover:bg-rose-500/10 p-2 rounded-lg transition-colors cursor-pointer" title="Delete">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        )}
        {!loadingBiens && filteredBiens.length === 0 && (
          <div className="col-span-full py-12 text-center text-neutral-500 italic font-sans">
            No properties found matching filters.
          </div>
        )}
      </div>
    </motion.div>
  );
}
