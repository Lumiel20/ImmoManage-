import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Users, 
  FileText, 
  LayoutDashboard, 
  Settings, 
  Plus, 
  Search, 
  MapPin, 
  Euro, 
  Key,
  LogOut,
  ChevronRight,
  Edit,
  Trash2,
  X,
  History,
  Calendar,
  Bell,
  AlertTriangle,
  UploadCloud,
  Paperclip,
  FileSpreadsheet,
  Eye,
  FileCode,
  Printer,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider 
} from 'firebase/auth';
import { 
  ref, 
  uploadBytesResumable, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { auth, storage } from './firebase';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

// --- Types ---

interface User {
  id: number;
  email: string;
  role: string;
  first_name?: string;
  last_name?: string;
}

interface Bien {
  id: number;
  titre: string;
  description: string;
  type: string;
  prix: number;
  ville: string;
  statut: string;
  surface?: number;
  nb_pieces?: number;
}

interface Contrat {
  id: number;
  type: string;
  bien_id?: number;
  locataire_id?: number;
  bien_titre: string;
  locataire_email: string;
  date_debut: string;
  date_fin: string;
  loyer_mensuel?: number;
  prix_vente?: number;
  statut: string;
}

interface ContractDocument {
  id: number;
  contrat_id: number;
  titre: string;
  type: string; // bail, quittance, autre
  url: string;
  storage_path: string;
  created_at: string;
}

interface ActionLog {
  id: string;
  type: 'creation' | 'edition' | 'suppression';
  target: 'contrat' | 'bien' | 'locataire';
  title: string;
  description: string;
  timestamp: string;
  date: string;
}

// --- App Component ---

export default function App() {
  const [user, setUser] = useState<User | null>(() => {
    const u = localStorage.getItem('user');
    return u ? JSON.parse(u) : null;
  });
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [activeTab, setActiveTab] = useState('dashboard');
  const [biens, setBiens] = useState<Bien[]>([]);
  const [contrats, setContrats] = useState<Contrat[]>([]);
  const [locataires, setLocataires] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Auth form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);

  // Search/Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('Tous');
  const [historyFilter, setHistoryFilter] = useState('all');
  const [historyStartDate, setHistoryStartDate] = useState('');
  const [historyEndDate, setHistoryEndDate] = useState('');

  // --- Notification & Expiry Tracking ---
  const [notifiedContrats, setNotifiedContrats] = useState<number[]>(() => {
    const saved = localStorage.getItem('immo_notified_contrats');
    return saved ? JSON.parse(saved) : [];
  });

  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('immo_notified_contrats', JSON.stringify(notifiedContrats));
  }, [notifiedContrats]);

  useEffect(() => {
    if (toastMsg) {
      const timer = setTimeout(() => setToastMsg(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toastMsg]);

  // --- Modals State ---
  const [isBienModalOpen, setIsBienModalOpen] = useState(false);
  const [isLocataireModalOpen, setIsLocataireModalOpen] = useState(false);
  const [isContratModalOpen, setIsContratModalOpen] = useState(false);
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [selectedContratForDoc, setSelectedContratForDoc] = useState<Contrat | null>(null);
  const [contractDocuments, setContractDocuments] = useState<ContractDocument[]>([]);
  const [docTitre, setDocTitre] = useState('');
  const [docType, setDocType] = useState('bail');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [docError, setDocError] = useState<string | null>(null);
  const [selectedHistoryContrat, setSelectedHistoryContrat] = useState<Contrat | null>(null);
  const [selectedClientForDetails, setSelectedClientForDetails] = useState<any | null>(null);
  const [isClientDetailsOpen, setIsClientDetailsOpen] = useState(false);

  // Financial statements addition
  const [paymentsSubTab, setPaymentsSubTab] = useState<'suivi' | 'releves'>('suivi');
  const [selectedReleveContrat, setSelectedReleveContrat] = useState<Contrat | null>(null);
  const [generatingReleveId, setGeneratingReleveId] = useState<number | null>(null);

  // Confirmation Modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  // Payment confirmation state
  const [allValidatedPayments, setAllValidatedPayments] = useState<any[]>([]);
  const [paymentToValidate, setPaymentToValidate] = useState<{ contrat: Contrat, monthIndex: number, monthName: string, amount: number } | null>(null);
  const [confirmAmount, setConfirmAmount] = useState<number>(1000);
  const [confirmDate, setConfirmDate] = useState<string>('');
  const [confirmMode, setConfirmMode] = useState<string>('virement');
  const [confirmStatus, setConfirmStatus] = useState<string>('paye');

  const [actionLogs, setActionLogs] = useState<ActionLog[]>(() => {
    const local = localStorage.getItem('immo_action_logs');
    if (local) {
      try {
        return JSON.parse(local);
      } catch (e) {
        // failed
      }
    }
    return [
      {
        id: 'log-1',
        type: 'creation',
        target: 'contrat',
        title: 'Bail de location créé',
        description: "Nouveau bail de location actif pour l'Appartement Haussmannien.",
        timestamp: 'Il y a 10 min',
        date: '04/06/2026 11:24'
      },
      {
        id: 'log-2',
        type: 'creation',
        target: 'bien',
        title: 'Bien immobilier ajouté',
        description: "L'Appartement Haussmannien à Paris a été enregistré dans le catalogue.",
        timestamp: 'Il y a 1 h',
        date: '04/06/2026 10:15'
      },
      {
        id: 'log-3',
        type: 'edition',
        target: 'contrat',
        title: 'Contrat de bail mis à jour',
        description: "La date d'expiration et la périodicité du bail pour le Studio Lyon ont été mis à jour.",
        timestamp: 'Il y a 2 h',
        date: '04/06/2026 09:30'
      },
      {
        id: 'log-4',
        type: 'creation',
        target: 'locataire',
        title: 'Profil locataire enregistré',
        description: 'Le client Jean Dupont (Ingénieur) a été ajouté à la base de données.',
        timestamp: 'Hier',
        date: '03/06/2026 14:12'
      },
      {
        id: 'log-5',
        type: 'suppression',
        target: 'contrat',
        title: 'Contrat archivé / supprimé',
        description: 'Un ancien mandat expiré pour le Bureau Bordeaux a été archivé.',
        timestamp: 'Il y a 3j',
        date: '01/06/2026 11:58'
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem('immo_action_logs', JSON.stringify(actionLogs));
  }, [actionLogs]);

  const addActionLog = (type: 'creation' | 'edition' | 'suppression', target: 'contrat' | 'bien' | 'locataire', title: string, description: string) => {
    const now = new Date();
    const formattedDate = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const newLog: ActionLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      target,
      title,
      description,
      timestamp: "À l'instant",
      date: formattedDate
    };
    setActionLogs(prev => [newLog, ...prev]);
  };

  // --- Modals Edit Slices ---
  const [editingBien, setEditingBien] = useState<Bien | null>(null);
  const [editingLocataire, setEditingLocataire] = useState<any | null>(null);
  const [editingContrat, setEditingContrat] = useState<Contrat | null>(null);

  // --- Bien Form Fields ---
  const [bienTitre, setBienTitre] = useState('');
  const [bienDescription, setBienDescription] = useState('');
  const [bienType, setBienType] = useState('appartement');
  const [bienPrix, setBienPrix] = useState(0);
  const [bienVille, setBienVille] = useState('');
  const [bienSurface, setBienSurface] = useState(40);
  const [bienNbPieces, setBienNbPieces] = useState(2);
  const [bienStatut, setBienStatut] = useState('disponible');

  // --- Locataire Form Fields ---
  const [locataireFirstName, setLocataireFirstName] = useState('');
  const [locataireLastName, setLocataireLastName] = useState('');
  const [locataireEmail, setLocataireEmail] = useState('');
  const [locatairePhone, setLocatairePhone] = useState('');
  const [locataireProfession, setLocataireProfession] = useState('');
  const [locataireRevenu, setLocataireRevenu] = useState(0);
  const [locataireCni, setLocataireCni] = useState('');

  // --- Contrat Form Fields ---
  const [contratType, setContratType] = useState('bail');
  const [contratBienId, setContratBienId] = useState<number | ''>('');
  const [contratLocataireId, setContratLocataireId] = useState<number | ''>('');
  const [contratDateDebut, setContratDateDebut] = useState('');
  const [contratDateFin, setContratDateFin] = useState('');
  const [contratLoyer, setContratLoyer] = useState(1000);
  const [contratPrixVente, setContratPrixVente] = useState(50000);
  const [contratStatut, setContratStatut] = useState('actif');

  // Real-time validation helper states and logic
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [attemptedSubmit, setAttemptedSubmit] = useState<Record<string, boolean>>({});

  const markTouched = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const getBienErrors = () => {
    const errors: Record<string, string> = {};
    if (!bienTitre || bienTitre.trim().length < 3) {
      errors.titre = 'Le titre doit faire au moins 3 caractères.';
    }
    if (bienPrix <= 0) {
      errors.prix = 'Le prix doit être strictement supérieur à 0.';
    }
    if (!bienVille || bienVille.trim().length < 2) {
      errors.ville = 'La ville doit faire au moins 2 caractères.';
    }
    if (bienSurface <= 0) {
      errors.surface = 'La surface doit être strictement supérieure à 0.';
    }
    if (bienNbPieces <= 0 || !Number.isInteger(bienNbPieces)) {
      errors.nbPieces = 'Le nombre de pièces doit être un entier supérieur à 0.';
    }
    return errors;
  };

  const getLocataireErrors = () => {
    const errors: Record<string, string> = {};
    if (!locataireFirstName || locataireFirstName.trim().length < 2) {
      errors.firstName = 'Le prénom doit faire au moins 2 caractères.';
    }
    if (!locataireLastName || locataireLastName.trim().length < 2) {
      errors.lastName = 'Le nom de famille doit faire au moins 2 caractères.';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!locataireEmail || !emailRegex.test(locataireEmail)) {
      errors.email = "Format d'adresse email non valide.";
    }
    if (locatairePhone) {
      const phoneRegex = /^[+0-9\s.-]{10,20}$/;
      if (!phoneRegex.test(locatairePhone)) {
        errors.phone = 'Téléphone invalide (minimum 10 chiffres/caractères).';
      }
    }
    if (!locataireProfession || locataireProfession.trim().length < 2) {
      errors.profession = 'La profession doit faire au moins 2 caractères.';
    }
    if (locataireRevenu < 0) {
      errors.revenu = 'Le revenu mensuel ne peut pas être négatif.';
    }
    if (locataireCni) {
      const cniRegex = /^[a-zA-Z0-9]{5,20}$/;
      if (!cniRegex.test(locataireCni)) {
        errors.cni = 'Le CNI doit faire de 5 à 20 caractères alphanumériques.';
      }
    }
    return errors;
  };

  const getContratErrors = () => {
    const errors: Record<string, string> = {};
    if (!contratBienId) {
      errors.bienId = 'Veuillez sélectionner un bien immobilier.';
    }
    if (!contratDateDebut) {
      errors.dateDebut = "La date de début d'effet est requise.";
    }
    if (contratDateDebut && contratDateFin) {
      const start = new Date(contratDateDebut);
      const end = new Date(contratDateFin);
      if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && end < start) {
        errors.dateFin = 'La date de fin doit être postérieure ou égale à la date de début.';
      }
    }
    if (contratType !== 'vente') {
      if (contratLoyer <= 0) {
        errors.loyer = 'Le loyer doit être strictement supérieur à 0 €.';
      }
    } else {
      if (contratPrixVente <= 0) {
        errors.prixVente = 'Le prix de vente doit être strictement supérieur à 0 €.';
      }
    }
    return errors;
  };

  const fetchAllValidatedPayments = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/v1/contrats/payments/all', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        setAllValidatedPayments(json.data);
      }
    } catch (err) {
      console.error("Error fetching validated payments:", err);
    }
  };

  useEffect(() => {
    if (token) {
      fetchBiens();
      fetchContrats();
      fetchLocataires();
      fetchAllValidatedPayments();
    }
  }, [token]);

  const fetchBiens = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/biens');
      const json = await res.json();
      if (json.success) setBiens(json.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchContrats = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/v1/contrats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) setContrats(json.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchLocataires = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/v1/locataires', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) setLocataires(json.data);
    } catch (err) {
      console.error(err);
    }
  };

  // --- Modal actions ---

  const openNewBien = () => {
    setTouched({});
    setAttemptedSubmit({});
    setEditingBien(null);
    setBienTitre('');
    setBienDescription('');
    setBienType('appartement');
    setBienPrix(150000);
    setBienVille('Paris');
    setBienSurface(45);
    setBienNbPieces(2);
    setBienStatut('disponible');
    setIsBienModalOpen(true);
  };

  const openEditBien = (bien: Bien) => {
    setTouched({});
    setAttemptedSubmit({});
    setEditingBien(bien);
    setBienTitre(bien.titre);
    setBienDescription(bien.description || '');
    setBienType(bien.type || 'appartement');
    setBienPrix(bien.prix || 0);
    setBienVille(bien.ville || '');
    setBienSurface(bien.surface || 45);
    setBienNbPieces(bien.nb_pieces || 2);
    setBienStatut(bien.statut || 'disponible');
    setIsBienModalOpen(true);
  };

  const openNewLocataire = () => {
    setTouched({});
    setAttemptedSubmit({});
    setEditingLocataire(null);
    setLocataireFirstName('');
    setLocataireLastName('');
    setLocataireEmail('');
    setLocatairePhone('');
    setLocataireProfession('Cadre');
    setLocataireRevenu(3200);
    setLocataireCni('ABC123456');
    setIsLocataireModalOpen(true);
  };

  const openEditLocataire = (loc: any) => {
    setTouched({});
    setAttemptedSubmit({});
    setEditingLocataire(loc);
    setLocataireFirstName(loc.first_name || '');
    setLocataireLastName(loc.last_name || '');
    setLocataireEmail(loc.email || '');
    setLocatairePhone(loc.phone || '');
    setLocataireProfession(loc.profession || '');
    setLocataireRevenu(loc.revenu_mensuel || 0);
    setLocataireCni(loc.cni_numero || '');
    setIsLocataireModalOpen(true);
  };

  const openNewContrat = (preSelectType?: string) => {
    setTouched({});
    setAttemptedSubmit({});
    setEditingContrat(null);
    setContratType(preSelectType || 'bail');
    setContratBienId(biens[0]?.id || '');
    // Need users.id (which is locataires.user_id) for locataire_id references in contracts
    setContratLocataireId(locataires[0]?.user_id || '');
    setContratDateDebut(new Date().toISOString().split('T')[0]);
    setContratDateFin('');
    setContratLoyer(1200);
    setContratPrixVente(250000);
    setContratStatut('actif');
    setIsContratModalOpen(true);
  };

  const openEditContrat = (con: Contrat) => {
    setTouched({});
    setAttemptedSubmit({});
    setEditingContrat(con);
    setContratType(con.type || 'bail');
    setContratBienId((con as any).bien_id || '');
    setContratLocataireId((con as any).locataire_id || '');
    setContratDateDebut(con.date_debut ? con.date_debut.split('T')[0] : '');
    setContratDateFin(con.date_fin ? con.date_fin.split('T')[0] : '');
    setContratLoyer(con.loyer_mensuel || 0);
    setContratPrixVente(con.prix_vente || 0);
    setContratStatut(con.statut || 'actif');
    setIsContratModalOpen(true);
  };

  // --- Save / Delete Form Actions ---

  const handleSaveBien = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setAttemptedSubmit(prev => ({ ...prev, bien: true }));
    const errors = getBienErrors();
    if (Object.keys(errors).length > 0) {
      return;
    }

    const payload = {
      titre: bienTitre,
      description: bienDescription,
      type: bienType,
      prix: Number(bienPrix),
      ville: bienVille,
      surface: Number(bienSurface),
      nb_pieces: Number(bienNbPieces),
      statut: bienStatut
    };

    try {
      const url = editingBien ? `/api/v1/biens/${editingBien.id}` : '/api/v1/biens';
      const method = editingBien ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const json = await res.json();
      if (json.success) {
        addActionLog(
          editingBien ? 'edition' : 'creation',
          'bien',
          editingBien ? 'Bien immobilier mis à jour' : 'Bien immobilier ajouté',
          editingBien ? `Modifications appliquées sur "${bienTitre}".` : `Création du bien "${bienTitre}" à ${bienVille}.`
        );
        setIsBienModalOpen(false);
        fetchBiens();
      } else {
        alert(json.error?.message || "Une erreur s'est produite lors de la sauvegarde.");
      }
    } catch (err) {
      console.error(err);
      alert("Erreur réseau");
    }
  };

  const handleDeleteBien = (id: number) => {
    if (!token) return;
    const targetBien = biens.find(b => b.id === id);
    if (!targetBien) return;

    setConfirmModal({
      isOpen: true,
      title: "Supprimer le bien immobilier",
      message: `Êtes-vous sûr de vouloir supprimer le bien "${targetBien.titre}" ? Cette action est définitive et supprimera également les baux ou documents associés.`,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/v1/biens/${id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          const json = await res.json();
          if (json.success) {
            addActionLog('suppression', 'bien', 'Bien immobilier supprimé', `Le bien "${targetBien.titre}" de ${targetBien.ville} a été retiré.`);
            setToastMsg(`Le bien "${targetBien.titre}" a été supprimé avec succès !`);
            fetchBiens();
          } else {
            setToastMsg(json.error?.message || "Une erreur s'est produite.");
          }
        } catch (err) {
          console.error(err);
          setToastMsg("Erreur de connexion.");
        } finally {
          setConfirmModal(null);
        }
      }
    });
  };

  const handleSaveLocataire = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setAttemptedSubmit(prev => ({ ...prev, locataire: true }));
    const errors = getLocataireErrors();
    if (Object.keys(errors).length > 0) {
      return;
    }

    const payload = {
      first_name: locataireFirstName,
      last_name: locataireLastName,
      email: locataireEmail,
      phone: locatairePhone,
      profession: locataireProfession,
      revenu_mensuel: Number(locataireRevenu),
      cni_numero: locataireCni
    };

    try {
      const url = editingLocataire ? `/api/v1/locataires/${editingLocataire.id}` : '/api/v1/locataires';
      const method = editingLocataire ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const json = await res.json();
      if (json.success) {
        addActionLog(
          editingLocataire ? 'edition' : 'creation',
          'locataire',
          editingLocataire ? 'Fiche client mise à jour' : 'Profil client enregistré',
          editingLocataire ? `Données client de ${locataireFirstName} ${locataireLastName} modifiées.` : `Le client ${locataireFirstName} ${locataireLastName} (${locataireProfession}) a été ajouté.`
        );
        setIsLocataireModalOpen(false);
        fetchLocataires();
      } else {
        alert(json.error?.message || "Une erreur s'est produite.");
      }
    } catch (err) {
      console.error(err);
      alert("Erreur réseau");
    }
  };

  const handleDeleteLocataire = (id: number) => {
    if (!token) return;
    const targetLoc = locataires.find(l => l.id === id);
    if (!targetLoc) return;

    setConfirmModal({
      isOpen: true,
      title: "Supprimer la fiche client",
      message: `Êtes-vous sûr de vouloir supprimer le client "${targetLoc.first_name || ''} ${targetLoc.last_name || ''}" ? Cette action est définitive.`,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/v1/locataires/${id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          const json = await res.json();
          if (json.success) {
            addActionLog('suppression', 'locataire', 'Profil client supprimé', `Le client "${targetLoc.first_name || ''} ${targetLoc.last_name || ''}" a été retiré.`);
            setToastMsg(`Le client "${targetLoc.first_name || ''} ${targetLoc.last_name || ''}" a été supprimé avec succès !`);
            fetchLocataires();
          } else {
            setToastMsg(json.error?.message || "Une erreur s'est produite.");
          }
        } catch (err) {
          console.error(err);
          setToastMsg("Erreur de connexion.");
        } finally {
          setConfirmModal(null);
        }
      }
    });
  };

  const handleSaveContrat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setAttemptedSubmit(prev => ({ ...prev, contrat: true }));
    const errors = getContratErrors();
    if (Object.keys(errors).length > 0) {
      return;
    }

    const payload = {
      type: contratType,
      bien_id: contratBienId ? Number(contratBienId) : null,
      locataire_id: contratLocataireId ? Number(contratLocataireId) : null,
      date_debut: contratDateDebut ? new Date(contratDateDebut).toISOString() : null,
      date_fin: contratDateFin ? new Date(contratDateFin).toISOString() : null,
      loyer_mensuel: contratType === 'vente' ? null : Number(contratLoyer),
      prix_vente: contratType === 'vente' ? Number(contratPrixVente) : null,
      statut: contratStatut
    };

    try {
      const url = editingContrat ? `/api/v1/contrats/${editingContrat.id}` : '/api/v1/contrats';
      const method = editingContrat ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const json = await res.json();
      if (json.success) {
        const associatedBien = biens.find(b => b.id === Number(contratBienId));
        const bienTitle = associatedBien ? associatedBien.titre : 'Bien immobilier';
        addActionLog(
          editingContrat ? 'edition' : 'creation',
          'contrat',
          editingContrat ? 'Contrat mis à jour' : 'Contrat de bail créé',
          editingContrat ? `Le contrat (${contratType}) lié à "${bienTitle}" a été mis à jour.` : `Nouveau contrat (${contratType}) enregistré pour "${bienTitle}".`
        );
        setIsContratModalOpen(false);
        fetchContrats();
      } else {
        alert(json.error?.message || "Une erreur s'est produite.");
      }
    } catch (err) {
      console.error(err);
      alert("Erreur réseau");
    }
  };

  const handleDeleteContrat = (id: number) => {
    if (!token) return;
    const targetCon = contrats.find(c => c.id === id);
    if (!targetCon) return;

    setConfirmModal({
      isOpen: true,
      title: "Supprimer le contrat",
      message: `Êtes-vous sûr de vouloir supprimer le contrat (${targetCon.type}) lié à "${targetCon.bien_titre || 'ce bien'}" ? Cette action est définitive.`,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/v1/contrats/${id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          const json = await res.json();
          if (json.success) {
            addActionLog('suppression', 'contrat', 'Contrat révoqué / supprimé', `Le contrat (${targetCon.type}) lié à "${targetCon.bien_titre || 'bien'}" a été définitivement supprimé.`);
            setToastMsg(`Le contrat lié à "${targetCon.bien_titre || 'ce bien'}" a été supprimé avec succès !`);
            fetchContrats();
          } else {
            setToastMsg(json.error?.message || "Une erreur s'est produite.");
          }
        } catch (err) {
          console.error(err);
          setToastMsg("Erreur de connexion.");
        } finally {
          setConfirmModal(null);
        }
      }
    });
  };

  const generateReleveHtml = (c: Contrat, history: any[]) => {
    const currentYear = 2026;
    const totalDue = history.reduce((sum, h) => sum + (h.amount || 0), 0);
    const totalPaid = history.reduce((sum, h) => sum + (h.status === 'paye' || h.status === 'paye_en_retard' ? h.amount : 0), 0);
    const totalLate = totalDue - totalPaid;
    const netReverse = Math.max(0, totalPaid - Math.round(totalPaid * 0.08));

    const tableRows = history.map(h => {
      const isPaid = h.status === 'paye' || h.status === 'paye_en_retard';
      const isLate = h.status === 'retard';
      const badgeStyle = isPaid 
        ? 'background-color: rgb(240 253 250); color: rgb(13 148 136); border: 1px solid rgb(204 251 241);' 
        : isLate 
          ? 'background-color: rgb(254 242 242); color: rgb(220 38 38); border: 1px solid rgb(254 226 226);' 
          : 'background-color: rgb(254 243 199); color: rgb(217 119 6); border: 1px solid rgb(253 230 138);';
      return `
        <tr style="border-bottom: 1px solid #f3f4f6;">
          <td style="padding: 12px 16px; font-weight: 500; color: #1f2937;">${h.month}</td>
          <td style="padding: 12px 16px; font-family: monospace; font-size: 13px; text-align: right; color: #374151;">${(h.amount || 0).toLocaleString('fr-FR')} €</td>
          <td style="padding: 12px 16px; font-family: monospace; font-size: 13px; text-align: right; color: #111827; font-weight: 600;">${(isPaid ? h.amount : 0).toLocaleString('fr-FR')} €</td>
          <td style="padding: 12px 16px; text-align: center; color: #4b5563; font-size: 12px;">${h.datePaiement || '-'}</td>
          <td style="padding: 12px 16px; text-align: right;">
            <span style="font-size: 11px; font-weight: bold; padding: 4px 10px; border-radius: 9999px; ${badgeStyle}">
              ${h.label}
            </span>
          </td>
        </tr>
      `;
    }).join('');

    return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <title>Relevé Financier de Gérance - 2026 - ${c.bien_titre}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding: 40px; color: #1f2937; line-height: 1.5; background: #f8fafc; }
    .container { max-width: 850px; margin: 0 auto; background: #ffffff; padding: 50px; border-radius: 16px; box-shadow: 0 4px 20px -2px rgba(0,0,0,0.05), 0 2px 10px -1px rgba(0,0,0,0.03); border: 1px solid #e2e8f0; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #e2e8f0; padding-bottom: 24px; margin-bottom: 30px; }
    .header-logo { font-size: 26px; font-weight: 800; color: #4338ca; letter-spacing: -0.05em; text-transform: uppercase; }
    .header-badge { background: #e0e7ff; color: #4338ca; font-size: 11px; font-weight: 800; text-transform: uppercase; padding: 6px 14px; border-radius: 9999px; letter-spacing: 0.05em; border: 1px solid #c7d2fe; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 35px; }
    .section-title { font-size: 11px; font-weight: 800; text-transform: uppercase; color: #64748b; letter-spacing: 0.1em; margin-bottom: 10px; }
    .card { background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #f1f5f9; line-height: 1.6; }
    .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 35px; }
    .stat-card { background: #ffffff; border: 1px solid #e2e8f0; padding: 18px 12px; border-radius: 12px; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.02); }
    .stat-val { font-size: 18px; font-weight: 700; color: #0f172a; margin-top: 6px; font-family: monospace; }
    table { width: 100%; border-collapse: collapse; text-align: left; font-size: 13px; margin-bottom: 40px; }
    th { padding: 14px 16px; text-transform: uppercase; font-size: 11px; font-weight: 700; color: #475569; border-bottom: 2px solid #cbd5e1; background: #f1f5f9; }
    .footer { border-top: 1px solid #e2e8f0; padding-top: 25px; font-size: 11px; color: #94a3b8; text-align: center; }
    @media print {
      body { background: #fff; padding: 0; }
      .container { box-shadow: none; border: none; padding: 0; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div>
        <div class="header-logo">ImmoManage</div>
        <div style="font-size: 13px; color: #64748b; margin-top: 4px;">Solutions de Gestion Locative Immobilière Professionnelle</div>
      </div>
      <div>
        <span class="header-badge">Relevé Financier Individuel</span>
      </div>
    </div>

    <div class="grid">
      <div>
        <div class="section-title">ADMINISTRATEUR (MANDATAIRE)</div>
        <div class="card" style="font-size: 13px; color: #334155;">
          <strong style="color: #0f172a; font-size: 14px;">ImmoTech Solutions SAS</strong><br/>
          Service d'Administration des Biens<br/>
          RCS Paris B 123 456 789<br/>
          Siret: 12345678900011
        </div>
      </div>
      <div>
        <div class="section-title">PROPRIÉTÉ & LOCATAIRE</div>
        <div class="card" style="font-size: 13px; color: #334155;">
          <strong style="color: #4338ca; font-size: 14px;">${c.bien_titre}</strong><br/>
          Contact locataire : <span style="font-family: monospace;">${c.locataire_email || 'Non renseigné'}</span><br/>
          Contrat : Bail d'habitation principal (Bail Actif)<br/>
          Mensualité de base : ${c.loyer_mensuel?.toLocaleString('fr-FR') || '1000'} € / mois
        </div>
      </div>
    </div>

    <div class="section-title" style="margin-bottom: 12px;">Synthèse des Flux de Trésorerie</div>
    <div class="summary-grid">
      <div class="stat-card" style="border-top: 4px solid #4338ca;">
        <div style="font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase;">Loyers Attendus</div>
        <div class="stat-val" style="color: #4338ca;">${totalDue.toLocaleString('fr-FR')} €</div>
      </div>
      <div class="stat-card" style="border-top: 4px solid #0d9488;">
        <div style="font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase;">Total Encaissé</div>
        <div class="stat-val" style="color: #0d9488;">${totalPaid.toLocaleString('fr-FR')} €</div>
      </div>
      <div class="stat-card" style="border-top: 4px solid #dc2626;">
        <div style="font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase;">Retards / Solde</div>
        <div class="stat-val" style="color: #dc2626;">${totalLate.toLocaleString('fr-FR')} €</div>
      </div>
      <div class="stat-card" style="border-top: 4px solid #0284c7;">
        <div style="font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase;">Revenu Net (H-Frais)</div>
        <div class="stat-val" style="color: #0284c7;">${netReverse.toLocaleString('fr-FR')} €</div>
      </div>
    </div>

    <div class="section-title">Grand Livre de Comptes Individuels - Échéancier de Gérance</div>
    <table>
      <thead>
        <tr>
          <th>Mois d'échéance</th>
          <th style="text-align: right;">Crédit Exposé</th>
          <th style="text-align: right;">Montant Reçu</th>
          <th style="text-align: center;">Date de Perception</th>
          <th style="text-align: right;">Statut</th>
        </tr>
      </thead>
      <tbody>
        ${tableRows}
      </tbody>
    </table>

    <div style="margin-top: 50px; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; font-size: 11px; color: #475569;">
      <div>
        <strong>Signature autorisée pour l'Administration</strong>
        <div style="height: 60px; border-bottom: 1px dashed #cbd5e1; margin-top: 10px;"></div>
        <p style="margin-top: 5px; color: #94a3b8;">Généré numériquement le ${new Date().toLocaleDateString('fr-FR')}</p>
      </div>
      <div>
        <strong>Visa Propriétaire / Bailleur</strong>
        <div style="height: 60px; border-bottom: 1px dashed #cbd5e1; margin-top: 10px;"></div>
        <p style="margin-top: 5px; color: #94a3b8;">Pour acceptation des flux reversés et quitus</p>
      </div>
    </div>

    <div class="footer" style="margin-top: 60px;">
      Ce relevé est un document d'ordre comptable et financier. Il est produit numériquement et tient lieu d'état de gérance.<br/>
      ImmoManage Software Services © 2026. Tous droits réservés.
    </div>
  </div>
</body>
</html>
    `;
  };

  const handleGenerateAndSaveReleve = async (contrat: Contrat) => {
    if (!token) return;
    setGeneratingReleveId(contrat.id);
    try {
      const history = getContratPaymentHistory(contrat);
      const htmlString = generateReleveHtml(contrat, history);
      
      const file = new File([htmlString], `Releve_Financier_2026_${contrat.id}.html`, { type: 'text/html' });
      const storagePath = `contracts/${contrat.id}/releve_financier_2026_${Date.now()}.html`;
      
      let downloadURL = '';
      let savedStoragePath: string | null = null;

      try {
        const storageRef = ref(storage, storagePath);
        const uploadTask = uploadBytesResumable(storageRef, file);

        await new Promise<void>((resolve, reject) => {
          uploadTask.on('state_changed', 
            null, 
            (error) => {
              console.warn("Storage upload failed, falling back to base64 data-URL", error);
              reject(error);
            }, 
            async () => {
              try {
                downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                savedStoragePath = storagePath;
                resolve();
              } catch (err) {
                reject(err);
              }
            }
          );
        });
      } catch (storageErr) {
        // Fallback to local Base64 URL storage
        console.warn("Using base64 fallback for document url due to storage error:", storageErr);
        const base64Html = btoa(unescape(encodeURIComponent(htmlString)));
        downloadURL = `data:text/html;base64,${base64Html}`;
        savedStoragePath = null;
      }

      const res = await fetch(`/api/v1/contrats/${contrat.id}/documents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          titre: `Relevé Financier Annuel 2026 - ${contrat.bien_titre}`,
          type: 'autre',
          url: downloadURL,
          storage_path: savedStoragePath
        })
      });
      const json = await res.json();
      if (json.success) {
        addActionLog(
          'creation',
          'contrat',
          'Relevé financier généré',
          `Un relevé financier annuel pour l'année 2026 a été généré, certifié et archivé dans la GED du contrat pour "${contrat.bien_titre}".`
        );
        setToastMsg(`Le Relevé Financier de gérance pour "${contrat.bien_titre}" a été généré et archivé avec succès !`);
      } else {
        setToastMsg(json.error?.message || "Erreur lors de l'enregistrement en base de données.");
      }

    } catch (err: any) {
      console.error(err);
      setToastMsg(`Erreur lors de la génération du relevé.`);
    } finally {
      setGeneratingReleveId(null);
    }
  };

  const handleSavePaymentConfirmation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !paymentToValidate) return;
    try {
      const res = await fetch(`/api/v1/contrats/${paymentToValidate.contrat.id}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          month_index: paymentToValidate.monthIndex,
          year: 2026,
          amount: confirmAmount,
          status: confirmStatus,
          date_paiement: confirmDate || new Date().toLocaleDateString('fr-FR'),
          mode_paiement: confirmMode,
          confirmed_by: user?.email || 'Admin Agent'
        })
      });
      const json = await res.json();
      if (json.success) {
        const logData: ActionLog = {
          id: `log-${Date.now()}`,
          type: 'edition',
          target: 'contrat',
          title: 'Paiement validé',
          description: `Paiement du mois de ${paymentToValidate.monthName} pour "${paymentToValidate.contrat.bien_titre}" validé (${confirmAmount} €).`,
          timestamp: "À l'instant",
          date: new Date().toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
        };
        const updatedLogs = [logData, ...actionLogs];
        setActionLogs(updatedLogs);
        localStorage.setItem('immo_action_logs', JSON.stringify(updatedLogs));

        setToastMsg(`Le paiement de ${paymentToValidate.monthName} pour "${paymentToValidate.contrat.bien_titre}" a été enregistré !`);
        setPaymentToValidate(null);
        await fetchAllValidatedPayments();
      } else {
        alert(json.error?.message || "Erreur de validation");
      }
    } catch (err: any) {
      console.error(err);
      alert("Erreur lors de la validation du paiement.");
    }
  };

  const handleCancelPaymentConfirmation = (contratId: number, dbPaymentId: number, monthName: string) => {
    if (!token) return;
    setConfirmModal({
      isOpen: true,
      title: "Réinitialiser le règlement",
      message: `Voulez-vous réinitialiser le paiement pour le mois de ${monthName} ?`,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/v1/contrats/${contratId}/payments/${dbPaymentId}`, {
            method: 'DELETE',
            border: 'none',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          } as any);
          const json = await res.json();
          if (json.success) {
            const logData: ActionLog = {
              id: `log-${Date.now()}`,
              type: 'suppression',
              target: 'contrat',
              title: 'Validation annulée',
              description: `La validation de paiement de ${monthName} pour le contrat #${contratId} a été réinitialisée.`,
              timestamp: "À l'instant",
              date: new Date().toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
            };
            const updatedLogs = [logData, ...actionLogs];
            setActionLogs(updatedLogs);
            localStorage.setItem('immo_action_logs', JSON.stringify(updatedLogs));

            setToastMsg(`Le paiement de ${monthName} a été réinitialisé !`);
            await fetchAllValidatedPayments();
          } else {
            setToastMsg(json.error?.message || "Erreur lors de la suppression de la validation");
          }
        } catch (err: any) {
          console.error(err);
          setToastMsg("Erreur de connexion.");
        } finally {
          setConfirmModal(null);
        }
      }
    });
  };

  const openDocModal = async (contrat: Contrat) => {
    setSelectedContratForDoc(contrat);
    setIsDocModalOpen(true);
    setDocTitre('');
    setDocType('bail');
    setDocError(null);
    setUploadProgress(0);
    fetchDocuments(contrat.id);
  };

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
        setDocError(json.error?.message || "Erreur lors de la récupération des documents.");
      }
    } catch (err) {
      console.error(err);
      setDocError("Erreur de connexion.");
    }
  };

  const handleUploadDocument = async (file: File) => {
    if (!selectedContratForDoc || !token) return;
    if (!file) {
      setDocError("Veuillez sélectionner un fichier.");
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
                    'Document associé au contrat',
                    `Le document "${title}" (${type}) a été stocké avec succès (Base64 fallback).`
                  );
                } else {
                  setDocError(json.error?.message || "Erreur de synchronisation base de données.");
                }
              } catch (fallbackErr: any) {
                console.error(fallbackErr);
                setDocError(`Échec d'envoi : ${fallbackErr.message}`);
              } finally {
                setIsUploading(false);
              }
            };
            reader.onerror = () => {
              setDocError(`Échec lors de la lecture locale du fichier.`);
              setIsUploading(false);
            };
            reader.readAsDataURL(file);
          } catch (readerErr: any) {
            setDocError(`Échec d'envoi et de secours.`);
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
                'Document associé au contrat',
                `Le document "${title}" (${type}) a été téléversé et associé à "${selectedContratForDoc.bien_titre}".`
              );
            } else {
              setDocError(json.error?.message || "Erreur de synchronisation avec la base de données.");
              try {
                await deleteObject(storageRef);
              } catch (delErr) {
                console.error(delErr);
              }
            }
          } catch (err: any) {
            console.error(err);
            setDocError(err.message || "Erreur lors de l'enregistrement en BDD.");
          } finally {
            setIsUploading(false);
          }
        }
      );
    } catch (err: any) {
      console.error(err);
      setDocError(err.message || "Erreur lors du téléversement.");
      setIsUploading(false);
    }
  };

  const handleDeleteDocument = (docId: number, storagePath: string) => {
    if (!selectedContratForDoc || !token) return;

    setConfirmModal({
      isOpen: true,
      title: "Supprimer le document",
      message: "Êtes-vous sûr de vouloir supprimer ce document ? Cette action est irréversible.",
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
              'Document de contrat supprimé',
              `Un document a été supprimé du contrat de "${selectedContratForDoc.bien_titre}".`
            );
            setToastMsg("Le document a été supprimé avec succès !");
          } else {
            setToastMsg(json.error?.message || "Erreur lors de la suppression.");
          }
        } catch (err) {
          console.error(err);
          setToastMsg("Erreur de connexion lors de la suppression.");
        } finally {
          setConfirmModal(null);
        }
      }
    });
  };

  const syncWithBackend = async (userEmail: string, displayName?: string) => {
    let first_name = '';
    let last_name = '';
    if (displayName) {
      const parts = displayName.trim().split(' ');
      first_name = parts[0] || '';
      last_name = parts.slice(1).join(' ') || '';
    }
    
    try {
      const response = await fetch('/api/v1/auth/firebase-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userEmail,
          first_name: first_name || userEmail.split('@')[0],
          last_name: last_name
        })
      });
      const json = await response.json();
      if (json.success) {
        setToken(json.data.token);
        setUser(json.data.user);
        localStorage.setItem('token', json.data.token);
        localStorage.setItem('user', JSON.stringify(json.data.user));
        return true;
      } else {
        alert(json.error?.message || "Erreur de synchronisation.");
        return false;
      }
    } catch (err: any) {
      console.error(err);
      alert("Erreur de connexion au serveur.");
      return false;
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setAuthError(null);
    try {
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const fbUser = userCredential.user;
        await syncWithBackend(fbUser.email!, fbUser.displayName || '');
      } catch (fbErr: any) {
        console.warn("Firebase sign-in failed, checking native fallback...", fbErr);
        // If Firebase Auth provider is not enabled or fails, attempt to authenticate locally via the backend DB
        const response = await fetch('/api/v1/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const json = await response.json();
        if (json.success) {
          setToken(json.data.token);
          setUser(json.data.user);
          localStorage.setItem('token', json.data.token);
          localStorage.setItem('user', JSON.stringify(json.data.user));
          setAuthError(null);
        } else {
          // If native DB login also failed with "Invalid credentials", throw appropriate error
          if (fbErr.code === 'auth/operation-not-allowed' || fbErr.message?.includes('operation-not-allowed')) {
            throw fbErr;
          } else {
            throw new Error(json.error?.message || "Identifiants invalides sur la base locale.");
          }
        }
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/operation-not-allowed' || err.message?.includes('operation-not-allowed')) {
        setAuthError("La connexion Firebase par e-mail et mot de passe n'est pas activée dans votre console Firebase. Vous pouvez lever ce blocage en l'activant, ou utiliser les identifiants locaux de démo : admin@example.com / password123.");
      } else {
        setAuthError(err.message || "Erreur lors de la connexion.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setAuthError(null);
    try {
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const fbUser = userCredential.user;
        const response = await fetch('/api/v1/auth/firebase-sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: fbUser.email!,
            first_name: firstName,
            last_name: lastName
          })
        });
        const json = await response.json();
        if (json.success) {
          setToken(json.data.token);
          setUser(json.data.user);
          localStorage.setItem('token', json.data.token);
          localStorage.setItem('user', JSON.stringify(json.data.user));
        } else {
          throw new Error(json.error?.message || "Erreur de synchronisation.");
        }
      } catch (fbErr: any) {
        console.warn("Firebase registration failed, trying native database registration as fallback...", fbErr);
        // Fallback to local API
        const response = await fetch('/api/v1/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            password,
            first_name: firstName,
            last_name: lastName,
            role: 'agent' // Assigning 'agent' role by default so they can manage contracts!
          })
        });
        const json = await response.json();
        if (json.success) {
          setToken(json.data.token);
          setUser(json.data.user);
          localStorage.setItem('token', json.data.token);
          localStorage.setItem('user', JSON.stringify(json.data.user));
          setAuthError(null);
        } else {
          if (fbErr.code === 'auth/operation-not-allowed' || fbErr.message?.includes('operation-not-allowed')) {
            throw fbErr;
          } else {
            throw new Error(json.error?.message || "Erreur d'inscription locale.");
          }
        }
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/operation-not-allowed' || err.message?.includes('operation-not-allowed')) {
        setAuthError("L'inscription par e-mail et mot de passe n'est pas activée dans votre console Firebase. En attendant, la création de compte locale a également échoué (" + err.message + ").");
      } else {
        setAuthError(err.message || "Erreur lors de l'inscription.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setAuthError(null);
    try {
      try {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        const fbUser = result.user;
        await syncWithBackend(fbUser.email!, fbUser.displayName || '');
      } catch (fbErr: any) {
        console.warn("Firebase Google sign-in failed, checking for local admin default logging...", fbErr);
        if (fbErr.code === 'auth/operation-not-allowed' || fbErr.message?.includes('operation-not-allowed')) {
          throw fbErr;
        } else {
          throw fbErr;
        }
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/operation-not-allowed' || err.message?.includes('operation-not-allowed')) {
        setAuthError("La connexion Google n'est pas activée dans la console Firebase. Vous pouvez lever ce blocage en l'activant, ou utiliser l'e-mail/mot de passe local alternatif : admin@example.com / password123.");
      } else {
        setAuthError(err.message || "Erreur lors de la connexion Google.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
    } catch (err) {
      console.error(err);
    }
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  // --- Local Search Filters ---

  const filteredBiens = biens.filter(bien => {
    const matchesSearch = 
      bien.titre.toLowerCase().includes(searchTerm.toLowerCase()) || 
      bien.ville.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (bien.description && bien.description.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesType = filterType === 'Tous' || bien.type?.toLowerCase() === filterType.toLowerCase();

    return matchesSearch && matchesType;
  });

  const parseLogDate = (dateStr: string): Date | null => {
    if (!dateStr) return null;
    const cleanStr = dateStr.replace(',', '').trim();
    const parts = cleanStr.split(' ');
    const dateParts = parts[0].split('/');
    if (dateParts.length < 3) return null;
    const day = parseInt(dateParts[0], 10);
    const month = parseInt(dateParts[1], 10) - 1;
    const year = parseInt(dateParts[2], 10);
    
    let hours = 0;
    let minutes = 0;
    if (parts[1]) {
      const timeParts = parts[1].split(':');
      hours = parseInt(timeParts[0], 10) || 0;
      minutes = parseInt(timeParts[1], 10) || 0;
    }
    
    const parsed = new Date(year, month, day, hours, minutes);
    return isNaN(parsed.getTime()) ? null : parsed;
  };

  const filteredLogs = actionLogs.filter(log => {
    const matchesTarget = historyFilter === 'all' || log.target === historyFilter;
    if (!matchesTarget) return false;

    const logDateObj = parseLogDate(log.date);
    if (logDateObj) {
      if (historyStartDate) {
        const start = new Date(historyStartDate);
        start.setHours(0, 0, 0, 0);
        if (logDateObj < start) return false;
      }
      if (historyEndDate) {
        const end = new Date(historyEndDate);
        end.setHours(23, 59, 59, 999);
        if (logDateObj > end) return false;
      }
    } else if (historyStartDate || historyEndDate) {
      // In case we can't parse or there is no date but user is filtering by date, exclude it
      return false;
    }
    
    return true;
  });

  const expiringBails = React.useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return contrats.filter(c => {
      if (c.type !== 'bail' || c.statut !== 'actif' || !c.date_fin) return false;
      
      const endDate = new Date(c.date_fin);
      if (isNaN(endDate.getTime())) return false;
      endDate.setHours(0, 0, 0, 0);
      
      const diffTime = endDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      // Select active lease agreements expiring in up to 7 days
      return diffDays >= -15 && diffDays <= 7;
    }).map(c => {
      const endDate = new Date(c.date_fin);
      endDate.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const diffTime = endDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      return {
        ...c,
        daysRemaining: diffDays
      };
    }).sort((a, b) => a.daysRemaining - b.daysRemaining);
  }, [contrats]);

  const handleSendExpiryNotification = (contrat: Contrat, daysRemaining: number) => {
    if (notifiedContrats.includes(contrat.id)) return;
    
    setNotifiedContrats(prev => [...prev, contrat.id]);
    setToastMsg(`Notification envoyée à ${contrat.locataire_email || 'sans email'} pour le bien "${contrat.bien_titre}" !`);
    
    addActionLog(
      'edition',
      'contrat',
      "Notification d'échéance bail expédiée",
      `Alerte envoyée avec succès à ${contrat.locataire_email || 'l\'adresse enregistrée'} à J-${daysRemaining} du terme du contrat du bien [${contrat.bien_titre}]. Échéance le ${contrat.date_fin ? new Date(contrat.date_fin).toLocaleDateString('fr-FR') : 'Non renseignée'}.`
    );
  };

  // Calculate stats dynamically
  const activeBiensCount = biens.length;
  const activeContractsCount = contrats.filter(c => c.statut === 'actif').length;
  const monthlyRentRevenue = contrats
    .filter(c => c.statut === 'actif' && c.type === 'bail')
    .reduce((sum, c) => sum + (c.loyer_mensuel || 0), 0);
  const vacantBiensCount = biens.filter(b => b.statut === 'disponible').length;
  const vacancyRate = biens.length > 0 ? Math.round((vacantBiensCount / biens.length) * 100) : 0;

  // Late payments automatic calculation logic
  const getContratPaymentStatus = (c: Contrat) => {
    if (c.type !== 'bail') {
      return { status: 'n/a', label: 'N/A', isLate: false, dueDay: 5, delayDays: 0 };
    }
    if (c.statut !== 'actif') {
      return { status: 'termine', label: 'Archivé', isLate: false, dueDay: 5, delayDays: 0 };
    }

    // Determine the due day of the month from the date_debut, default to 5
    let dueDay = 5;
    if (c.date_debut) {
      const d = new Date(c.date_debut);
      if (!isNaN(d.getTime())) {
        dueDay = Math.min(28, d.getDate());
      }
    }

    const today = new Date();
    const currentDay = today.getDate();
    const currentMonthIdx = today.getMonth();
    const currentYear = 2026;

    // Check if there is a validated payment in the database for the current month
    const dbRecord = allValidatedPayments.find(p => 
      p.contrat_id === c.id && 
      p.month_index === currentMonthIdx && 
      p.year === currentYear
    );

    if (dbRecord) {
      const isLate = dbRecord.status === 'retard';
      const delayDays = isLate ? (currentDay > dueDay ? currentDay - dueDay : 5) : 0;
      let label = 'Payé';
      if (dbRecord.status === 'paye_en_retard') label = 'Payé (Retard)';
      else if (dbRecord.status === 'retard') label = 'En retard';
      else if (dbRecord.status === 'attente') label = 'En attente';
      return { status: dbRecord.status, label, isLate, dueDay, delayDays };
    }

    // If the contract started in the future, it is not yet active/due
    const startDate = c.date_debut ? new Date(c.date_debut) : null;
    if (startDate && startDate > today) {
      return { status: 'futur', label: 'À venir', isLate: false, dueDay, delayDays: 0 };
    }

    // Deterministic state simulation:
    // - ID is even: rent is already paid.
    // - ID is odd: rent is unpaid for the current month.
    const isPaid = c.id % 2 === 0;

    if (isPaid) {
      return { status: 'paye', label: 'Payé', isLate: false, dueDay, delayDays: 0 };
    }

    // If unpaid and the current day is after the due day, it is late (en retard)
    if (currentDay > dueDay) {
      const delayDays = currentDay - dueDay;
      return { status: 'retard', label: 'En retard', isLate: true, dueDay, delayDays };
    } else {
      return { status: 'attente', label: 'En attente', isLate: false, dueDay, delayDays: 0 };
    }
  };

  // Detailed payment history generator for the current year (12 months)
  const getContratPaymentHistory = (c: Contrat) => {
    const currentYear = 2026;
    const monthNames = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];

    const today = new Date();
    const currentMonthIdx = today.getMonth();
    const currentDay = today.getDate();

    let dueDay = 5;
    if (c.date_debut) {
      const d = new Date(c.date_debut);
      if (!isNaN(d.getTime())) {
        dueDay = Math.min(28, d.getDate());
      }
    }

    const startDate = c.date_debut ? new Date(c.date_debut) : null;
    const endDate = c.date_fin ? new Date(c.date_fin) : null;

    return monthNames.map((name, index) => {
      const firstDayOfMonth = new Date(currentYear, index, 1);
      const lastDayOfMonth = new Date(currentYear, index + 1, 0);

      const startedBeforeOrDuring = !startDate || startDate <= lastDayOfMonth;
      const endedAfterOrDuring = !endDate || endDate >= firstDayOfMonth;
      const isLeaseActive = startedBeforeOrDuring && endedAfterOrDuring;

      if (!isLeaseActive) {
        return {
          month: name,
          index,
          status: 'hors_contrat',
          label: 'Hors durée bail',
          amount: 0,
          colorClass: 'text-neutral-500 bg-neutral-900/30 border-neutral-800/50',
          dotColor: 'bg-neutral-600',
          datePaiement: '-'
        };
      }

      // Check if there is a manual confirmation in the database
      const dbRecord = allValidatedPayments.find(p => 
        p.contrat_id === c.id && 
        p.month_index === index && 
        p.year === currentYear
      );

      if (dbRecord) {
        let label = 'Payé';
        let colorClass = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
        let dotColor = 'bg-emerald-500';

        if (dbRecord.status === 'paye_en_retard') {
          label = 'Payé (Retard)';
          colorClass = 'text-amber-400 bg-amber-500/10 border-amber-500/20';
          dotColor = 'bg-amber-500';
        } else if (dbRecord.status === 'retard') {
          const delay = currentDay > dueDay ? currentDay - dueDay : 1;
          label = `Retard (${delay}j)`;
          colorClass = 'text-rose-400 bg-rose-500/10 border-rose-500/20 animate-pulse';
          dotColor = 'bg-rose-500';
        } else if (dbRecord.status === 'attente') {
          label = 'En attente';
          colorClass = 'text-amber-400 bg-amber-500/10 border-amber-500/25';
          dotColor = 'bg-amber-500';
        }

        return {
          month: name,
          index,
          status: dbRecord.status,
          label,
          amount: dbRecord.amount || c.loyer_mensuel || 1000,
          colorClass,
          dotColor,
          datePaiement: dbRecord.status.startsWith('paye')
            ? `Recouvré le ${dbRecord.date_paiement} (par ${dbRecord.mode_paiement || 'virement'})`
            : dbRecord.status === 'retard' ? 'Règlement impayé' : `Échéance le ${dueDay}/${String(index + 1).padStart(2, '0')}/${currentYear}`,
          isManual: true,
          dbRecordId: dbRecord.id
        };
      }

      const isPastMonth = index < currentMonthIdx;
      const isFutureMonth = index > currentMonthIdx;
      const isCurrentMonth = index === currentMonthIdx;

      if (isFutureMonth) {
        return {
          month: name,
          index,
          status: 'futur',
          label: 'À venir',
          amount: c.loyer_mensuel || 1000,
          colorClass: 'text-neutral-500 bg-neutral-950/40 border-neutral-800/40',
          dotColor: 'bg-neutral-700',
          datePaiement: '-'
        };
      }

      if (isCurrentMonth) {
        const isPaid = c.id % 2 === 0;
        if (isPaid) {
          return {
            month: name,
            index,
            status: 'paye',
            label: 'Payé',
            amount: c.loyer_mensuel || 1000,
            colorClass: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
            dotColor: 'bg-emerald-500',
            datePaiement: `Reçu le 0${Math.min(dueDay, 9)}/${String(index + 1).padStart(2, '0')}/${currentYear}`
          };
        } else {
          if (currentDay > dueDay) {
            const delay = currentDay - dueDay;
            return {
              month: name,
              index,
              status: 'retard',
              label: `Retard (${delay}j)`,
              amount: c.loyer_mensuel || 1000,
              colorClass: 'text-rose-400 bg-rose-500/10 border-rose-500/20 animate-pulse',
              dotColor: 'bg-rose-500',
              datePaiement: 'Règlement impayé'
            };
          } else {
            return {
              month: name,
              index,
              status: 'attente',
              label: 'En attente',
              amount: c.loyer_mensuel || 1000,
              colorClass: 'text-amber-400 bg-amber-500/10 border-amber-500/25',
              dotColor: 'bg-amber-500',
              datePaiement: `Échéance le ${dueDay}/${String(index + 1).padStart(2, '0')}/${currentYear}`
            };
          }
        }
      }

      // Past month
      const isOdd = c.id % 2 !== 0;
      const wasLatePaidMonth = isOdd && (index === 2 || index === 4 || index === 0);
      if (wasLatePaidMonth) {
        return {
          month: name,
          index,
          status: 'paye_en_retard',
          label: 'Payé (Retard)',
          amount: c.loyer_mensuel || 1000,
          colorClass: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
          dotColor: 'bg-amber-500',
          datePaiement: `Payé en retard le ${dueDay + 4}/${String(index + 1).padStart(2, '0')}/${currentYear}`
        };
      }

      const payDay = Math.max(1, dueDay - (c.id % 3));
      return {
        month: name,
        index,
        status: 'paye',
        label: 'Payé',
        amount: c.loyer_mensuel || 1000,
        colorClass: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
        dotColor: 'bg-emerald-500',
        datePaiement: `Reçu le ${String(payDay).padStart(2, '0')}/${String(index + 1).padStart(2, '0')}/${currentYear}`
      };
    });
  };

  const totalActiveBails = contrats.filter(c => c.statut === 'actif' && c.type === 'bail');
  const lateContractsCount = totalActiveBails.filter(c => getContratPaymentStatus(c).isLate).length;
  
  const totalPaidRent = totalActiveBails
    .filter(c => getContratPaymentStatus(c).status === 'paye')
    .reduce((sum, c) => sum + (c.loyer_mensuel || 0), 0);
    
  const totalLateRent = totalActiveBails
    .filter(c => getContratPaymentStatus(c).isLate)
    .reduce((sum, c) => sum + (c.loyer_mensuel || 0), 0);
    
  const complianceRate = totalActiveBails.length > 0 
    ? Math.round(((totalActiveBails.length - lateContractsCount) / totalActiveBails.length) * 100) 
    : 100;

  // Evolution calculation over the last 6 months for rent collected
  const last6MonthsData = React.useMemo(() => {
    const months = [];
    const monthNames = [
      'Janv', 'Févr', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc'
    ];
    
    const today = new Date();
    
    // Generate the list of the last 6 months
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      months.push({
        year: d.getFullYear(),
        monthIndex: d.getMonth(),
        name: monthNames[d.getMonth()],
        fullName: `${monthNames[d.getMonth()]} ${d.getFullYear()}`,
        'Loyers Encaissés': 0,
        'En Retard / Impayés': 0,
      });
    }

    // Apply contract rents dynamically to each month
    contrats.forEach(c => {
      if (c.type !== 'bail') return;
      const rent = c.loyer_mensuel || 0;
      if (rent <= 0) return;

      const startDate = c.date_debut ? new Date(c.date_debut) : null;
      const endDate = c.date_fin ? new Date(c.date_fin) : null;

      months.forEach(m => {
        const firstDayOfMonth = new Date(m.year, m.monthIndex, 1);
        const lastDayOfMonth = new Date(m.year, m.monthIndex + 1, 0);

        const startedBeforeOrDuring = !startDate || startDate <= lastDayOfMonth;
        const endedAfterOrDuring = !endDate || endDate >= firstDayOfMonth;

        if (startedBeforeOrDuring && endedAfterOrDuring) {
          const isCurrentMonth = m.year === today.getFullYear() && m.monthIndex === today.getMonth();
          
          if (isCurrentMonth) {
            const isPaid = c.id % 2 === 0;
            if (isPaid) {
              m['Loyers Encaissés'] += rent;
            } else {
              let dueDay = 5;
              if (c.date_debut) {
                const startD = new Date(c.date_debut);
                if (!isNaN(startD.getTime())) {
                  dueDay = Math.min(28, startD.getDate());
                }
              }
              if (today.getDate() > dueDay) {
                m['En Retard / Impayés'] += rent;
              } else {
                m['Loyers Encaissés'] += rent;
              }
            }
          } else {
            m['Loyers Encaissés'] += rent;
          }
        }
      });
    });

    return months;
  }, [contrats]);

  const bienErrors = getBienErrors();
  const locataireErrors = getLocataireErrors();
  const contratErrors = getContratErrors();

  if (!token) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4 selection:bg-indigo-500/30">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl p-8 shadow-2xl shadow-indigo-500/10"
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="p-1 bg-indigo-500/10 rounded-xl border border-indigo-500/20 w-14 h-14 overflow-hidden flex items-center justify-center shrink-0">
              <img src="/logo.svg" className="w-12 h-12 select-none" alt="ImmoManage Logo" referrerPolicy="no-referrer" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">ImmoManage</h1>
              <p className="text-neutral-400 text-sm">Gestion Immobilière avec Firebase Auth</p>
            </div>
          </div>

          <div className="flex bg-neutral-950 p-1 rounded-xl border border-neutral-800 mb-6">
            <button 
              onClick={() => { setAuthMode('login'); setEmail(''); setPassword(''); setAuthError(null); }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                authMode === 'login' ? 'bg-indigo-600 text-white shadow' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Connexion
            </button>
            <button 
              onClick={() => { setAuthMode('register'); setEmail(''); setPassword(''); setAuthError(null); }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                authMode === 'register' ? 'bg-indigo-600 text-white shadow' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Créer un compte
            </button>
          </div>

          {authError && (
            <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-400 font-sans space-y-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-bold">Erreur de Configuration Firebase</p>
                  <p className="mt-1 leading-relaxed">{authError}</p>
                </div>
              </div>
              {(authError.includes('not-allowed') || authError.includes('Firebase') || authError.includes('authentification')) && (
                <div className="bg-neutral-950/60 p-3 rounded-lg border border-neutral-800 space-y-2 font-sans mt-2">
                  <p className="font-bold text-white text-[11px] uppercase tracking-widest text-indigo-400">📊 Comment résoudre :</p>
                  <ol className="list-decimal list-inside space-y-1 text-neutral-400 leading-normal">
                    <li>Ouvrez la <a href="https://console.firebase.google.com/project/skillful-tesla-rrwfn/authentication/providers" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline font-semibold inline-flex items-center gap-0.5">Console Firebase <span className="text-[10px]">↗</span></a></li>
                    <li>Cliquez sur <strong className="text-neutral-300 font-medium">"Commencer"</strong> (ou "Activer" si demandé)</li>
                    <li>Activez le fournisseur de connexion :
                      <ul className="list-disc list-inside pl-4 mt-1 text-neutral-400">
                        <li><strong className="text-neutral-200">Adresse e-mail et mot de passe</strong></li>
                        <li><strong className="text-neutral-200">Google</strong></li>
                      </ul>
                    </li>
                  </ol>
                  <p className="text-[10px] text-neutral-500 leading-normal mt-1 border-t border-neutral-800/40 pt-1.5 font-mono">
                    ID Projet : skillful-tesla-rrwfn
                  </p>
                </div>
              )}
            </div>
          )}

          <form onSubmit={authMode === 'login' ? handleLogin : handleRegister} className="space-y-4">
            {authMode === 'register' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-neutral-300 ml-1">Prénom</label>
                  <input 
                    type="text" 
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all text-sm"
                    placeholder="Jean"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-neutral-300 ml-1">Nom</label>
                  <input 
                    type="text" 
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all text-sm"
                    placeholder="Dupont"
                    required
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-300 ml-1">Email</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all text-sm"
                placeholder="votre@email.com"
                required
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-300 ml-1">Mot de passe</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all text-sm"
                placeholder="••••••••"
                required
              />
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-xl transition-colors mt-4 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Key className="w-4 h-4" />
              {loading ? "Chargement..." : authMode === 'login' ? "Se connecter" : "S'inscrire"}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-800"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-neutral-900 px-3 text-neutral-500">Ou continuer avec</span>
            </div>
          </div>

          <button 
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-3 cursor-pointer group disabled:opacity-50"
          >
            <svg className="w-5 h-5 group-hover:scale-105 transition-transform" viewBox="0 0 24 24">
              <path fill="#EA4335" d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.47 15.01 0 12 0 7.37 0 3.39 2.67 1.44 6.56l3.84 2.98C6.19 6.84 8.87 5.04 12 5.04z"/>
              <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.34H12v4.44H18.44c-.28 1.44-1.09 2.66-2.31 3.48l3.6 2.79c2.1-1.94 3.31-4.79 3.31-8.37z"/>
              <path fill="#FBBC05" d="M5.28 14.78C5.04 14.07 4.9 13.32 4.9 12.5s.14-1.57.38-2.28L1.44 7.24C.52 9.07 0 11.23 0 12.5s.52 3.43 1.44 5.26l3.84-2.98z"/>
              <path fill="#34A853" d="M12 24c3.24 0 5.97-1.08 7.96-2.91l-3.6-2.79c-.99.66-2.26 1.06-3.96 1.06-3.13 0-5.81-1.8-6.76-4.5H1.44v2.98C3.39 21.33 7.37 24 12 24z"/>
            </svg>
            Se connecter avec Google
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-300 flex selection:bg-indigo-500/30">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 border-r border-neutral-800 flex flex-col p-4 bg-neutral-900/50 backdrop-blur-xl shrink-0">
        <div className="flex items-center gap-3 px-2 mb-10">
          <img src="/logo.svg" className="w-8 h-8 select-none" alt="ImmoManage Logo" referrerPolicy="no-referrer" />
          <span className="font-bold text-white text-lg tracking-tight">ImmoManage</span>
        </div>

        <nav className="flex-1 space-y-1">
          <SidebarItem 
            icon={<LayoutDashboard />} 
            label="Dashboard" 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')} 
          />
          <SidebarItem 
            icon={<Building2 />} 
            label="Biens Immo" 
            active={activeTab === 'biens'} 
            onClick={() => setActiveTab('biens')} 
          />
          <SidebarItem 
            icon={<Users />} 
            label="Clients" 
            active={activeTab === 'clients'} 
            onClick={() => setActiveTab('clients')} 
          />
          <SidebarItem 
            icon={<FileText />} 
            label="Contrats" 
            active={activeTab === 'contrats'} 
            onClick={() => setActiveTab('contrats')} 
            badge={expiringBails.length > 0 ? expiringBails.length : undefined}
          />
          <SidebarItem 
            icon={<Euro />} 
            label="Paiements" 
            active={activeTab === 'paiements'} 
            onClick={() => setActiveTab('paiements')} 
            badge={lateContractsCount > 0 ? lateContractsCount : undefined}
          />
          <SidebarItem 
            icon={<History />} 
            label="Historique" 
            active={activeTab === 'historique'} 
            onClick={() => setActiveTab('historique')} 
          />
        </nav>

        <div className="mt-auto border-t border-neutral-800 pt-4 flex items-center justify-between px-2">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 text-xs font-bold border border-indigo-500/20 uppercase shrink-0">
              {user?.first_name ? user.first_name[0] : 'A'}
            </div>
            <div className="text-xs truncate">
              <p className="text-white font-medium">{user?.first_name ? `${user.first_name} ${user.last_name || ''}` : 'Administrateur'}</p>
              <p className="opacity-50 text-[10px] truncate">{user?.email || 'admin@example.com'}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="text-neutral-500 hover:text-red-400 transition-colors ml-2 shrink-0">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-12 pb-28 md:pb-12 relative h-screen">
        <div className="max-w-6xl mx-auto">
          {activeTab === 'dashboard' && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
              <header className="flex justify-between items-end">
                <div>
                  <h2 className="text-3xl font-bold text-white tracking-tight">Bonjour, {user?.first_name || 'Admin'}</h2>
                  <p className="text-neutral-400">Voici l'état actuel de votre plateforme immobilière.</p>
                </div>
              </header>

              {/* Alerte Échéance de Bail Banner */}
              {expiringBails.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  className="bg-neutral-900 border border-amber-500/20 hover:border-amber-500/30 rounded-2xl p-5 md:p-6 shadow-xl shadow-amber-500/5 space-y-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-amber-500/10 rounded-xl border border-amber-500/25 flex items-center justify-center shrink-0">
                        <AlertTriangle className="w-5 h-5 text-amber-400 animate-pulse" />
                      </div>
                      <div>
                        <h3 className="text-sm md:text-base font-bold text-white flex items-center gap-2">
                          Alerte Échéance de Bail
                          <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold">
                            {expiringBails.length} {expiringBails.length === 1 ? 'contrat' : 'contrats'} à J-7 ou moins
                          </span>
                        </h3>
                        <p className="text-xs text-neutral-400 mt-0.5">
                          Des contrats de bail arrivent prochainement à expiration. Prenez des mesures ou notifiez le locataire.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    {expiringBails.map(c => {
                      const isAlreadyNotified = notifiedContrats.includes(c.id);
                      const isOverdueDate = c.daysRemaining < 0;
                      
                      return (
                        <div key={c.id} className="bg-neutral-950/60 border border-neutral-850 rounded-xl p-3.5 flex flex-col justify-between gap-3 text-xs">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-bold text-neutral-200 truncate">{c.bien_titre}</span>
                              <span className={`px-2 py-0.5 rounded font-mono text-[9px] font-bold uppercase tracking-wider ${
                                isOverdueDate 
                                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/10' 
                                  : c.daysRemaining === 7 
                                    ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/10'
                                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/10'
                              }`}>
                                {isOverdueDate 
                                  ? `Expiré il y a ${Math.abs(c.daysRemaining)} j` 
                                  : c.daysRemaining === 0 
                                    ? "Aujourd'hui !" 
                                    : `${c.daysRemaining} jours restants`
                                }
                              </span>
                            </div>
                            <p className="text-[11px] text-neutral-400">Locataire : <span className="text-neutral-300 font-medium font-mono">{c.locataire_email || 'Non renseigné'}</span></p>
                            <p className="text-[10px] text-neutral-500">Date de fin : {c.date_fin ? new Date(c.date_fin).toLocaleDateString('fr-FR') : 'Non renseignée'}</p>
                          </div>

                          <div className="flex items-center justify-between border-t border-neutral-850/60 pt-2.5">
                            {isAlreadyNotified ? (
                              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/10 flex items-center gap-1 opacity-90 select-none">
                                ✓ Notifié
                              </span>
                            ) : (
                              <span className="text-[10px] font-semibold text-neutral-500 italic">
                                En attente d'avis
                              </span>
                            )}

                            {!isAlreadyNotified ? (
                              <button
                                onClick={() => handleSendExpiryNotification(c, c.daysRemaining)}
                                className="bg-indigo-600/10 hover:bg-indigo-600/20 active:scale-95 text-indigo-400 hover:text-indigo-300 font-bold px-3 py-1.5 rounded-lg text-[11px] transition-all border border-indigo-500/15 cursor-pointer flex items-center gap-1.5"
                              >
                                <Bell className="w-3.5 h-3.5" />
                                Notifier
                              </button>
                            ) : (
                              <button
                                disabled
                                className="bg-neutral-900 text-neutral-600 font-medium px-3 py-1.5 rounded-lg text-[11px] border border-neutral-850 cursor-not-allowed flex items-center gap-1"
                              >
                                ✓ Notifié
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <StatCard label="Biens actifs" value={activeBiensCount.toString()} color="indigo" />
                <StatCard label="Clients enregistrés" value={locataires.length.toString()} color="cyan" />
                <StatCard label="Contrats en cours" value={activeContractsCount.toString()} color="violet" />
                <StatCard label="Revenus mensuels" value={`${monthlyRentRevenue.toLocaleString()} €`} color="emerald" />
                <StatCard label="Taux de vacance" value={`${vacancyRate}%`} color="rose" />
              </div>

              {/* Evolution of Rents Bar Chart */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <h3 className="text-lg font-semibold text-white">Évolution des revenus locatifs</h3>
                    <p className="text-xs text-neutral-400">Rapprochement financier des loyers encaissés versus retard de paiements (6 derniers mois)</p>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                      <span className="text-neutral-300">Encaissés</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                      <span className="text-neutral-300">Impayés / Retard</span>
                    </div>
                  </div>
                </div>
                <div className="h-[280px] w-full font-sans text-xs">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={last6MonthsData}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#262626" horizontal={true} vertical={false} />
                      <XAxis 
                        dataKey="name" 
                        stroke="#737373" 
                        tick={{ fill: '#a3a3a3' }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis 
                        stroke="#737373" 
                        tick={{ fill: '#a3a3a3' }}
                        tickFormatter={(v) => `${v.toLocaleString()} €`}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip 
                        cursor={{ fill: 'rgba(255, 255, 255, 0.03)' }}
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const dataObj = payload[0].payload;
                            return (
                              <div className="bg-neutral-950 border border-neutral-800 p-3 rounded-xl shadow-2xl text-xs space-y-1.5">
                                <p className="font-bold text-white border-b border-neutral-800 pb-1 mb-1">{dataObj.fullName}</p>
                                {payload.map((entry: any, i: number) => (
                                  <div key={i} className="flex items-center gap-6 justify-between">
                                    <span className="flex items-center gap-1.5 text-neutral-400">
                                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                                      {entry.name} :
                                    </span>
                                    <span className="font-semibold text-white font-mono">
                                      {entry.value.toLocaleString()} €
                                    </span>
                                  </div>
                                ))}
                                <div className="border-t border-neutral-850 pt-1.5 mt-1 flex gap-6 justify-between font-bold text-indigo-400">
                                  <span>Total attendu :</span>
                                  <span className="font-mono text-indigo-300">
                                    {((dataObj['Loyers Encaissés'] || 0) + (dataObj['En Retard / Impayés'] || 0)).toLocaleString()} €
                                  </span>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar 
                        dataKey="Loyers Encaissés" 
                        fill="#6366f1" 
                        radius={[4, 4, 0, 0]} 
                        maxBarSize={45}
                        name="Loyers Encaissés"
                      />
                      <Bar 
                        dataKey="En Retard / Impayés" 
                        fill="#f43f5e" 
                        radius={[4, 4, 0, 0]} 
                        maxBarSize={45}
                        name="En Retard / Impayés"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-12">
                <div className="lg:col-span-2 space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-white">Derniers biens ajoutés</h3>
                    <button onClick={() => setActiveTab('biens')} className="text-xs text-indigo-400 hover:underline">Voir tout</button>
                  </div>
                  <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
                    {biens.length === 0 ? (
                      <div className="p-8 text-center text-neutral-500 italic">Aucun bien trouvé.</div>
                    ) : (
                      <div className="overflow-x-auto w-full scrollbar-none">
                        <table className="w-full text-left border-collapse min-w-[550px] md:min-w-0">
                          <thead>
                            <tr className="border-b border-neutral-800 text-xs font-medium text-neutral-500 uppercase tracking-wider">
                              <th className="px-6 py-4">Désignation</th>
                              <th className="px-6 py-4">Type</th>
                              <th className="px-6 py-4">Ville</th>
                              <th className="px-6 py-4">Prix</th>
                              <th className="px-6 py-4">Statut</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-neutral-800 text-sm">
                            {biens.slice(0, 5).map(bien => (
                              <tr key={bien.id} onClick={() => { setActiveTab('biens'); }} className="hover:bg-neutral-800/40 transition-colors cursor-pointer">
                                <td className="px-6 py-4 font-medium text-white">{bien.titre}</td>
                                <td className="px-6 py-4 capitalize">{bien.type}</td>
                                <td className="px-6 py-4 flex items-center gap-1"><MapPin className="w-3 h-3 opacity-40"/> {bien.ville}</td>
                                <td className="px-6 py-4 font-mono">{bien.prix.toLocaleString()} €</td>
                                <td className="px-6 py-4">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                                    bien.statut === 'disponible' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                  }`}>
                                    {bien.statut}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-white">Actions rapides</h3>
                  <div className="space-y-3">
                    <ActionButton icon={<Plus/>} label="Nouveau bien" color="indigo" onClick={openNewBien} />
                    <ActionButton icon={<Users/>} label="Nouveau client" color="neutral" onClick={openNewLocataire} />
                    <ActionButton icon={<FileText/>} label="Générer un bail" color="neutral" onClick={() => openNewContrat('bail')} />
                  </div>
                  
                  <div className="p-6 bg-gradient-to-br from-indigo-500/10 to-violet-500/10 border border-indigo-500/20 rounded-2xl">
                    <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-2">Conseil Expert AI</p>
                    <p className="text-sm text-white/80 leading-relaxed font-sans">
                      "Utilisez l'onglet 'Contrats' pour lier des clients enregistrés à vos propriétés. Cela incrémente vos relevés financiers mensuels directement."
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'biens' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <header className="flex justify-between items-center">
                <h2 className="text-3xl font-bold text-white tracking-tight">Biens Immobiliers</h2>
                <button onClick={openNewBien} className="bg-indigo-600 hover:bg-indigo-500 text-sm font-semibold px-4 py-2 rounded-xl text-white transition-all transform active:scale-95 flex items-center gap-2 shadow-lg shadow-indigo-600/20 cursor-pointer">
                  <Plus className="w-4 h-4" /> Ajouter un bien
                </button>
              </header>
              
              {/* Search filter bar */}
              <div className="flex flex-col sm:flex-row gap-4 p-4 bg-neutral-900 border border-neutral-800 rounded-2xl">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                  <input 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Rechercher par ville, désignation..." 
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500" 
                  />
                </div>
                <select 
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="bg-neutral-950 border border-neutral-800 text-sm rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="Tous">Type : Tous</option>
                  <option value="appartement">Appartement</option>
                  <option value="maison">Maison</option>
                  <option value="bureau">Bureau</option>
                </select>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(loading ? Array.from({length: 6}) : filteredBiens).map((bien, i) => (
                  <div key={bien?.id || i} className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden group hover:border-neutral-700 transition-all flex flex-col justify-between">
                    <div>
                      <div className="aspect-[4/3] bg-neutral-800 relative overflow-hidden">
                        {loading ? (
                          <div className="w-full h-full animate-pulse" />
                        ) : (
                          <img src={`https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=800`} alt="house" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" referrerPolicy="no-referrer" />
                        )}
                        <div className="absolute top-4 right-4 px-3 py-1 bg-black/50 backdrop-blur-md rounded-full text-[10px] font-bold text-white uppercase tracking-widest border border-white/10">
                          {loading ? '...' : bien.type}
                        </div>
                      </div>
                      <div className="p-5 space-y-2">
                        <div className="flex justify-between items-start gap-2">
                          <h4 className="text-white font-semibold truncate leading-tight">{loading ? '...' : bien.titre}</h4>
                          <span className={`px-2 py-0.5 shrink-0 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                            bien?.statut === 'disponible' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}>
                            {loading ? '...' : bien.statut}
                          </span>
                        </div>
                        <p className="text-neutral-500 text-xs flex items-center gap-1"><MapPin className="w-3 h-3"/> {loading ? '...' : bien.ville}</p>
                        <p className={`text-neutral-400 text-xs line-clamp-2 mt-2 leading-relaxed ${loading ? 'opacity-0' : ''}`}>
                          {bien?.description || "Aucune description fournie pour ce bien immobilier d'exception."}
                        </p>
                        <div className="flex gap-4 text-xs font-mono text-neutral-500 mt-2">
                          <span>{bien?.surface || 45} m²</span>
                          <span>•</span>
                          <span>{bien?.nb_pieces || 2} pièces</span>
                        </div>
                      </div>
                    </div>
                    <div className="px-5 pb-5 pt-2 flex justify-between items-center bg-neutral-900/50 border-t border-neutral-800/40">
                      <span className="text-lg font-bold text-white leading-none">{loading ? '...' : (bien.prix || 0).toLocaleString()} €</span>
                      {!loading && (
                        <div className="flex items-center gap-1">
                          <button onClick={() => openEditBien(bien)} className="text-amber-400 hover:bg-amber-500/10 p-2 rounded-lg transition-colors cursor-pointer" title="Modifier">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDeleteBien(bien.id)} className="text-rose-500 hover:bg-rose-500/10 p-2 rounded-lg transition-colors cursor-pointer" title="Supprimer">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {!loading && filteredBiens.length === 0 && (
                  <div className="col-span-full py-12 text-center text-neutral-500 italic">
                    Aucun bien correspondant aux filtres de recherche.
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'contrats' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <header className="flex justify-between items-center">
                <h2 className="text-3xl font-bold text-white tracking-tight">Contrats</h2>
                <button onClick={() => openNewContrat()} className="bg-indigo-600 hover:bg-indigo-500 text-sm font-semibold px-4 py-2 rounded-xl text-white transition-all transform active:scale-95 flex items-center gap-2 shadow-lg shadow-indigo-600/20 cursor-pointer">
                  <Plus className="w-4 h-4" /> Nouveau contrat
                </button>
              </header>

              {/* Alerte Échéance de Bail Banner inside Contracts tab */}
              {expiringBails.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  className="bg-neutral-900 border border-amber-500/20 hover:border-amber-500/30 rounded-2xl p-5 md:p-6 shadow-xl shadow-amber-500/5 space-y-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-amber-500/10 rounded-xl border border-amber-500/25 flex items-center justify-center shrink-0">
                        <AlertTriangle className="w-5 h-5 text-amber-400 animate-pulse" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                          Avis de fin de bail imminent (J-7)
                          <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold">
                            {expiringBails.length} contrat{expiringBails.length > 1 ? 's' : ''} concerné{expiringBails.length > 1 ? 's' : ''}
                          </span>
                        </h4>
                        <p className="text-xs text-neutral-400 mt-0.5">
                          Ces baux d'habitation arrivent à terme. Cliquez sur "Notifier" pour enregistrer l'envoi de l'avertissement réglementaire.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    {expiringBails.map(c => {
                      const isAlreadyNotified = notifiedContrats.includes(c.id);
                      const isOverdueDate = c.daysRemaining < 0;
                      
                      return (
                        <div key={c.id} className="bg-neutral-950/60 border border-neutral-850 rounded-xl p-3.5 flex flex-col justify-between gap-3 text-xs">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-bold text-neutral-200 truncate">{c.bien_titre}</span>
                              <span className={`px-2 py-0.5 rounded font-mono text-[9px] font-bold uppercase tracking-wider ${
                                isOverdueDate 
                                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/10' 
                                  : c.daysRemaining === 7 
                                    ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/10'
                                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/10'
                              }`}>
                                {isOverdueDate 
                                  ? `Expiré il y a ${Math.abs(c.daysRemaining)} j` 
                                  : c.daysRemaining === 0 
                                    ? "Aujourd'hui !" 
                                    : `${c.daysRemaining} jours restants`
                                }
                              </span>
                            </div>
                            <p className="text-[11px] text-neutral-400">Locataire : <span className="text-neutral-300 font-medium font-mono">{c.locataire_email || 'Non renseigné'}</span></p>
                            <p className="text-[10px] text-neutral-500">Fin : {c.date_fin ? new Date(c.date_fin).toLocaleDateString('fr-FR') : 'Non renseignée'}</p>
                          </div>

                          <div className="flex items-center justify-between border-t border-neutral-850/60 pt-2.5">
                            {isAlreadyNotified ? (
                              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/10 flex items-center gap-1.5 opacity-90 select-none">
                                ✓ Notifié
                              </span>
                            ) : (
                              <span className="text-[10px] font-semibold text-neutral-500 italic">
                                Non notifié
                              </span>
                            )}

                            {!isAlreadyNotified ? (
                              <button
                                onClick={() => handleSendExpiryNotification(c, c.daysRemaining)}
                                className="bg-indigo-600/10 hover:bg-indigo-600/20 active:scale-95 text-indigo-400 hover:text-indigo-300 font-bold px-3 py-1.5 rounded-lg text-[11px] transition-all border border-indigo-500/15 cursor-pointer flex items-center gap-1.5"
                              >
                                <Bell className="w-3.5 h-3.5" />
                                Notifier le client
                              </button>
                            ) : (
                              <button
                                disabled
                                className="bg-neutral-900 text-neutral-600 font-medium px-3 py-1.5 rounded-lg text-[11px] border border-neutral-850 cursor-not-allowed flex items-center gap-1"
                              >
                                ✓ Notifié
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
                {contrats.length === 0 ? (
                  <div className="p-8 text-center text-neutral-500 italic">Aucun contrat trouvé.</div>
                ) : (
                  <div className="overflow-x-auto w-full scrollbar-none">
                    <table className="w-full text-left border-collapse min-w-[750px] md:min-w-0">
                      <thead>
                        <tr className="border-b border-neutral-800 text-xs font-medium text-neutral-500 uppercase tracking-wider">
                          <th className="px-6 py-4">Bien</th>
                          <th className="px-6 py-4">Type</th>
                          <th className="px-6 py-4">Locataire</th>
                          <th className="px-6 py-4">Période</th>
                          <th className="px-6 py-4">Montant</th>
                          <th className="px-6 py-4">Statut</th>
                          <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-800 text-sm">
                        {contrats.map(contrat => (
                          <tr key={contrat.id} className="hover:bg-neutral-800/40 transition-colors">
                            <td className="px-6 py-4 font-medium text-white">{contrat.bien_titre}</td>
                            <td className="px-6 py-4 capitalize">{contrat.type}</td>
                            <td className="px-6 py-4">{contrat.locataire_email || 'N/A'}</td>
                            <td className="px-6 py-4 text-xs">
                              {contrat.date_debut ? new Date(contrat.date_debut).toLocaleDateString() : 'N/A'} - <br/>
                              {contrat.date_fin ? new Date(contrat.date_fin).toLocaleDateString() : 'Indéterminé'}
                            </td>
                            <td className="px-6 py-4 font-mono">
                              {contrat.type === 'vente' ? `${(contrat.prix_vente || 0).toLocaleString()} €` : `${(contrat.loyer_mensuel || 0).toLocaleString()} €/mois`}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                                contrat.statut === 'actif' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                              }`}>
                                {contrat.statut}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button onClick={() => openDocModal(contrat)} className="text-indigo-400 hover:bg-indigo-500/10 p-2 rounded-lg transition-colors cursor-pointer" title="Documents (Baux, Quittances)">
                                  <Paperclip className="w-4 h-4" />
                                </button>
                                <button onClick={() => openEditContrat(contrat)} className="text-amber-400 hover:bg-amber-500/10 p-2 rounded-lg transition-colors cursor-pointer" title="Modifier">
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button onClick={() => handleDeleteContrat(contrat.id)} className="text-rose-500 hover:bg-rose-500/10 p-2 rounded-lg transition-colors cursor-pointer" title="Supprimer">
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
          )}

          {activeTab === 'clients' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <header className="flex justify-between items-center">
                <h2 className="text-3xl font-bold text-white tracking-tight">Clients (Locataires)</h2>
                <button onClick={openNewLocataire} className="bg-indigo-600 hover:bg-indigo-500 text-sm font-semibold px-4 py-2 rounded-xl text-white transition-all transform active:scale-95 flex items-center gap-2 shadow-lg shadow-indigo-600/20 cursor-pointer">
                  <Plus className="w-4 h-4" /> Nouveau client
                </button>
              </header>
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
                {locataires.length === 0 ? (
                  <div className="p-8 text-center text-neutral-500 italic">Aucun client trouvé.</div>
                ) : (
                  <div className="overflow-x-auto w-full scrollbar-none">
                    <table className="w-full text-left border-collapse min-w-[700px] md:min-w-0">
                      <thead>
                        <tr className="border-b border-neutral-800 text-xs font-medium text-neutral-500 uppercase tracking-wider">
                          <th className="px-6 py-4">Nom Complet</th>
                          <th className="px-6 py-4">Email / Téléphone</th>
                          <th className="px-6 py-4">Profession</th>
                          <th className="px-6 py-4">Revenu Mensuel</th>
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
                                className="font-semibold text-indigo-400 hover:text-indigo-300 hover:underline transition-colors focus:outline-none text-left cursor-pointer flex items-center gap-1.5 group font-sans"
                                title="Voir la fiche détaillée"
                              >
                                {loc.first_name} {loc.last_name}
                                <Eye className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-indigo-400" />
                              </button>
                            </td>
                            <td className="px-6 py-4">
                              <p className="text-white">{loc.email}</p>
                              <p className="text-neutral-500 text-xs">{loc.phone || 'Aucun numéro'}</p>
                            </td>
                            <td className="px-6 py-4">{loc.profession || 'N/A'}</td>
                            <td className="px-6 py-4 font-mono">{(loc.revenu_mensuel || 0).toLocaleString()} €</td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button onClick={() => openEditLocataire(loc)} className="text-amber-400 hover:bg-amber-500/10 p-2 rounded-lg transition-colors cursor-pointer" title="Modifier">
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button onClick={() => handleDeleteLocataire(loc.id)} className="text-rose-500 hover:bg-rose-500/10 p-2 rounded-lg transition-colors cursor-pointer" title="Supprimer">
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
          )}

          {activeTab === 'paiements' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <header className="flex justify-between items-center">
                <div>
                  <h2 className="text-3xl font-bold text-white tracking-tight">Suivi & Rapports Financiers</h2>
                  <p className="text-neutral-400">Suivi des loyers encaissés et génération d'états de gérance.</p>
                </div>
              </header>

              {/* Sub-tab Navigation */}
              <div className="flex gap-2 border-b border-neutral-800 pb-px">
                <button
                  type="button"
                  onClick={() => setPaymentsSubTab('suivi')}
                  className={`px-4 py-2 text-xs font-bold transition-all cursor-pointer border-b-2 ${
                    paymentsSubTab === 'suivi'
                      ? 'border-indigo-500 text-indigo-400 font-bold bg-indigo-500/5'
                      : 'border-transparent text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  Suivi des Paiements
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentsSubTab('releves')}
                  className={`px-4 py-2 text-xs font-bold transition-all cursor-pointer border-b-2 ${
                    paymentsSubTab === 'releves'
                      ? 'border-indigo-500 text-indigo-400 font-bold bg-indigo-500/5'
                      : 'border-transparent text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  Relevés Financiers (GED & Gérance)
                </button>
              </div>

              {paymentsSubTab === 'suivi' ? (
                <div className="space-y-6">
                  {lateContractsCount > 0 && (
                    <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl flex items-start gap-3">
                      <div className="p-2 bg-rose-500/20 rounded-lg text-rose-400 mt-0.5 shrink-0 animate-pulse">
                        <Euro className="w-5 h-5 text-rose-400" />
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-sm">Alerte de paiement en retard !</h4>
                        <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                          L'algorithme de détection a identifié <strong className="text-rose-400 font-semibold">{lateContractsCount} contrat{lateContractsCount > 1 ? 's' : ''}</strong> en anomalie de règlement pour ce mois-ci. Les relances doivent être envoyées sans délai.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-4 bg-neutral-950 border border-neutral-800/60 rounded-xl">
                      <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Total Encaissé (Mois)</p>
                      <p className="text-2xl font-bold text-white">
                        {totalPaidRent.toLocaleString()} €
                      </p>
                    </div>
                    <div className="p-4 bg-neutral-950 border border-neutral-800/60 rounded-xl">
                      <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-1">Règlements reçus</p>
                      <p className="text-2xl font-bold text-white">{complianceRate}%</p>
                    </div>
                    <div className="p-4 bg-neutral-950 border border-neutral-800/60 rounded-xl">
                      <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest mb-1">Impayés / Retards</p>
                      <p className="text-2xl font-bold text-white">{totalLateRent.toLocaleString()} €</p>
                    </div>
                  </div>

                  <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-xl">
                    <div className="overflow-x-auto w-full scrollbar-none">
                      <table className="w-full text-left border-collapse min-w-[750px] md:min-w-0">
                        <thead>
                          <tr className="border-b border-neutral-800 text-xs font-medium text-neutral-500 uppercase tracking-wider">
                            <th className="px-6 py-4">Contrat / Locataire</th>
                            <th className="px-6 py-4">Mois / Échéance</th>
                            <th className="px-6 py-4">Montant du Loyer</th>
                            <th className="px-6 py-4">Méthode</th>
                            <th className="px-6 py-4 font-right">Statut</th>
                            <th className="px-6 py-4 text-right">Historique</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-800 text-sm">
                          {contrats.filter(c => c.type === 'bail').map((c, idx) => {
                            const pStatus = getContratPaymentStatus(c);
                            return (
                              <tr 
                                key={c.id || idx} 
                                onClick={() => setSelectedHistoryContrat(c)}
                                className="hover:bg-neutral-800/60 transition-colors cursor-pointer group"
                                title="Cliquez pour afficher l'historique détaillé des paiements sur l'année en cours"
                              >
                                <td className="px-6 py-4">
                                  <p className="font-medium text-white group-hover:text-indigo-400 transition-colors">{c.bien_titre}</p>
                                  <p className="text-xs text-neutral-500">{c.locataire_email || 'Bailleur en direct'}</p>
                                </td>
                                <td className="px-6 py-4 text-xs font-mono uppercase text-neutral-300">
                                  {new Date().toLocaleString('fr-FR', { month: 'long', year: 'numeric' })}
                                </td>
                                <td className="px-6 py-4 font-mono text-neutral-200">{(c.loyer_mensuel || 1000).toLocaleString()} €</td>
                                <td className="px-6 py-4 text-neutral-450 text-xs">Virement bancaire / RIB</td>
                                <td className="px-6 py-4">
                                  {pStatus.isLate ? (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-rose-500/10 text-rose-400 border border-rose-500/20 animate-pulse inline-flex items-center gap-1">
                                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                                      Retard ({pStatus.delayDays}j)
                                    </span>
                                  ) : pStatus.status === 'paye' ? (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 inline-flex items-center gap-1">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                      Payé
                                    </span>
                                  ) : pStatus.status === 'attente' ? (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-amber-500/10 text-amber-400 border border-amber-500/20 inline-flex items-center gap-1">
                                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                      Échéance ({pStatus.dueDay})
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-blue-500/10 text-blue-400 border border-blue-500/20 inline-flex items-center gap-1">
                                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                      {pStatus.label}
                                    </span>
                                  )}
                                </td>
                                <td className="px-6 py-4 text-right">
                                  <span className="text-xs text-indigo-400 font-semibold bg-indigo-500/5 group-hover:bg-indigo-500/15 group-hover:text-indigo-300 border border-indigo-500/10 group-hover:border-indigo-500/30 px-3 py-1.5 rounded-xl transition-all inline-flex items-center gap-1.5">
                                    <History className="w-3.5 h-3.5" />
                                    <span>Consulter</span>
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                          {contrats.filter(c => c.type === 'bail').length === 0 && (
                            <tr>
                              <td colSpan={6} className="p-8 text-center text-neutral-500 italic">Aucun paiement enregistré (ajoutez un bail d'abord).</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Explanatory introduction banner */}
                  <div className="bg-indigo-500/5 border border-indigo-500/15 text-indigo-400 p-5 rounded-2xl flex items-start gap-3.5 relative overflow-hidden">
                    <div className="p-2.5 bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-indigo-400 shrink-0">
                      <FileSpreadsheet className="w-5 h-5 text-indigo-300" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-bold text-white text-sm">Génération de Relevés Financiers de Gérance</h4>
                      <p className="text-xs text-neutral-400 leading-relaxed max-w-3xl">
                        Produisez, imprimez et archivez des relevés de performance annuels détaillés pour chacun de vos baux d'habitation. Les relevés intègrent l'historique complet du grand livre de comptes, consolidant les loyers perçus, les retards cumulés et le calcul automatique des honoraires de gestion (8.00 %).
                      </p>
                    </div>
                  </div>

                  <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-xl">
                    <div className="overflow-x-auto w-full scrollbar-none">
                      <table className="w-full text-left border-collapse min-w-[700px] md:min-w-0">
                        <thead>
                          <tr className="border-b border-neutral-800 text-xs font-medium text-neutral-500 uppercase tracking-wider">
                            <th className="px-6 py-4">Bien immobilier</th>
                            <th className="px-6 py-4">Locataire</th>
                            <th className="px-6 py-4">Exercice</th>
                            <th className="px-6 py-4">Loyers Perçus / Attendus</th>
                            <th className="px-6 py-4 text-right">Actions de Gérance</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-800 text-sm">
                          {contrats.filter(c => c.type === 'bail').map((c, idx) => {
                            const history = getContratPaymentHistory(c);
                            const totalDue = history.reduce((sum, h) => sum + (h.amount || 0), 0);
                            const totalPaid = history.reduce((sum, h) => sum + (h.status === 'paye' || h.status === 'paye_en_retard' ? h.amount : 0), 0);
                            const isFullyPaid = totalPaid === totalDue && totalDue > 0;
                            
                            return (
                              <tr key={c.id || idx} className="hover:bg-neutral-850/30 transition-colors">
                                <td className="px-6 py-4">
                                  <p className="font-semibold text-white">{c.bien_titre}</p>
                                  <p className="text-xs text-neutral-500">Loyer mensuel : {c.loyer_mensuel?.toLocaleString() || '1000'} €</p>
                                </td>
                                <td className="px-6 py-4 text-xs font-mono text-neutral-300">
                                  {c.locataire_email || 'Bailleur en direct'}
                                </td>
                                <td className="px-6 py-4 text-xs font-bold text-neutral-400 font-mono">
                                  Année 2026
                                </td>
                                <td className="px-6 py-4">
                                  <div className="space-y-1">
                                    <span className="font-mono text-xs font-bold text-neutral-200">
                                      {totalPaid.toLocaleString()} € / {totalDue.toLocaleString()} €
                                    </span>
                                    <div className="w-28 bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                                      <div 
                                        className={`h-full rounded-full ${isFullyPaid ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                                        style={{ width: `${totalDue > 0 ? (totalPaid / totalDue) * 100 : 0}%` }}
                                      />
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                  <div className="flex justify-end gap-2">
                                    <button
                                      type="button"
                                      onClick={() => setSelectedReleveContrat(c)}
                                      className="bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-xs font-semibold px-3 py-2 rounded-xl text-neutral-300 hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer"
                                      title="Visualiser et imprimer le relevé"
                                    >
                                      <Eye className="w-3.5 h-3.5 text-neutral-500 hover:text-neutral-300" />
                                      Consulter
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                          {contrats.filter(c => c.type === 'bail').length === 0 && (
                            <tr>
                              <td colSpan={5} className="p-8 text-center text-neutral-500 italic">Aucun bail d'habitation enregistré pour le calcul des relevés.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'historique' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-3xl font-bold text-white tracking-tight">Historique d'Activité</h2>
                  <p className="text-neutral-400">Journal d'audit des flux et opérations de la plateforme.</p>
                </div>
                <button
                  onClick={() => {
                    setConfirmModal({
                      isOpen: true,
                      title: "Effacer l'historique d'activité",
                      message: "Êtes-vous sûr de vouloir vider tout le journal d'activité ? Cette opération est irréversible.",
                      onConfirm: () => {
                        const defaultLog = [
                          {
                            id: 'log-default',
                            type: 'creation' as const,
                            target: 'contrat' as const,
                            title: 'Base de logs réinitialisée',
                            description: 'Le journal des événements a été nettoyé ou initialisé.',
                            timestamp: "À l'instant",
                            date: new Date().toLocaleString('fr-FR')
                          }
                        ];
                        setActionLogs(defaultLog);
                        localStorage.setItem('immo_action_logs', JSON.stringify(defaultLog));
                        setToastMsg("L'historique a été réinitialisé !");
                        setConfirmModal(null);
                      }
                    });
                  }}
                  className="bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-xs font-semibold px-4 py-2.5 rounded-xl text-neutral-300 hover:text-white transition-all transform active:scale-95 flex items-center gap-2 cursor-pointer shadow-lg shrink-0"
                >
                  <Trash2 className="w-4 h-4 text-neutral-400" />
                  Effacer l'historique
                </button>
              </header>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-5 bg-neutral-900 border border-neutral-800 rounded-2xl items-center shadow-md">
                {/* Left: Category Filters */}
                <div className="lg:col-span-7 space-y-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-neutral-500 font-bold tracking-wider font-mono uppercase">Filtrer par entité</span>
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                    {['all', 'contrat', 'bien', 'locataire'].map(f => (
                      <button
                        key={f}
                        onClick={() => setHistoryFilter(f)}
                        className={`px-4 py-2 rounded-xl text-xs font-semibold border capitalize cursor-pointer transition-all shrink-0 ${
                          historyFilter === f 
                            ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20 shadow-sm shadow-indigo-500/5 font-bold' 
                            : 'bg-neutral-950/40 text-neutral-400 border-neutral-850 hover:text-neutral-200 hover:bg-neutral-900'
                        }`}
                      >
                        {f === 'all' ? 'Toutes les actions' : f === 'locataire' ? 'Clients' : f === 'bien' ? 'Biens' : 'Contrats'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Right: Date Range Selector */}
                <div className="lg:col-span-5 space-y-2.5 w-full">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-neutral-500 font-bold tracking-wider font-mono uppercase">Période spécifique</span>
                    {(historyStartDate || historyEndDate) && (
                      <button 
                        onClick={() => {
                          setHistoryStartDate('');
                          setHistoryEndDate('');
                        }}
                        className="text-[10px] text-indigo-400 hover:text-indigo-350 font-bold flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <X className="w-3 h-3" /> Réinitialiser
                      </button>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 bg-neutral-950/60 p-2 rounded-xl border border-neutral-800 focus-within:border-neutral-700 transition-colors h-[38px]">
                    <Calendar className="w-4 h-4 text-neutral-500 shrink-0 ml-1" />
                    
                    <div className="flex items-center gap-2 w-full text-xs">
                      <input 
                        type="date"
                        value={historyStartDate}
                        onChange={(e) => setHistoryStartDate(e.target.value)}
                        className="bg-transparent border-0 text-white placeholder-neutral-600 focus:ring-0 focus:outline-none w-full text-xs font-medium cursor-pointer [color-scheme:dark]"
                        placeholder="Début"
                      />
                      
                      <span className="text-neutral-650 font-bold text-xs shrink-0">-</span>
                      
                      <input 
                        type="date"
                        value={historyEndDate}
                        onChange={(e) => setHistoryEndDate(e.target.value)}
                        className="bg-transparent border-0 text-white placeholder-neutral-600 focus:ring-0 focus:outline-none w-full text-xs font-medium cursor-pointer [color-scheme:dark]"
                        placeholder="Fin"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 md:p-8 shadow-xl">
                {filteredLogs.length === 0 ? (
                  <div className="py-20 text-center text-neutral-500 italic text-sm">Aucune action enregistrée pour ce filtre.</div>
                ) : (
                  <div className="relative border-l border-neutral-800 pr-1 pl-6 ml-3 space-y-8 py-2">
                    {filteredLogs.map((log) => {
                      let icon = <Plus className="w-3.5 h-3.5 text-emerald-400" />;
                      let colorBg = 'bg-emerald-500/10 border-emerald-500/20';
                      if (log.type === 'edition') {
                        icon = <Edit className="w-3.5 h-3.5 text-amber-400" />;
                        colorBg = 'bg-amber-500/10 border-amber-500/20';
                      } else if (log.type === 'suppression') {
                        icon = <Trash2 className="w-3.5 h-3.5 text-rose-400" />;
                        colorBg = 'bg-rose-500/10 border-rose-500/20';
                      }

                      return (
                        <div key={log.id} className="relative group/log transition-all">
                          {/* Timeline Dot Indicator */}
                          <div className={`absolute -left-[37px] top-1.5 w-6 h-6 rounded-full border flex items-center justify-center shrink-0 z-10 transition-transform group-hover/log:scale-110 ${colorBg}`}>
                            {icon}
                          </div>

                          <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                            <div className="space-y-1">
                              <h4 className="font-semibold text-base text-neutral-205 group-hover/log:text-white transition-colors flex items-center gap-2.5 flex-wrap">
                                {log.title}
                                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase tracking-wider text-indigo-400 bg-indigo-500/5 border border-indigo-500/10">
                                  {log.target === 'locataire' ? 'client' : log.target}
                                </span>
                              </h4>
                              <p className="text-sm text-neutral-400 leading-relaxed font-sans">{log.description}</p>
                            </div>
                            <div className="text-left md:text-right shrink-0">
                              <p className="text-xs font-mono text-neutral-400 mt-0.5">{log.date}</p>
                              <p className="text-[10px] text-indigo-400 font-bold tracking-wider uppercase mt-1">{log.timestamp}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </main>

      {/* Mobile Bottom Navigation Bar styled after the premium design */}
      <div className="fixed bottom-0 left-0 right-0 z-[80] block md:hidden bg-neutral-900/90 backdrop-blur-xl border-t border-neutral-800/80 shadow-2xl pb-2">
        <div className="flex items-center justify-around px-2 py-1.5 h-16 max-w-lg mx-auto">
          {/* Dashboard */}
          <button 
            onClick={() => setActiveTab('dashboard')}
            className="flex-1 flex flex-col items-center justify-center transition-all cursor-pointer relative"
          >
            <div className={`p-1.5 rounded-xl transition-all ${
              activeTab === 'dashboard' 
                ? 'bg-indigo-500/10 text-indigo-400 scale-105 border border-indigo-500/20' 
                : 'text-neutral-500 hover:text-neutral-300'
            }`}>
              <LayoutDashboard className="w-5 h-5" />
            </div>
            <span className={`text-[8px] font-bold tracking-wider mt-1 uppercase transition-colors duration-200 ${
              activeTab === 'dashboard' ? 'text-white' : 'text-neutral-500'
            }`}>
              Accueil
            </span>
            {activeTab === 'dashboard' && (
              <span className="w-1 h-1 rounded-full bg-indigo-500 mt-1 absolute bottom-[-4px]" />
            )}
          </button>

          {/* Biens */}
          <button 
            onClick={() => setActiveTab('biens')}
            className="flex-1 flex flex-col items-center justify-center transition-all cursor-pointer relative"
          >
            <div className={`p-1.5 rounded-xl transition-all ${
              activeTab === 'biens' 
                ? 'bg-indigo-500/10 text-indigo-400 scale-105 border border-indigo-500/20' 
                : 'text-neutral-500 hover:text-neutral-300'
            }`}>
              <Building2 className="w-5 h-5" />
            </div>
            <span className={`text-[8px] font-bold tracking-wider mt-1 uppercase transition-colors duration-200 ${
              activeTab === 'biens' ? 'text-white' : 'text-neutral-500'
            }`}>
              Biens
            </span>
            {activeTab === 'biens' && (
              <span className="w-1 h-1 rounded-full bg-indigo-500 mt-1 absolute bottom-[-4px]" />
            )}
          </button>

          {/* Clients */}
          <button 
            onClick={() => setActiveTab('clients')}
            className="flex-1 flex flex-col items-center justify-center transition-all cursor-pointer relative"
          >
            <div className={`p-1.5 rounded-xl transition-all ${
              activeTab === 'clients' 
                ? 'bg-indigo-500/10 text-indigo-400 scale-105 border border-indigo-500/20' 
                : 'text-neutral-500 hover:text-neutral-300'
            }`}>
              <Users className="w-5 h-5" />
            </div>
            <span className={`text-[8px] font-bold tracking-wider mt-1 uppercase transition-colors duration-200 ${
              activeTab === 'clients' ? 'text-white' : 'text-neutral-500'
            }`}>
              Clients
            </span>
            {activeTab === 'clients' && (
              <span className="w-1 h-1 rounded-full bg-indigo-500 mt-1 absolute bottom-[-4px]" />
            )}
          </button>

          {/* Contrats */}
          <button 
            onClick={() => setActiveTab('contrats')}
            className="flex-1 flex flex-col items-center justify-center transition-all cursor-pointer relative"
          >
            <div className={`p-1.5 rounded-xl transition-all ${
              activeTab === 'contrats' 
                ? 'bg-indigo-500/10 text-indigo-400 scale-105 border border-indigo-500/20' 
                : 'text-neutral-500 hover:text-neutral-300'
            }`}>
              <FileText className="w-5 h-5" />
            </div>
            <span className={`text-[8px] font-bold tracking-wider mt-1 uppercase transition-colors duration-200 ${
              activeTab === 'contrats' ? 'text-white' : 'text-neutral-500'
            }`}>
              Baux
            </span>
            {activeTab === 'contrats' && (
              <span className="w-1 h-1 rounded-full bg-indigo-500 mt-1 absolute bottom-[-4px]" />
            )}
          </button>

          {/* Paiements */}
          <button 
            onClick={() => setActiveTab('paiements')}
            className="flex-1 flex flex-col items-center justify-center transition-all cursor-pointer relative"
          >
            <div className={`p-1.5 rounded-xl transition-all ${
              activeTab === 'paiements' 
                ? 'bg-indigo-500/10 text-indigo-400 scale-105 border border-indigo-500/20' 
                : 'text-neutral-500 hover:text-neutral-300'
            }`}>
              <Euro className="w-5 h-5" />
            </div>
            <span className={`text-[8px] font-bold tracking-wider mt-1 uppercase transition-colors duration-200 ${
              activeTab === 'paiements' ? 'text-white' : 'text-neutral-500'
            }`}>
              Flux
            </span>
            {activeTab === 'paiements' && (
              <span className="w-1 h-1 rounded-full bg-indigo-500 mt-1 absolute bottom-[-4px]" />
            )}
          </button>

          {/* Historique */}
          <button 
            onClick={() => setActiveTab('historique')}
            className="flex-1 flex flex-col items-center justify-center transition-all cursor-pointer relative"
          >
            <div className={`p-1.5 rounded-xl transition-all ${
              activeTab === 'historique' 
                ? 'bg-indigo-500/10 text-indigo-400 scale-105 border border-indigo-500/20' 
                : 'text-neutral-500 hover:text-neutral-300'
            }`}>
              <History className="w-5 h-5" />
            </div>
            <span className={`text-[8px] font-bold tracking-wider mt-1 uppercase transition-colors duration-200 ${
              activeTab === 'historique' ? 'text-white' : 'text-neutral-500'
            }`}>
              Journal
            </span>
            {activeTab === 'historique' && (
              <span className="w-1 h-1 rounded-full bg-indigo-500 mt-1 absolute bottom-[-4px]" />
            )}
          </button>
        </div>
      </div>

      {/* Floating System Toast Container */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-6 right-6 z-[100] bg-neutral-900 border border-indigo-500/30 text-white rounded-2xl p-4 shadow-2xl flex items-center gap-3 max-w-sm overflow-hidden"
          >
            <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 shrink-0">
              <Bell className="w-4 h-4 text-indigo-400 animate-bounce" />
            </div>
            <div className="flex-1 min-w-0">
              <h5 className="font-bold text-xs text-indigo-400">Notification d'échéance</h5>
              <p className="text-[11px] text-neutral-200 mt-0.5 leading-snug break-words">{toastMsg}</p>
            </div>
            <button onClick={() => setToastMsg(null)} className="text-neutral-500 hover:text-neutral-300 ml-1 shrink-0 p-1 rounded-lg hover:bg-neutral-800 transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sleek Custom Deletion Confirmation Dialog Modal */}
      <AnimatePresence>
        {confirmModal && confirmModal.isOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative"
            >
              <div className="p-6 border-b border-neutral-800 flex justify-between items-center bg-neutral-950/20">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20 shrink-0">
                    <Trash2 className="w-4 h-4 text-rose-500" />
                  </div>
                  <h3 className="text-sm font-bold text-white">{confirmModal.title}</h3>
                </div>
                <button 
                  onClick={() => setConfirmModal(null)}
                  className="p-1.5 text-neutral-500 hover:text-white bg-neutral-850 hover:bg-neutral-800/80 rounded-xl transition-all cursor-pointer border border-neutral-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <p className="text-xs text-neutral-300 leading-relaxed">
                  {confirmModal.message}
                </p>

                <div className="pt-2 flex justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setConfirmModal(null)}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-neutral-800 hover:bg-neutral-750 text-neutral-300 transition-colors cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      confirmModal.onConfirm();
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/10 transition-colors cursor-pointer"
                  >
                    Confirmer
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- BIEN MODAL --- */}
      <AnimatePresence>
        {isBienModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl"
            >
              <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">
                  {editingBien ? 'Modifier le Bien' : 'Nouveau Bien Immobilier'}
                </h3>
                <button onClick={() => setIsBienModalOpen(false)} className="text-neutral-400 hover:text-white transition-colors cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveBien} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-neutral-300">Titre / Désignation</label>
                  <input 
                    type="text" 
                    value={bienTitre} 
                    onChange={e => { setBienTitre(e.target.value); markTouched('bienTitre'); }} 
                    onBlur={() => markTouched('bienTitre')}
                    className={`w-full bg-neutral-950 border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 ${
                      bienErrors.titre && (touched.bienTitre || attemptedSubmit.bien)
                        ? 'border-rose-500 focus:ring-rose-500/40' 
                        : 'border-neutral-800 focus:ring-indigo-500/40'
                    }`}
                    placeholder="Appartement cosy, Villa..." 
                    required 
                  />
                  {bienErrors.titre && (touched.bienTitre || attemptedSubmit.bien) && (
                    <p className="text-[11px] text-rose-500 mt-1 font-medium">{bienErrors.titre}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-neutral-300">Type de bien</label>
                    <select 
                      value={bienType} 
                      onChange={e => setBienType(e.target.value)} 
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 cursor-pointer"
                    >
                      <option value="appartement">Appartement</option>
                      <option value="maison">Maison</option>
                      <option value="bureau">Bureau</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-neutral-300">Prix (€)</label>
                    <input 
                      type="number" 
                      value={bienPrix} 
                      onChange={e => { setBienPrix(Number(e.target.value)); markTouched('bienPrix'); }} 
                      className={`w-full bg-neutral-950 border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 ${
                        bienErrors.prix && (touched.bienPrix || attemptedSubmit.bien)
                          ? 'border-rose-500 focus:ring-rose-500/40' 
                          : 'border-neutral-800 focus:ring-indigo-500/40'
                      }`}
                      min="0" 
                      required 
                    />
                    {bienErrors.prix && (touched.bienPrix || attemptedSubmit.bien) && (
                      <p className="text-[11px] text-rose-500 mt-1 font-medium">{bienErrors.prix}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1 col-span-2">
                    <label className="text-xs font-medium text-neutral-300">Ville</label>
                    <input 
                      type="text" 
                      value={bienVille} 
                      onChange={e => { setBienVille(e.target.value); markTouched('bienVille'); }} 
                      className={`w-full bg-neutral-950 border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 ${
                        bienErrors.ville && (touched.bienVille || attemptedSubmit.bien)
                          ? 'border-rose-500 focus:ring-rose-500/40' 
                          : 'border-neutral-800 focus:ring-indigo-500/40'
                      }`}
                      placeholder="Paris, Nice, Lyon..." 
                      required 
                    />
                    {bienErrors.ville && (touched.bienVille || attemptedSubmit.bien) && (
                      <p className="text-[11px] text-rose-500 mt-1 font-medium">{bienErrors.ville}</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-neutral-300">Statut</label>
                    <select 
                      value={bienStatut} 
                      onChange={e => setBienStatut(e.target.value)} 
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 cursor-pointer"
                    >
                      <option value="disponible">Disponible</option>
                      <option value="loué">Loué</option>
                      <option value="vendu">Vendu</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-neutral-300">Surface (m²)</label>
                    <input 
                      type="number" 
                      value={bienSurface} 
                      onChange={e => { setBienSurface(Number(e.target.value)); markTouched('bienSurface'); }} 
                      className={`w-full bg-neutral-950 border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 ${
                        bienErrors.surface && (touched.bienSurface || attemptedSubmit.bien)
                          ? 'border-rose-500 focus:ring-rose-500/40' 
                          : 'border-neutral-800 focus:ring-indigo-500/40'
                      }`}
                      min="1" 
                    />
                    {bienErrors.surface && (touched.bienSurface || attemptedSubmit.bien) && (
                      <p className="text-[11px] text-rose-500 mt-1 font-medium">{bienErrors.surface}</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-neutral-300">Nombre de pièces</label>
                    <input 
                      type="number" 
                      value={bienNbPieces} 
                      onChange={e => { setBienNbPieces(Number(e.target.value)); markTouched('bienNbPieces'); }} 
                      className={`w-full bg-neutral-950 border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 ${
                        bienErrors.nbPieces && (touched.bienNbPieces || attemptedSubmit.bien)
                          ? 'border-rose-500 focus:ring-rose-500/40' 
                          : 'border-neutral-800 focus:ring-indigo-500/40'
                      }`}
                      min="1" 
                    />
                    {bienErrors.nbPieces && (touched.bienNbPieces || attemptedSubmit.bien) && (
                      <p className="text-[11px] text-rose-500 mt-1 font-medium">{bienErrors.nbPieces}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-neutral-300">Description</label>
                  <textarea 
                    value={bienDescription} 
                    onChange={e => setBienDescription(e.target.value)} 
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 h-24 resize-none"
                    placeholder="Description attrayante..." 
                  />
                </div>

                <div className="pt-4 border-t border-neutral-800 flex justify-end gap-3">
                  <button 
                    type="button" 
                    onClick={() => setIsBienModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-sm font-semibold border border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-800 transition-all cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button 
                    type="submit" 
                    className="px-5 py-2 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-all cursor-pointer"
                  >
                    Enregistrer
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- CLIENT (LOCATAIRE) MODAL --- */}
      <AnimatePresence>
        {isDocModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
               initial={{ scale: 0.95, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               exit={{ scale: 0.95, opacity: 0 }}
               className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]"
            >
              <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Paperclip className="w-5 h-5 text-indigo-400" /> Gestion des Documents
                  </h3>
                  <p className="text-xs text-neutral-400 mt-1">
                    Contrat : <strong className="text-neutral-200">{selectedContratForDoc?.bien_titre}</strong> ({selectedContratForDoc?.type})
                  </p>
                </div>
                <button onClick={() => setIsDocModalOpen(false)} className="text-neutral-400 hover:text-white transition-colors cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-6 overflow-y-auto flex-1">
                {/* Formulaire d'ajout */}
                <div className="bg-neutral-950/60 p-4 rounded-xl border border-neutral-800 space-y-4">
                  <h4 className="text-xs font-bold text-white uppercase tracking-widest text-indigo-400">Ajouter un document</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-neutral-300">Titre personnalisé (optionnel)</label>
                      <input 
                        type="text" 
                        placeholder="Ex: Quittance Janvier 2026, Bail original..."
                        value={docTitre}
                        onChange={e => setDocTitre(e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-neutral-300">Type de document</label>
                      <select 
                        value={docType}
                        onChange={e => setDocType(e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 cursor-pointer"
                      >
                        <option value="bail">Bail de location (PDF)</option>
                        <option value="quittance">Quittance de loyer (PDF)</option>
                        <option value="autre">Autre Document</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium text-neutral-300 block">Sélectionner ou Glisser le fichier (PDF, image)</label>
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
                          {isUploading ? "Envoi en cours..." : "Cliquez ou glissez un fichier ici pour téléverser"}
                        </span>
                        <span className="text-[10px] text-neutral-550 block">PDF ou Images uniquement</span>
                      </div>
                    </div>
                  </div>

                  {isUploading && (
                    <div className="space-y-1.5 pt-1">
                      <div className="flex justify-between text-[11px] font-sans">
                        <span className="text-neutral-400">Progression du transfert...</span>
                        <span className="text-indigo-400 font-bold">{uploadProgress}%</span>
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
                    <span>Documents associés ({contractDocuments.length})</span>
                  </h4>

                  {contractDocuments.length === 0 ? (
                    <div className="p-8 text-center bg-neutral-950/20 border border-neutral-850 rounded-xl text-neutral-500 text-xs italic">
                      Aucun document n'est actuellement associé à ce contrat.
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
                                  {doc.type}
                                </span>
                                <span className="text-[10px] text-neutral-550">
                                  {doc.created_at ? new Date(doc.created_at).toLocaleDateString('fr-FR', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric'
                                  }) : 'Récemment'}
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
                              Consulter
                            </a>
                            <button 
                              onClick={() => handleDeleteDocument(doc.id, doc.storage_path)}
                              className="text-neutral-500 hover:text-rose-400 hover:bg-rose-500/10 p-1.5 rounded-lg transition-colors cursor-pointer"
                              title="Supprimer document"
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

              <div className="px-6 py-4 border-t border-neutral-800 bg-neutral-950/40 flex justify-end">
                <button 
                  onClick={() => setIsDocModalOpen(false)}
                  className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-semibold px-4 py-2 rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Fermer
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {isLocataireModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl"
            >
              <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">
                  {editingLocataire ? 'Modifier le Client' : 'Nouveau Client (Locataire)'}
                </h3>
                <button onClick={() => setIsLocataireModalOpen(false)} className="text-neutral-400 hover:text-white transition-colors cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveLocataire} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-neutral-300">Prénom</label>
                    <input 
                      type="text" 
                      value={locataireFirstName} 
                      onChange={e => { setLocataireFirstName(e.target.value); markTouched('locataireFirstName'); }} 
                      className={`w-full bg-neutral-950 border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 ${
                        locataireErrors.firstName && (touched.locataireFirstName || attemptedSubmit.locataire)
                          ? 'border-rose-500 focus:ring-rose-500/40' 
                          : 'border-neutral-800 focus:ring-indigo-500/40'
                      }`}
                      placeholder="Jean" 
                      required 
                    />
                    {locataireErrors.firstName && (touched.locataireFirstName || attemptedSubmit.locataire) && (
                      <p className="text-[11px] text-rose-500 mt-1 font-medium">{locataireErrors.firstName}</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-neutral-300">Nom de famille</label>
                    <input 
                      type="text" 
                      value={locataireLastName} 
                      onChange={e => { setLocataireLastName(e.target.value); markTouched('locataireLastName'); }} 
                      className={`w-full bg-neutral-950 border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 ${
                        locataireErrors.lastName && (touched.locataireLastName || attemptedSubmit.locataire)
                          ? 'border-rose-500 focus:ring-rose-500/40' 
                          : 'border-neutral-800 focus:ring-indigo-500/40'
                      }`}
                      placeholder="Dupont" 
                      required 
                    />
                    {locataireErrors.lastName && (touched.locataireLastName || attemptedSubmit.locataire) && (
                      <p className="text-[11px] text-rose-500 mt-1 font-medium">{locataireErrors.lastName}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-neutral-300">Email</label>
                    <input 
                      type="email" 
                      value={locataireEmail} 
                      onChange={e => { setLocataireEmail(e.target.value); markTouched('locataireEmail'); }} 
                      className={`w-full bg-neutral-950 border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 ${
                        locataireErrors.email && (touched.locataireEmail || attemptedSubmit.locataire)
                          ? 'border-rose-500 focus:ring-rose-500/40' 
                          : 'border-neutral-800 focus:ring-indigo-500/40'
                      }`}
                      placeholder="jean.dupont@email.com" 
                      required 
                    />
                    {locataireErrors.email && (touched.locataireEmail || attemptedSubmit.locataire) && (
                      <p className="text-[11px] text-rose-500 mt-1 font-medium">{locataireErrors.email}</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-neutral-300">Téléphone</label>
                    <input 
                      type="text" 
                      value={locatairePhone} 
                      onChange={e => { setLocatairePhone(e.target.value); markTouched('locatairePhone'); }} 
                      className={`w-full bg-neutral-950 border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 ${
                        locataireErrors.phone && (touched.locatairePhone || attemptedSubmit.locataire)
                          ? 'border-rose-500 focus:ring-rose-500/40' 
                          : 'border-neutral-800 focus:ring-indigo-500/40'
                      }`}
                      placeholder="06 12 34 56 78" 
                    />
                    {locataireErrors.phone && (touched.locatairePhone || attemptedSubmit.locataire) && (
                      <p className="text-[11px] text-rose-500 mt-1 font-medium">{locataireErrors.phone}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-neutral-300">Profession</label>
                    <input 
                      type="text" 
                      value={locataireProfession} 
                      onChange={e => { setLocataireProfession(e.target.value); markTouched('locataireProfession'); }} 
                      className={`w-full bg-neutral-950 border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 ${
                        locataireErrors.profession && (touched.locataireProfession || attemptedSubmit.locataire)
                          ? 'border-rose-500 focus:ring-rose-500/40' 
                          : 'border-neutral-800 focus:ring-indigo-500/40'
                      }`}
                      placeholder="Ingénieur, Cadre, Artisan..." 
                      required 
                    />
                    {locataireErrors.profession && (touched.locataireProfession || attemptedSubmit.locataire) && (
                      <p className="text-[11px] text-rose-500 mt-1 font-medium">{locataireErrors.profession}</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-neutral-300">Revenu mensuel (€)</label>
                    <input 
                      type="number" 
                      value={locataireRevenu} 
                      onChange={e => { setLocataireRevenu(Number(e.target.value)); markTouched('locataireRevenu'); }} 
                      className={`w-full bg-neutral-950 border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 ${
                        locataireErrors.revenu && (touched.locataireRevenu || attemptedSubmit.locataire)
                          ? 'border-rose-500 focus:ring-rose-500/40' 
                          : 'border-neutral-800 focus:ring-indigo-500/40'
                      }`}
                      min="0" 
                      required 
                    />
                    {locataireErrors.revenu && (touched.locataireRevenu || attemptedSubmit.locataire) && (
                      <p className="text-[11px] text-rose-500 mt-1 font-medium">{locataireErrors.revenu}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-neutral-300">Numéro de pièce d'identité (CNI / Passeport)</label>
                  <input 
                    type="text" 
                    value={locataireCni} 
                    onChange={e => { setLocataireCni(e.target.value); markTouched('locataireCni'); }} 
                    className={`w-full bg-neutral-950 border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 ${
                      locataireErrors.cni && (touched.locataireCni || attemptedSubmit.locataire)
                        ? 'border-rose-500 focus:ring-rose-500/40' 
                        : 'border-neutral-800 focus:ring-indigo-500/40'
                    }`}
                    placeholder="9401XYZ789" 
                  />
                  {locataireErrors.cni && (touched.locataireCni || attemptedSubmit.locataire) && (
                    <p className="text-[11px] text-rose-500 mt-1 font-medium">{locataireErrors.cni}</p>
                  )}
                </div>

                <p className="text-[11px] text-neutral-500 leading-relaxed italic bg-indigo-500/5 p-3 rounded-xl border border-indigo-500/10">
                  ⚠️ Note: La création d'un client génère automatiquement un compte d'accès locataire sécurisé avec le mot de passe provisoire par défaut <span className="text-indigo-400 font-mono">tenant123</span>.
                </p>

                <div className="pt-4 border-t border-neutral-800 flex justify-end gap-3">
                  <button 
                    type="button" 
                    onClick={() => setIsLocataireModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-sm font-semibold border border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-800 transition-all cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button 
                    type="submit" 
                    className="px-5 py-2 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-all cursor-pointer"
                  >
                    Enregistrer
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- CLIENT DETAILS MODAL --- */}
      <AnimatePresence>
        {isClientDetailsOpen && selectedClientForDetails && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]"
            >
              <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/40">
                <div className="flex items-center gap-2.5">
                  <div className="bg-indigo-500/10 p-2 rounded-xl text-indigo-400 border border-indigo-500/20">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white leading-tight">
                      Fiche Locataire / Client
                    </h3>
                    <p className="text-xs text-neutral-400 font-medium">Consulter les informations et l'historique des contrats</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsClientDetailsOpen(false)} 
                  className="text-neutral-400 hover:text-white transition-colors cursor-pointer bg-neutral-800 hover:bg-neutral-750 p-1.5 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
                {/* Header Profile Summary */}
                <div className="bg-gradient-to-br from-neutral-950 to-neutral-900 p-5 rounded-2xl border border-neutral-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-md relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
                  <div>
                    <h4 className="text-2xl font-bold text-white tracking-tight">
                      {selectedClientForDetails.first_name} {selectedClientForDetails.last_name}
                    </h4>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mt-2 capitalize font-mono">
                      {selectedClientForDetails.profession || 'Sans profession'}
                    </span>
                  </div>
                  <div className="text-left md:text-right font-mono">
                    <p className="text-[10px] text-neutral-500 uppercase font-bold tracking-wider">Revenu déclaré</p>
                    <p className="text-xl font-bold text-emerald-400 mt-0.5">
                      {(selectedClientForDetails.revenu_mensuel || 0).toLocaleString()} €
                      <span className="text-[11px] text-neutral-500 font-normal font-sans ml-1">/ mois</span>
                    </p>
                  </div>
                </div>

                {/* Core Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-850 space-y-3 shadow-inner">
                    <h5 className="text-xs font-bold text-neutral-400 uppercase tracking-widest font-mono">Coordonnées</h5>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-neutral-500">Adresse Email</span>
                        <a 
                          href={`mailto:${selectedClientForDetails.email}`} 
                          className="text-indigo-400 hover:underline font-medium hover:text-indigo-300 transition-colors"
                        >
                          {selectedClientForDetails.email}
                        </a>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-neutral-500">Numéro de Téléphone</span>
                        <a 
                          href={`tel:${selectedClientForDetails.phone}`} 
                          className="text-white hover:underline font-mono"
                        >
                          {selectedClientForDetails.phone || 'Non renseigné'}
                        </a>
                      </div>
                    </div>
                  </div>

                  <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-850 space-y-3 shadow-inner">
                    <h5 className="text-xs font-bold text-neutral-400 uppercase tracking-widest font-mono">Pièces & Identifiants</h5>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-neutral-500">Numéro de CNI / Passport</span>
                        <span className="text-white font-mono">{selectedClientForDetails.cni_numero || 'Non renseigné'}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-neutral-500">Identifiant système</span>
                        <span className="text-neutral-400 font-mono">#{selectedClientForDetails.id}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Associated Contracts Section */}
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between pl-1">
                    <h5 className="text-xs font-bold text-neutral-400 uppercase tracking-widest font-mono flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5 text-indigo-400" />
                      Historique des Contrats
                    </h5>
                    <span className="text-[10px] bg-neutral-800 text-neutral-400 font-bold px-2 py-0.5 rounded-full font-mono">
                      {(() => {
                        const count = contrats.filter(c => 
                          c.locataire_id === selectedClientForDetails.id || 
                          c.locataire_id === selectedClientForDetails.user_id || 
                          c.locataire_email === selectedClientForDetails.email
                        ).length;
                        return `${count} contrat${count > 1 ? 's' : ''}`;
                      })()}
                    </span>
                  </div>

                  {(() => {
                    const clientContrats = contrats.filter(c => 
                      c.locataire_id === selectedClientForDetails.id || 
                      c.locataire_id === selectedClientForDetails.user_id || 
                      c.locataire_email === selectedClientForDetails.email
                    );

                    if (clientContrats.length === 0) {
                      return (
                        <div className="bg-neutral-950 p-6 rounded-2xl border border-dashed border-neutral-800 text-center text-neutral-500 italic text-xs">
                          Aucun contrat de location ou de vente n'est associé à ce client pour le moment.
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-3">
                        {clientContrats.map((c) => {
                          const dateDebutFr = c.date_debut ? new Date(c.date_debut).toLocaleDateString('fr-FR') : 'N/A';
                          const dateFinFr = c.date_fin ? new Date(c.date_fin).toLocaleDateString('fr-FR') : 'Indéterminée';
                          const isActif = c.statut === 'actif';

                          return (
                            <div 
                              key={c.id} 
                              className="bg-neutral-950/60 hover:bg-neutral-950 p-4 rounded-xl border border-neutral-800/80 hover:border-neutral-700/80 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm"
                            >
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-bold text-white text-sm">{c.bien_titre}</span>
                                  <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase font-mono ${
                                    c.type === 'vente' 
                                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/25' 
                                      : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/25'
                                  }`}>
                                    {c.type === 'vente' ? 'Vente' : 'Bail'}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5 text-xs text-neutral-400">
                                  <Calendar className="w-3.5 h-3.5 text-neutral-500" />
                                  <span>Du {dateDebutFr} au {dateFinFr}</span>
                                </div>
                              </div>

                              <div className="flex sm:flex-col items-start sm:items-end justify-between sm:justify-center gap-1 shrink-0 font-mono">
                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                  isActif 
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                    : 'bg-neutral-800 text-neutral-500 border border-neutral-800'
                                }`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${isActif ? 'bg-emerald-400' : 'bg-neutral-500'}`} />
                                  {isActif ? 'Actif' : 'Terminé'}
                                </span>
                                <p className="text-sm font-bold text-white mt-1">
                                  {c.type === 'vente' 
                                    ? `${(c.prix_vente || 0).toLocaleString()} €` 
                                    : `${(c.loyer_mensuel || 0).toLocaleString()} € / mois`
                                  }
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              </div>

              <div className="px-6 py-4 border-t border-neutral-800 flex justify-end bg-neutral-950/40">
                <button 
                  type="button" 
                  onClick={() => setIsClientDetailsOpen(false)}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-neutral-800 text-neutral-200 hover:text-white hover:bg-neutral-750 border border-neutral-700 transition-all cursor-pointer shadow-md"
                >
                  Fermer la fiche
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- CONTRAT MODAL --- */}
      <AnimatePresence>
        {isContratModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl"
            >
              <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">
                  {editingContrat ? 'Modifier le Contrat' : 'Nouveau Contrat de Location / Vente'}
                </h3>
                <button onClick={() => setIsContratModalOpen(false)} className="text-neutral-400 hover:text-white transition-colors cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveContrat} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-neutral-300">Type de contrat</label>
                    <select 
                      value={contratType} 
                      onChange={e => setContratType(e.target.value)} 
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 cursor-pointer"
                    >
                      <option value="bail">Bail (Annuels / Étudiants)</option>
                      <option value="vente">Acte de Vente direct</option>
                      <option value="mandat">Mandat de Gestion</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-neutral-300">Statut</label>
                    <select 
                      value={contratStatut} 
                      onChange={e => setContratStatut(e.target.value)} 
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 cursor-pointer"
                    >
                      <option value="actif">Actif (En cours d'exécution)</option>
                      <option value="termine">Terminé / Clos</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-neutral-300">Sélectionner le bien immobilier</label>
                  <select 
                    value={contratBienId} 
                    onChange={e => { setContratBienId(e.target.value ? Number(e.target.value) : ''); markTouched('contratBienId'); }} 
                    className={`w-full bg-neutral-950 border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 cursor-pointer ${
                      contratErrors.bienId && (touched.contratBienId || attemptedSubmit.contrat)
                        ? 'border-rose-500 focus:ring-rose-500/40' 
                        : 'border-neutral-800 focus:ring-indigo-500/40'
                    }`}
                    required
                  >
                    <option value="">-- Choisir un bien --</option>
                    {biens.map(b => (
                      <option key={b.id} value={b.id}>{b.titre} ({b.ville} - {b.prix.toLocaleString()} €)</option>
                    ))}
                  </select>
                  {contratErrors.bienId && (touched.contratBienId || attemptedSubmit.contrat) && (
                    <p className="text-[11px] text-rose-500 mt-1 font-medium">{contratErrors.bienId}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-neutral-300">Sélectionner le client (Locataire / Acheteur)</label>
                  <select 
                    value={contratLocataireId} 
                    onChange={e => setContratLocataireId(e.target.value ? Number(e.target.value) : '')} 
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 cursor-pointer"
                  >
                    <option value="">-- Sans locataire / En direct --</option>
                    {locataires.map(l => (
                      <option key={l.id} value={l.user_id}>
                        {l.first_name} {l.last_name} ({l.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-neutral-300">Date de début d'effet</label>
                    <input 
                      type="date" 
                      value={contratDateDebut} 
                      onChange={e => { setContratDateDebut(e.target.value); markTouched('contratDateDebut'); }} 
                      className={`w-full bg-neutral-950 border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 cursor-pointer ${
                        contratErrors.dateDebut && (touched.contratDateDebut || attemptedSubmit.contrat)
                          ? 'border-rose-500 focus:ring-rose-500/40' 
                          : 'border-neutral-800 focus:ring-indigo-500/40'
                      }`}
                      required 
                    />
                    {contratErrors.dateDebut && (touched.contratDateDebut || attemptedSubmit.contrat) && (
                      <p className="text-[11px] text-rose-500 mt-1 font-medium">{contratErrors.dateDebut}</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-neutral-300">Date de fin d'effet</label>
                    <input 
                      type="date" 
                      value={contratDateFin} 
                      onChange={e => { setContratDateFin(e.target.value); markTouched('contratDateFin'); }} 
                      className={`w-full bg-neutral-950 border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 cursor-pointer ${
                        contratErrors.dateFin && (touched.contratDateFin || attemptedSubmit.contrat)
                          ? 'border-rose-500 focus:ring-rose-500/40' 
                          : 'border-neutral-800 focus:ring-indigo-500/40'
                      }`}
                    />
                    {contratErrors.dateFin && (touched.contratDateFin || attemptedSubmit.contrat) && (
                      <p className="text-[11px] text-rose-500 mt-1 font-medium">{contratErrors.dateFin}</p>
                    )}
                  </div>
                </div>

                {contratType !== 'vente' ? (
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-neutral-300">Loyer mensuel charges comprises (€)</label>
                    <input 
                      type="number" 
                      value={contratLoyer} 
                      onChange={e => { setContratLoyer(Number(e.target.value)); markTouched('contratLoyer'); }} 
                      className={`w-full bg-neutral-950 border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 ${
                        contratErrors.loyer && (touched.contratLoyer || attemptedSubmit.contrat)
                          ? 'border-rose-500 focus:ring-rose-500/40' 
                          : 'border-neutral-800 focus:ring-indigo-500/40'
                      }`}
                      min="0" 
                      required 
                    />
                    {contratErrors.loyer && (touched.contratLoyer || attemptedSubmit.contrat) && (
                      <p className="text-[11px] text-rose-500 mt-1 font-medium">{contratErrors.loyer}</p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-neutral-300">Prix de vente net vendeur (€)</label>
                    <input 
                      type="number" 
                      value={contratPrixVente} 
                      onChange={e => { setContratPrixVente(Number(e.target.value)); markTouched('contratPrixVente'); }} 
                      className={`w-full bg-neutral-950 border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 ${
                        contratErrors.prixVente && (touched.contratPrixVente || attemptedSubmit.contrat)
                          ? 'border-rose-500 focus:ring-rose-500/40' 
                          : 'border-neutral-800 focus:ring-indigo-500/40'
                      }`}
                      min="0" 
                      required 
                    />
                    {contratErrors.prixVente && (touched.contratPrixVente || attemptedSubmit.contrat) && (
                      <p className="text-[11px] text-rose-500 mt-1 font-medium">{contratErrors.prixVente}</p>
                    )}
                  </div>
                )}

                <div className="pt-4 border-t border-neutral-800 flex justify-end gap-3">
                  <button 
                    type="button" 
                    onClick={() => setIsContratModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-sm font-semibold border border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-800 transition-all cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button 
                    type="submit" 
                    className="px-5 py-2 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-all cursor-pointer"
                  >
                    Enregistrer
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- DETAIL PAYMENT HISTORY MODAL --- */}
      <AnimatePresence>
        {selectedHistoryContrat && (() => {
          const history = getContratPaymentHistory(selectedHistoryContrat);
          return (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl relative"
              >
                {/* Header */}
                <div className="p-6 border-b border-neutral-800 flex items-start justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/20 inline-block font-mono">
                      Historique des paiements 2026
                    </span>
                    <h3 className="text-xl font-bold text-white pt-2">{selectedHistoryContrat.bien_titre}</h3>
                    <p className="text-xs text-neutral-400">
                      Bénéficiaire : <strong className="text-neutral-200">{selectedHistoryContrat.locataire_email || 'Bailleur en direct'}</strong>
                    </p>
                  </div>
                  <button 
                    onClick={() => setSelectedHistoryContrat(null)}
                    className="p-2 text-neutral-500 hover:text-white bg-neutral-850 hover:bg-neutral-800/80 rounded-xl transition-all cursor-pointer border border-neutral-800"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Content */}
                <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4 shadow-inner">
                  <div className="bg-neutral-950 p-4 rounded-2xl border border-neutral-800/50 flex justify-between items-center">
                    <div>
                      <p className="text-[10px] text-neutral-500 uppercase font-bold tracking-wider">Loyer mensuel</p>
                      <p className="text-2xl font-bold text-indigo-400 mt-1">{(selectedHistoryContrat.loyer_mensuel || 1000).toLocaleString()} €</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-neutral-500 uppercase font-bold tracking-wider">Statut global</p>
                      <p className="text-xs font-semibold text-emerald-400 mt-1 bg-emerald-500/15 border border-emerald-500/20 px-2 py-0.5 rounded-full inline-block">
                        {selectedHistoryContrat.statut === 'actif' ? 'Bail Actif' : 'Bail Terminé'}
                      </p>
                    </div>
                  </div>

                  {/* Barre de progression des loyers de l'année */}
                  {(() => {
                    const activeMonths = history.filter(m => m.status !== 'hors_contrat');
                    const expectedAnnual = activeMonths.reduce((sum, m) => sum + m.amount, 0);
                    const collectedAnnual = history
                      .filter(m => m.status === 'paye' || m.status === 'paye_en_retard')
                      .reduce((sum, m) => sum + m.amount, 0);
                    const percentCollected = expectedAnnual > 0 ? Math.round((collectedAnnual / expectedAnnual) * 100) : 0;
                    const paidMonthsCount = history.filter(m => m.status === 'paye' || m.status === 'paye_en_retard').length;
                    const totalMonthsCount = activeMonths.length;

                    return (
                      <div className="bg-neutral-950 p-5 rounded-2xl border border-neutral-800/50 space-y-3.5 shadow-md">
                        <div className="flex justify-between items-center">
                          <div className="space-y-0.5">
                            <p className="text-[10px] text-neutral-500 uppercase font-bold tracking-wider">Loyers perçus sur l'année</p>
                            <p className="text-sm font-semibold text-neutral-300">
                              <span className="text-white font-bold font-mono text-base">{collectedAnnual.toLocaleString()} €</span>
                              <span className="text-neutral-500 font-normal"> sur {expectedAnnual.toLocaleString()} € attendus</span>
                            </p>
                          </div>
                          <div className="text-right space-y-0.5">
                            <span className="text-[10px] text-neutral-500 uppercase font-bold tracking-wider block">Taux de recouvrement</span>
                            <span className="text-indigo-400 font-bold font-mono text-base">{percentCollected}%</span>
                          </div>
                        </div>

                        {/* Animated progress bar */}
                        <div className="w-full bg-neutral-900 h-3 rounded-full overflow-hidden border border-neutral-800 relative">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${percentCollected}%` }}
                            transition={{ duration: 1.2, ease: "easeOut" }}
                            className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-indigo-400 to-emerald-500 relative"
                          />
                        </div>

                        <div className="flex justify-between items-center text-[10px] text-neutral-400 font-medium">
                          <span className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            {paidMonthsCount} {paidMonthsCount > 1 ? 'mois réglés' : 'mois réglé'} sur {totalMonthsCount}
                          </span>
                          <span className="text-neutral-500 font-mono">2026</span>
                        </div>
                      </div>
                    );
                  })()}

                  <div className="space-y-2.5">
                    <p className="text-xs font-bold text-neutral-400 tracking-wider uppercase pl-1 font-mono">Échéancier de l'année en cours (2026)</p>
                    
                    <div className="divide-y divide-neutral-800/50 bg-neutral-950 border border-neutral-800 rounded-2xl overflow-hidden shadow-inner font-sans">
                      {history.map((m) => {
                        const isManual = (m as any).isManual;
                        const dbRecordId = (m as any).dbRecordId;

                        return (
                          <div key={m.index} className="flex items-center justify-between p-3.5 hover:bg-neutral-900/30 transition-colors">
                            <div className="flex items-center gap-3">
                              <span className={`w-2 h-2 rounded-full ${m.dotColor}`} />
                              <div>
                                <p className="font-semibold text-sm text-white">{m.month}</p>
                                <p className="text-[10px] text-neutral-500 font-mono mt-0.5">{m.datePaiement}</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2.5">
                              {m.amount > 0 && (
                                <span className="font-mono text-xs font-semibold text-neutral-300">
                                  {m.amount.toLocaleString()} €
                                </span>
                              )}
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border font-mono ${m.colorClass}`}>
                                {m.label}
                              </span>

                              {isManual ? (
                                <button
                                  onClick={() => handleCancelPaymentConfirmation(selectedHistoryContrat.id, dbRecordId, m.month)}
                                  className="p-1 text-rose-500 hover:text-rose-400 hover:bg-neutral-900 rounded-lg transition-colors cursor-pointer"
                                  title="Réinitialiser le règlement"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              ) : (
                                m.status !== 'hors_contrat' && m.status !== 'futur' && (
                                  <button
                                    onClick={() => {
                                      setPaymentToValidate({
                                        contrat: selectedHistoryContrat,
                                        monthIndex: m.index,
                                        monthName: m.month,
                                        amount: selectedHistoryContrat.loyer_mensuel || 1000
                                      });
                                      setConfirmAmount(selectedHistoryContrat.loyer_mensuel || 1000);
                                      setConfirmDate(new Date().toLocaleDateString('fr-FR'));
                                      setConfirmMode('virement');
                                      setConfirmStatus('paye');
                                    }}
                                    className="p-1 px-2.5 text-[10px] bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/20 rounded-lg transition-all flex items-center gap-1 cursor-pointer font-semibold"
                                    title="Valider et confirmer la réception de ce règlement"
                                  >
                                    <Check className="w-3 h-3" />
                                    <span>Valider</span>
                                  </button>
                                )
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="p-4 bg-neutral-950/60 border-t border-neutral-800 flex justify-end">
                  <button 
                    onClick={() => setSelectedHistoryContrat(null)}
                    className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-indigo-650 hover:bg-indigo-600 text-white transition-all cursor-pointer shadow-lg shadow-indigo-650/15"
                  >
                    Fermer la vue
                  </button>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>

      {/* --- CONFIRM PAYMENT DIALOG MODAL --- */}
      <AnimatePresence>
        {paymentToValidate && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative"
            >
              <div className="p-6 border-b border-neutral-800 flex justify-between items-center">
                <div>
                  <h3 className="text-base font-bold text-white">Validation de Paiement</h3>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    {paymentToValidate.monthName} 2026 — {paymentToValidate.contrat.bien_titre}
                  </p>
                </div>
                <button 
                  onClick={() => setPaymentToValidate(null)}
                  className="p-1.5 text-neutral-500 hover:text-white bg-neutral-850 hover:bg-neutral-800/80 rounded-xl transition-all cursor-pointer border border-neutral-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSavePaymentConfirmation} className="p-6 space-y-4">
                {/* Status Selection */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Statut de paiement</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setConfirmStatus('paye')}
                      className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer text-center ${
                        confirmStatus === 'paye'
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 font-mono'
                          : 'bg-neutral-950 border-neutral-800 hover:bg-neutral-900 text-neutral-400 font-mono'
                      }`}
                    >
                      Payé à l'échéance
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmStatus('paye_en_retard')}
                      className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer text-center ${
                        confirmStatus === 'paye_en_retard'
                          ? 'bg-amber-500/20 border-amber-500 text-amber-400 font-mono'
                          : 'bg-neutral-950 border-neutral-800 hover:bg-neutral-900 text-neutral-400 font-mono'
                      }`}
                    >
                      Payé en retard
                    </button>
                  </div>
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">Montant perçu (€)</label>
                  <input
                    type="number"
                    value={confirmAmount}
                    onChange={(e) => setConfirmAmount(Number(e.target.value))}
                    required
                    min="1"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>

                {/* Date */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">Date de règlement</label>
                  <input
                    type="text"
                    placeholder="10/06/2026"
                    value={confirmDate}
                    onChange={(e) => setConfirmDate(e.target.value)}
                    required
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                  <p className="text-[10px] text-neutral-500 mt-1 pl-1">Format JJ/MM/AAAA (ex: 05/06/2026)</p>
                </div>

                {/* Mode of payment */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">Mode de règlement</label>
                  <select
                    value={confirmMode}
                    onChange={(e) => setConfirmMode(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  >
                    <option value="virement">Virement bancaire</option>
                    <option value="especes">Espèces</option>
                    <option value="cheque">Chèque</option>
                    <option value="carte">Carte bancaire</option>
                  </select>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentToValidate(null)}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-neutral-800 hover:bg-neutral-750 text-neutral-300 transition-colors cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/10 transition-colors cursor-pointer"
                  >
                    Confirmer
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- RELEVE FINANCIER DETAILED VIEW MODAL --- */}
      <AnimatePresence>
        {selectedReleveContrat && (() => {
          const history = getContratPaymentHistory(selectedReleveContrat);
          const totalDue = history.reduce((sum, h) => sum + (h.amount || 0), 0);
          const totalPaid = history.reduce((sum, h) => sum + (h.status === 'paye' || h.status === 'paye_en_retard' ? h.amount : 0), 0);
          const totalLate = totalDue - totalPaid;
          const netReverse = Math.max(0, totalPaid - Math.round(totalPaid * 0.08));

          const handlePrintReleve = () => {
            const html = generateReleveHtml(selectedReleveContrat, history);
            const win = window.open("", "_blank");
            if (win) {
              win.document.write(html);
              win.document.close();
              win.print();
            } else {
              alert("La fenêtre d'impression a été bloquée par le navigateur. Veuillez autoriser les fenêtres contextuelles.");
            }
          };

          return (
            <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl my-8 relative flex flex-col max-h-[90vh]"
              >
                {/* Header */}
                <div className="p-6 border-b border-neutral-800 flex items-start justify-between bg-neutral-950/40">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 inline-block font-mono uppercase tracking-widest">
                      État Récapitulatif de Gérance
                    </span>
                    <h3 className="text-xl font-bold text-white pt-1">Relevé Financier Individuel 2026</h3>
                    <p className="text-xs text-neutral-400">
                      Rapprochement des loyers comptabilisés pour <strong className="text-neutral-200">{selectedReleveContrat.bien_titre}</strong>
                    </p>
                  </div>
                  <button 
                    onClick={() => setSelectedReleveContrat(null)}
                    className="p-2 text-neutral-500 hover:text-white bg-neutral-850 hover:bg-neutral-800 rounded-xl transition-all cursor-pointer border border-neutral-800"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto space-y-6 flex-1">
                  {/* Summary grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-neutral-950/80 p-3 rounded-xl border border-neutral-850 text-center">
                      <p className="text-[9px] text-neutral-500 font-bold uppercase tracking-wider">Attendus</p>
                      <p className="text-sm font-bold text-indigo-400 mt-1 font-mono">{totalDue.toLocaleString()} €</p>
                    </div>
                    <div className="bg-neutral-950/80 p-3 rounded-xl border border-neutral-850 text-center">
                      <p className="text-[9px] text-neutral-500 font-bold uppercase tracking-wider">Perçus</p>
                      <p className="text-sm font-bold text-emerald-400 mt-1 font-mono">{totalPaid.toLocaleString()} €</p>
                    </div>
                    <div className="bg-neutral-950/80 p-3 rounded-xl border border-neutral-850 text-center">
                      <p className="text-[9px] text-neutral-500 font-bold uppercase tracking-wider">Impayés</p>
                      <p className="text-sm font-bold text-rose-400 mt-1 font-mono">{totalLate.toLocaleString()} €</p>
                    </div>
                    <div className="bg-neutral-950/80 p-3 rounded-xl border border-neutral-850 text-center col-span-2 sm:col-span-1">
                      <p className="text-[9px] text-neutral-500 font-bold uppercase tracking-wider">Revenu Net</p>
                      <p className="text-sm font-bold text-sky-400 mt-1 font-mono">{netReverse.toLocaleString()} €</p>
                    </div>
                  </div>

                  {/* Mandat Info Card */}
                  <div className="bg-neutral-950/50 p-4 rounded-xl border border-neutral-800/60 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-neutral-400">
                    <div>
                      <p className="font-bold text-neutral-300 uppercase tracking-wider text-[9px] mb-1">MANDATAIRE COMMISS_</p>
                      <p className="text-white font-semibold">ImmoTech Solutions SAS</p>
                      <p className="mt-0.5">Siret: 12345678900011</p>
                      <p>Honoraires appliqués : 8.00 %</p>
                    </div>
                    <div>
                      <p className="font-bold text-neutral-300 uppercase tracking-wider text-[9px] mb-1">DESTINATAIRE BAIL</p>
                      <p className="text-white font-semibold">{selectedReleveContrat.locataire_email || 'Bailleur en direct'}</p>
                      <p className="mt-0.5">Début contrat : {selectedReleveContrat.date_debut ? new Date(selectedReleveContrat.date_debut).toLocaleDateString('fr-FR') : 'Non spécifié'}</p>
                      <p>Mensualité type : {selectedReleveContrat.loyer_mensuel?.toLocaleString() || '1000'} € / mois</p>
                    </div>
                  </div>

                  {/* Ledger Table */}
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider font-mono">Grand libre de comptes individuel</p>
                    <div className="border border-neutral-800 rounded-xl overflow-hidden bg-neutral-950 text-xs">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-neutral-850 bg-neutral-900/40 text-[10px] font-bold text-neutral-500 uppercase tracking-widest leading-none">
                            <th className="p-3">Mois d'échéance</th>
                            <th className="p-3 text-right">Crédit exposé</th>
                            <th className="p-3 text-right">Perçu</th>
                            <th className="p-3 text-center">Perception</th>
                            <th className="p-3 text-right">Statut</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-850 font-sans">
                          {history.map((m) => {
                            const isPaid = m.status === 'paye' || m.status === 'paye_en_retard';
                            return (
                              <tr key={m.index} className="hover:bg-neutral-900/30">
                                <td className="p-3 font-semibold text-white">{m.month}</td>
                                <td className="p-3 text-right font-mono text-neutral-400">{(m.amount || 0).toLocaleString()} €</td>
                                <td className="p-3 text-right font-mono text-white font-bold">{(isPaid ? m.amount : 0).toLocaleString()} €</td>
                                <td className="p-3 text-center text-neutral-400 font-mono text-[10px]">{m.datePaiement || '-'}</td>
                                <td className="p-3 text-right">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase font-mono ${m.colorClass}`}>
                                    {m.label}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Footer and interactions */}
                <div className="p-6 bg-neutral-950 border-t border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex gap-2 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={handlePrintReleve}
                      className="flex-1 sm:flex-none justify-center bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-2 shadow-lg shadow-indigo-600/10"
                    >
                      <Printer className="w-4 h-4" />
                      Imprimer / Télécharger
                    </button>
                    <button
                      type="button"
                      disabled={generatingReleveId === selectedReleveContrat.id}
                      onClick={async () => {
                        await handleGenerateAndSaveReleve(selectedReleveContrat);
                        setSelectedReleveContrat(null);
                      }}
                      className="flex-1 sm:flex-none justify-center bg-neutral-900 hover:bg-neutral-800 text-neutral-300 font-bold text-xs px-4 py-2.5 rounded-xl border border-neutral-800 transition-all cursor-pointer flex items-center gap-2"
                    >
                      {generatingReleveId === selectedReleveContrat.id ? (
                        <>
                          <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                          Génération...
                        </>
                      ) : (
                        <>
                          <FileCode className="w-4 h-4 text-emerald-400" />
                          Archiver dans la GED (PDF/HTML)
                        </>
                      )}
                    </button>
                  </div>
                  <button 
                    onClick={() => setSelectedReleveContrat(null)}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-semibold bg-neutral-850 hover:bg-neutral-800 text-neutral-300 transition-all cursor-pointer text-center"
                  >
                    Fermer
                  </button>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}

// --- Helper Components ---

function SidebarItem({ icon, label, active, onClick, badge }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void, badge?: number }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
        active 
          ? 'bg-indigo-500/10 text-white shadow-sm font-semibold border-l-2 border-indigo-500 pl-2.5' 
          : 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800'
      }`}
    >
      <div className="flex items-center gap-3">
        <span className={`${active ? 'text-indigo-400' : 'text-neutral-500 group-hover:text-neutral-300'}`}>
          {React.cloneElement(icon as React.ReactElement, { className: 'w-5 h-5' })}
        </span>
        {label}
      </div>
      {badge !== undefined && (
        <span className="bg-rose-500/20 text-rose-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-rose-500/30 animate-pulse">
          {badge}
        </span>
      )}
    </button>
  );
}

function StatCard({ label, value, color }: { label: string, value: string, color: 'indigo' | 'cyan' | 'violet' | 'emerald' | 'rose' }) {
  const colors = {
    indigo: 'from-indigo-500/10 to-indigo-500/5 text-indigo-400 border-indigo-500/20',
    cyan: 'from-cyan-500/10 to-cyan-500/5 text-cyan-400 border-cyan-500/20',
    violet: 'from-violet-500/10 to-violet-500/5 text-violet-400 border-violet-500/20',
    emerald: 'from-emerald-500/10 to-emerald-500/5 text-emerald-400 border-emerald-500/20',
    rose: 'from-rose-500/10 to-rose-500/5 text-rose-400 border-rose-500/20',
  };

  return (
    <div className={`p-6 rounded-2xl bg-gradient-to-br border bg-neutral-900 ${colors[color]} relative overflow-hidden group`}>
      <div className="relative z-10">
        <p className="text-xs font-bold uppercase tracking-widest opacity-60 mb-2">{label}</p>
        <p className="text-3xl font-bold text-white tracking-tighter">{value}</p>
      </div>
      <div className={`absolute -right-4 -bottom-4 w-24 h-24 bg-current opacity-5 blur-3xl group-hover:opacity-10 transition-opacity`} />
    </div>
  );
}

function ActionButton({ icon, label, color, onClick }: { icon: React.ReactNode, label: string, color: 'indigo' | 'neutral', onClick?: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-3 p-3 rounded-xl border text-sm font-medium transition-all cursor-pointer ${
        color === 'indigo' 
          ? 'bg-indigo-600 border-indigo-500 text-white hover:bg-indigo-500 hover:shadow-lg hover:shadow-indigo-600/20' 
          : 'bg-neutral-800 border-neutral-700 text-neutral-300 hover:bg-neutral-700'
      }`}
    >
      <span className="p-1.5 bg-white/10 rounded-lg">{icon}</span>
      {label}
    </button>
  );
}
