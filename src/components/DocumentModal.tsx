import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Paperclip, UploadCloud, AlertTriangle, FileText, Trash2 } from 'lucide-react';

interface DocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedContratForDoc: any;
  docTitre: string;
  setDocTitre: (v: string) => void;
  docType: string;
  setDocType: (v: string) => void;
  isUploading: boolean;
  uploadProgress: number;
  docError: string | null;
  contractDocuments: any[];
  handleUploadDocument: (file: File) => void;
  handleDeleteDocument: (id: number, storagePath: string) => void;
}

export function DocumentModal({
  isOpen,
  onClose,
  selectedContratForDoc,
  docTitre,
  setDocTitre,
  docType,
  setDocType,
  isUploading,
  uploadProgress,
  docError,
  contractDocuments,
  handleUploadDocument,
  handleDeleteDocument,
}: DocumentModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]"
          >
            <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2 font-sans">
                  <Paperclip className="w-5 h-5 text-indigo-400" /> Document Management (GED)
                </h3>
                <p className="text-xs text-neutral-400 mt-1 font-sans">
                  Lease Asset: <strong className="text-neutral-200">{selectedContratForDoc?.bien_titre}</strong> ({selectedContratForDoc?.type === 'bail' ? 'Rent' : 'Sale'})
                </p>
              </div>
              <button onClick={onClose} className="text-neutral-400 hover:text-white transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto flex-1 font-sans text-sm text-neutral-300">
              {/* Formulaire d'ajout */}
              <div className="bg-neutral-950/60 p-4 rounded-xl border border-neutral-800 space-y-4">
                <h4 className="text-xs font-bold text-white uppercase tracking-widest text-indigo-400">Add a file document</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-neutral-400">Custom Title (Optional)</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Rent Receipt January 2026, Original lease..."
                      value={docTitre}
                      onChange={e => setDocTitre(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-neutral-400">Document Classification Type</label>
                    <select 
                      value={docType}
                      onChange={e => setDocType(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 cursor-pointer"
                    >
                      <option value="bail">Lease Agreement (PDF)</option>
                      <option value="quittance">Rent Receipt Ledger (PDF)</option>
                      <option value="autre">Other Generic Attachment</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-neutral-400 block">Select or Drag file (PDF, Photos)</label>
                  <div className="border border-dashed border-neutral-800 hover:border-indigo-500/40 rounded-xl p-6 text-center cursor-pointer transition-colors relative bg-neutral-900/40 group">
                    <input 
                      type="file"
                      accept="application/pdf,image/*"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) handleUploadDocument(file);
                      }}
                      disabled={isUploading}
                      className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
                    />
                    <div className="flex flex-col items-center justify-center gap-2">
                      <UploadCloud className="w-8 h-8 text-neutral-500 group-hover:text-indigo-400 transition-colors" />
                      <span className="text-xs font-medium text-neutral-300">
                        {isUploading ? "Uploading file payload..." : "Click or drag standard attachments to upload"}
                      </span>
                      <span className="text-[10px] text-neutral-550 block">Only standard PDF or Photo dimensions are certified</span>
                    </div>
                  </div>
                </div>

                {isUploading && (
                  <div className="space-y-1.5 pt-1">
                    <div className="flex justify-between text-[11px] font-sans">
                      <span className="text-neutral-400">Transfer in progress...</span>
                      <span className="text-indigo-400 font-bold font-mono">{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-neutral-900 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-indigo-600 h-full rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                    </div>
                  </div>
                )}

                {docError && (
                  <div className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 p-3 rounded-lg flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{docError}</span>
                  </div>
                )}
              </div>

              {/* Liste des documents existants */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-white uppercase tracking-widest text-neutral-400 flex items-center justify-between">
                  <span>Attached Documents Database ({contractDocuments.length})</span>
                </h4>

                {contractDocuments.length === 0 ? (
                  <div className="p-8 text-center bg-neutral-950/20 border border-neutral-850 rounded-xl text-neutral-500 text-xs italic">
                    No documents are currently linked to this legal agreement.
                  </div>
                ) : (
                  <div className="divide-y divide-neutral-800 border border-neutral-800 rounded-xl overflow-hidden bg-neutral-950/40">
                    {contractDocuments.map(doc => (
                      <div key={doc.id} className="p-3.5 flex items-center justify-between gap-4 text-xs hover:bg-neutral-900/60 transition-colors">
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="p-2 bg-neutral-900 border border-neutral-800 rounded-lg text-neutral-400">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-white truncate">{doc.titre}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                                doc.type === 'bail' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10' :
                                doc.type === 'quittance' ? 'bg-sky-500/10 text-sky-400 border border-sky-500/10' :
                                'bg-indigo-500/10 text-indigo-400 border border-indigo-500/10'
                              }`}>
                                {doc.type === 'bail' ? 'Lease' : doc.type === 'quittance' ? 'Receipt' : 'Other'}
                              </span>
                              <span className="text-[10px] text-neutral-500 font-mono">
                                {doc.created_at ? new Date(doc.created_at).toLocaleDateString() : 'Just now'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <a 
                            href={doc.url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white border border-indigo-500/10 px-2.5 py-1.5 rounded-lg font-bold text-[10px] transition-all"
                          >
                            View File
                          </a>
                          <button 
                            onClick={() => handleDeleteDocument(doc.id, doc.storage_path)}
                            className="text-neutral-500 hover:text-rose-400 hover:bg-rose-500/10 p-1.5 rounded-lg transition-colors cursor-pointer"
                            title="Delete file permanently"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-neutral-800 bg-neutral-950/40 flex justify-end font-sans">
              <button 
                onClick={onClose}
                className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-semibold px-4 py-2 rounded-xl text-xs transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
