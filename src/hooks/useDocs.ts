import { useState } from 'react';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../firebase';
import { Lease, ContractDocument } from '../types';

interface UseDocsParams {
  token: string | null;
  addActionLog: (
    type: 'creation' | 'edition' | 'suppression',
    target: 'contrat' | 'bien' | 'locataire',
    title: string,
    description: string
  ) => void;
  setToastMsg: (msg: string | null) => void;
  setConfirmModal: (modal: any) => void;
}

export function useDocs({ token, addActionLog, setToastMsg, setConfirmModal }: UseDocsParams) {
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [selectedContratForDoc, setSelectedContratForDoc] = useState<Lease | null>(null);
  const [contractDocuments, setContractDocuments] = useState<ContractDocument[]>([]);
  const [docTitre, setDocTitre] = useState('');
  const [docType, setDocType] = useState('bail');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [docError, setDocError] = useState<string | null>(null);

  const fetchDocuments = async (contratId: number) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/v1/contrats/${contratId}/documents`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const json = await res.json();
      if (json.success) {
        setContractDocuments(json.data);
      } else {
        setDocError(json.error?.message || "Error retrieving documents from repository.");
      }
    } catch (err) {
      console.error(err);
      setDocError("Connection error.");
    }
  };

  const openDocModal = async (contrat: Lease) => {
    setSelectedContratForDoc(contrat);
    setIsDocModalOpen(true);
    setDocTitre('');
    setDocType('bail');
    setDocError(null);
    setUploadProgress(0);
    fetchDocuments(contrat.id);
  };

  const handleUploadDocument = async (file: File) => {
    if (!selectedContratForDoc || !token) return;
    if (!file) {
      setDocError("Please select a valid attachment file.");
      return;
    }

    setIsUploading(true);
    setDocError(null);
    setUploadProgress(0);

    const title = docTitre.trim() || file.name;
    const type = docType;

    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
    const storagePath = `contracts/${selectedContratForDoc.id}/${timestamp}_${safeName}`;
    
    try {
      const storageRef = ref(storage, storagePath);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on('state_changed', 
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(Math.round(progress));
        }, 
        async (error) => {
          console.warn("Firebase Storage failed, trying base64 fallback...", error);
          try {
            const reader = new FileReader();
            reader.onload = async (e) => {
              try {
                const downloadURL = e.target?.result as string;
                const res = await fetch(`/api/v1/contrats/${selectedContratForDoc.id}/documents`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                  },
                  body: JSON.stringify({
                    titre: title,
                    type: type,
                    url: downloadURL,
                    storage_path: null
                  })
                });
                const json = await res.json();
                if (json.success) {
                  setDocTitre('');
                  setUploadProgress(0);
                  fetchDocuments(selectedContratForDoc.id);
                  addActionLog(
                    'creation',
                    'contrat',
                    'Document linked to contract',
                    `The document "${title}" (${type}) was stored successfully (Base64 fallback).`
                  );
                } else {
                  setDocError(json.error?.message || "Database synchronization error.");
                }
              } catch (fallbackErr: any) {
                console.error(fallbackErr);
                setDocError(`Upload failed: ${fallbackErr.message}`);
              } finally {
                setIsUploading(false);
              }
            };
            reader.onerror = () => {
              setDocError(`Failed to read the local file format payload.`);
              setIsUploading(false);
            };
            reader.readAsDataURL(file);
          } catch (readerErr) {
            setDocError(`Fallback transfer failure encountered.`);
            setIsUploading(false);
          }
        }, 
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            
            const res = await fetch(`/api/v1/contrats/${selectedContratForDoc.id}/documents`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                titre: title,
                type: type,
                url: downloadURL,
                storage_path: storagePath
              })
            });
            const json = await res.json();
            if (json.success) {
              setDocTitre('');
              setUploadProgress(0);
              fetchDocuments(selectedContratForDoc.id);
              addActionLog(
                'creation',
                'contrat',
                'Document associated to lease contract',
                `The document "${title}" (${type}) has been uploaded and linked to "${selectedContratForDoc.bien_titre}".`
              );
            } else {
              setDocError(json.error?.message || "Database synchronization error.");
              try {
                await deleteObject(storageRef);
              } catch (delErr) {
                console.error(delErr);
              }
            }
          } catch (err: any) {
            console.error(err);
            setDocError(err.message || 'Error occurred during Database synchronization.');
          } finally {
            setIsUploading(false);
          }
        }
      );
    } catch (err: any) {
      console.error(err);
      setDocError(err.message || "Error occurred during file ingestion.");
      setIsUploading(false);
    }
  };

  const handleDeleteDocument = (docId: number, storagePath: string) => {
    if (!selectedContratForDoc || !token) return;

    setConfirmModal({
      isOpen: true,
      title: "Delete Document permanently?",
      message: "Are you sure you want to delete this document from the tenant file? This action is irreversible.",
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/v1/contrats/${selectedContratForDoc.id}/documents/${docId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          const json = await res.json();
          if (json.success) {
            if (storagePath) {
              try {
                const storageRef = ref(storage, storagePath);
                await deleteObject(storageRef);
              } catch (err) {
                console.warn("Storage deletion warning (file might have been already removed):", err);
              }
            }
            fetchDocuments(selectedContratForDoc.id);
            addActionLog(
              'suppression',
              'contrat',
              'Contract document removed',
              `A document was permanently deleted from "${selectedContratForDoc.bien_titre}".`
            );
            setToastMsg("Document deleted successfully !");
          } else {
            setToastMsg(json.error?.message || "Error during permanent deletion.");
          }
        } catch (err) {
          console.error(err);
          setToastMsg("Connection error.");
        } finally {
          setConfirmModal(null);
        }
      }
    });
  };

  return {
    isDocModalOpen, setIsDocModalOpen,
    selectedContratForDoc, setSelectedContratForDoc,
    contractDocuments, setContractDocuments,
    docTitre, setDocTitre,
    docType, setDocType,
    isUploading, setIsUploading,
    uploadProgress, setUploadProgress,
    docError, setDocError,
    
    // Methods
    fetchDocuments,
    openDocModal,
    handleUploadDocument,
    handleDeleteDocument
  };
}
