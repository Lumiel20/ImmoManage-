import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

interface PropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  editingProperty: any;
  propertyTitle: string;
  setPropertyTitle: (v: string) => void;
  propertyType: string;
  setPropertyType: (v: string) => void;
  propertyPrice: number;
  setPropertyPrice: (v: number) => void;
  propertyCity: string;
  setPropertyCity: (v: string) => void;
  propertyStatus: string;
  setPropertyStatus: (v: string) => void;
  propertySurface: number;
  setPropertySurface: (v: number) => void;
  propertyRooms: number;
  setPropertyRooms: (v: number) => void;
  propertyDescription: string;
  setPropertyDescription: (v: string) => void;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  attemptedSubmitOnProperty: boolean;
  markTouched: (field: string) => void;
}

export function PropertyModal({
  isOpen,
  onClose,
  onSubmit,
  editingProperty,
  propertyTitle,
  setPropertyTitle,
  propertyType,
  setPropertyType,
  propertyPrice,
  setPropertyPrice,
  propertyCity,
  setPropertyCity,
  propertyStatus,
  setPropertyStatus,
  propertySurface,
  setPropertySurface,
  propertyRooms,
  setPropertyRooms,
  propertyDescription,
  setPropertyDescription,
  errors,
  touched,
  attemptedSubmitOnProperty,
  markTouched,
}: PropertyModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl"
          >
            <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white font-sans">
                {editingProperty ? 'Edit Property' : 'New Property Portfolio Item'}
              </h3>
              <button onClick={onClose} className="text-neutral-400 hover:text-white transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={onSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto font-sans text-sm text-neutral-300">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-400">Title / Designation</label>
                <input 
                  type="text" 
                  value={propertyTitle} 
                  onChange={e => { setPropertyTitle(e.target.value); markTouched('propertyTitle'); }} 
                  onBlur={() => markTouched('propertyTitle')}
                  className={`w-full bg-neutral-950 border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 ${
                    errors.titre && (touched.propertyTitle || attemptedSubmitOnProperty)
                      ? 'border-rose-500 focus:ring-rose-500/40' 
                      : 'border-neutral-800 focus:ring-indigo-500/40'
                  }`}
                  placeholder="Cosy Apartment, Penthouse Villa..." 
                  required 
                />
                {errors.titre && (touched.propertyTitle || attemptedSubmitOnProperty) && (
                  <p className="text-[11px] text-rose-500 mt-1 font-medium">{errors.titre}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-400">Property Type</label>
                  <select 
                    value={propertyType} 
                    onChange={e => setPropertyType(e.target.value)} 
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 cursor-pointer"
                  >
                    <option value="appartement">Apartment</option>
                    <option value="maison">House</option>
                    <option value="bureau">Office</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-400 font-sans">Price</label>
                  <input 
                    type="number" 
                    value={propertyPrice} 
                    onChange={e => { setPropertyPrice(Number(e.target.value)); markTouched('propertyPrice'); }} 
                    className={`w-full bg-neutral-950 border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 ${
                      errors.prix && (touched.propertyPrice || attemptedSubmitOnProperty)
                        ? 'border-rose-500 focus:ring-rose-500/40' 
                        : 'border-neutral-800 focus:ring-indigo-500/40'
                    }`}
                    min="0" 
                    required 
                  />
                  {errors.prix && (touched.propertyPrice || attemptedSubmitOnProperty) && (
                    <p className="text-[11px] text-rose-500 mt-1 font-medium">{errors.prix}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1 col-span-2">
                  <label className="text-xs font-semibold text-neutral-400">City Location</label>
                  <input 
                    type="text" 
                    value={propertyCity} 
                    onChange={e => { setPropertyCity(e.target.value); markTouched('propertyCity'); }} 
                    className={`w-full bg-neutral-950 border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 ${
                      errors.ville && (touched.propertyCity || attemptedSubmitOnProperty)
                        ? 'border-rose-500 focus:ring-rose-500/40' 
                        : 'border-neutral-800 focus:ring-indigo-500/40'
                    }`}
                    placeholder="Paris, Nice, London..." 
                    required 
                  />
                  {errors.ville && (touched.propertyCity || attemptedSubmitOnProperty) && (
                    <p className="text-[11px] text-rose-500 mt-1 font-medium">{errors.ville}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-400">Status</label>
                  <select 
                    value={propertyStatus} 
                    onChange={e => setPropertyStatus(e.target.value)} 
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 cursor-pointer"
                  >
                    <option value="disponible">Available</option>
                    <option value="loué">Occupied</option>
                    <option value="vendu">Sold</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-400">Surface (sqm)</label>
                  <input 
                    type="number" 
                    value={propertySurface} 
                    onChange={e => { setPropertySurface(Number(e.target.value)); markTouched('propertySurface'); }} 
                    className={`w-full bg-neutral-950 border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 ${
                      errors.surface && (touched.propertySurface || attemptedSubmitOnProperty)
                        ? 'border-rose-500 focus:ring-rose-500/40' 
                        : 'border-neutral-800 focus:ring-indigo-500/40'
                    }`}
                    min="1" 
                  />
                  {errors.surface && (touched.propertySurface || attemptedSubmitOnProperty) && (
                    <p className="text-[11px] text-rose-500 mt-1 font-medium">{errors.surface}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-400 font-sans">Number of rooms</label>
                  <input 
                    type="number" 
                    value={propertyRooms} 
                    onChange={e => { setPropertyRooms(Number(e.target.value)); markTouched('propertyRooms'); }} 
                    className={`w-full bg-neutral-950 border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 ${
                      errors.nbPieces && (touched.propertyRooms || attemptedSubmitOnProperty)
                        ? 'border-rose-500 focus:ring-rose-500/40' 
                        : 'border-neutral-800 focus:ring-indigo-500/40'
                    }`}
                    min="1" 
                  />
                  {errors.nbPieces && (touched.propertyRooms || attemptedSubmitOnProperty) && (
                    <p className="text-[11px] text-rose-500 mt-1 font-medium">{errors.nbPieces}</p>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-400">Description</label>
                <textarea 
                  value={propertyDescription} 
                  onChange={e => setPropertyDescription(e.target.value)} 
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 h-24 resize-none"
                  placeholder="Attractive, copy-rich property description..." 
                />
              </div>

              <div className="pt-4 border-t border-neutral-800 flex justify-end gap-3 font-sans">
                <button 
                  type="button" 
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-sm font-semibold border border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-800 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-all cursor-pointer"
                >
                  Save Portfolio Item
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
