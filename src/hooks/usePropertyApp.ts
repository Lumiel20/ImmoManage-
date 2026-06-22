import React, { useState, useEffect, useMemo } from 'react';
import { User, Property, Lease, ActionLog } from '../types';
import { formatPrice as formatPriceUtil } from '../utils/format';

// Import our custom sub-hooks
import { useAuth } from './useAuth';
import { useActionLogs } from './useActionLogs';
import { useProperties } from './useProperties';
import { useTenants } from './useTenants';
import { useLeases } from './useLeases';
import { useLeaseTerm } from './useLeaseTerm';
import { useDocs } from './useDocs';
import { usePayments } from './usePayments';

// --- Robust Safe Fetch JSON Helper ---
export const safeFetchJson = async (url: string, options?: RequestInit) => {
  const res = await fetch(url, options);
  if (!res.ok) {
    let errMsg = `Server error (code ${res.status})`;
    try {
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const jsonErr = await res.json();
        if (jsonErr && jsonErr.error && jsonErr.error.message) {
          errMsg = jsonErr.error.message;
        }
      }
    } catch {
      // ignore
    }
    
    if (res.status === 401 || errMsg === 'Invalid token' || errMsg === 'Unauthorized') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.dispatchEvent(new Event('auth-unauthorized'));
    }
    
    throw new Error(errMsg);
  }
  const contentType = res.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    throw new Error("The server returned an invalid response (not JSON). Please try again.");
  }
  return res.json();
};

export function usePropertyApp() {
  // 1. Core General states
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currency, setCurrency] = useState<'EUR' | 'USD' | 'FCFA'>(() => {
    return (localStorage.getItem('property_currency') as 'EUR' | 'USD' | 'FCFA') || 'EUR';
  });
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('property_theme') as 'dark' | 'light') || 'dark';
  });
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [appLoading, setAppLoading] = useState(true);
  const [loading, setLoading] = useState(false);

  // Confirmation modal
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  // Filter and log search fields
  const [historyFilter, setHistoryFilter] = useState('all');
  const [historyStartDate, setHistoryStartDate] = useState('');
  const [historyEndDate, setHistoryEndDate] = useState('');

  // Fallback structural form tracking
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [attemptedSubmit, setAttemptedSubmit] = useState<Record<string, boolean>>({});

  const markTouched = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('property_theme', theme);
  }, [theme]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAppLoading(false);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (toastMsg) {
      const timer = setTimeout(() => setToastMsg(null), 5050);
      return () => clearTimeout(timer);
    }
  }, [toastMsg]);

  // Contextual helper
  const formatPrice = (amount: number | null | undefined, rawOnlySymbol = false) => {
    return formatPriceUtil(amount, currency, rawOnlySymbol);
  };

  // --- Sub-hooks Composition ---

  // A. Logs
  const { actionLogs, setActionLogs, addActionLog } = useActionLogs();

  // B. Authentication
  const {
    user, setUser,
    token, setToken,
    email, setEmail,
    password, setPassword,
    authMode, setAuthMode,
    firstName, setFirstName,
    lastName, setLastName,
    authError, setAuthError,
    useLocalAuth, setUseLocalAuth,
    syncWithBackend,
    handleLogin,
    handleRegister,
    handleGoogleSignIn,
    handleLogout
  } = useAuth();

  // C. Properties
  const {
    properties, setProperties,
    loadingProperties, setLoadingProperties,
    isPropertyModalOpen, setIsPropertyModalOpen,
    editingProperty, setEditingProperty,
    propertyTitle, setPropertyTitle,
    propertyDescription, setPropertyDescription,
    propertyType, setPropertyType,
    propertyPrice, setPropertyPrice,
    propertyCity, setPropertyCity,
    propertySurface, setPropertySurface,
    propertyRooms, setPropertyRooms,
    propertyStatus, setPropertyStatus,
    searchTerm, setSearchTerm,
    filterType, setFilterType,
    filteredProperties,
    propertyErrors,
    fetchProperties,
    openNewProperty,
    openEditProperty,
    handleSaveProperty,
    handleDeleteProperty
  } = useProperties({
    token,
    addActionLog,
    setToastMsg,
    setConfirmModal
  });

  // D. Tenants
  const {
    tenants, setTenants,
    isTenantModalOpen, setIsTenantModalOpen,
    editingTenant, setEditingTenant,
    selectedTenantForDetails, setSelectedTenantForDetails,
    isTenantDetailsOpen, setIsTenantDetailsOpen,
    tenantFirstName, setTenantFirstName,
    tenantLastName, setTenantLastName,
    tenantEmail, setTenantEmail,
    tenantPhone, setTenantPhone,
    tenantProfession, setTenantProfession,
    tenantIncome, setTenantIncome,
    tenantIdCard, setTenantIdCard,
    tenantErrors,
    fetchTenants,
    openNewTenant,
    openEditTenant,
    handleSaveTenant,
    handleDeleteTenant
  } = useTenants({
    token,
    addActionLog,
    setToastMsg,
    setConfirmModal
  });

  // E. Leases
  const {
    leases, setLeases,
    loadingLeases, setLoadingLeases,
    isLeaseModalOpen, setIsLeaseModalOpen,
    editingLease, setEditingLease,
    leaseType, setLeaseType,
    leasePropertyId, setLeasePropertyId,
    leaseTenantId, setLeaseTenantId,
    leaseStartDate, setLeaseStartDate,
    leaseEndDate, setLeaseEndDate,
    leaseMonthlyRent, setLeaseMonthlyRent,
    leaseSalePrice, setLeaseSalePrice,
    leaseStatus, setLeaseStatus,
    leaseErrors,
    fetchLeases,
    openNewLease,
    openEditLease,
    handleSaveLease,
    handleDeleteLease,
    handlePrintLease
  } = useLeases({
    token,
    properties,
    tenants,
    addActionLog,
    setToastMsg,
    setConfirmModal,
    formatPrice
  });

  // E2. Lease Term/Expiration Logic Hook (SPLIT HOOK!)
  const {
    notifiedLeases, setNotifiedLeases,
    expiringLeases,
    sendExpiryNotification
  } = useLeaseTerm({
    leases,
    addActionLog,
    setToastMsg
  });

  // F. Documents Storage / GED
  const {
    isDocModalOpen, setIsDocModalOpen,
    selectedContratForDoc, setSelectedContratForDoc,
    contractDocuments, setContractDocuments,
    docTitre, setDocTitre,
    docType, setDocType,
    isUploading, setIsUploading,
    uploadProgress, setUploadProgress,
    docError, setDocError,
    fetchDocuments,
    openDocModal,
    handleUploadDocument,
    handleDeleteDocument
  } = useDocs({
    token,
    addActionLog,
    setToastMsg,
    setConfirmModal
  });

  // G. Payments & Accounting
  const {
    allValidatedPayments, setAllValidatedPayments,
    paymentsSubTab, setPaymentsSubTab,
    selectedStatementLease, setSelectedStatementLease,
    generatingReleveId, setGeneratingReleveId,
    selectedHistoryLease, setSelectedHistoryLease,
    paymentToValidate, setPaymentToValidate,
    confirmAmount, setConfirmAmount,
    confirmDate, setConfirmDate,
    confirmMode, setConfirmMode,
    confirmStatus, setConfirmStatus,
    activePropertiesCount,
    activeContractsCount,
    monthlyRentRevenue,
    vacantPropertiesCount,
    vacancyRate,
    lateContractsCount,
    totalPaidRent,
    totalLateRent,
    complianceRate,
    last6MonthsData,
    fetchAllValidatedPayments,
    getLeasePaymentStatus,
    getLeasePaymentHistory,
    handleSavePaymentConfirmation,
    handleCancelPaymentConfirmation,
    handleGenerateAndSaveReleve,
    generateReleveHtml
  } = usePayments({
    token,
    user,
    leases,
    properties,
    addActionLog,
    setToastMsg,
    setConfirmModal,
    formatPrice,
    fetchDocuments
  });

  // --- Synchronization Trigger Effect ---
  useEffect(() => {
    if (token) {
      if (user && user.role === 'locataire') {
        const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
        syncWithBackend(user.email, fullName);
      } else {
        fetchProperties();
        fetchLeases();
        fetchTenants();
        fetchAllValidatedPayments();
      }
    }
  }, [token, user?.role]);

  // --- Actions Log History Calculations ---
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

  const filteredLogs = useMemo(() => {
    return actionLogs.filter(log => {
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
        return false;
      }
      
      return true;
    });
  }, [actionLogs, historyFilter, historyStartDate, historyEndDate]);

  // --- Exposed States and Methods Mapping ---
  return {
    user, setUser,
    token, setToken,
    activeTab, setActiveTab,
    currency, setCurrency,
    theme, setTheme,
    properties, setProperties,
    leases, setLeases,
    tenants, setTenants,
    loading, setLoading,
    loadingProperties, setLoadingProperties,
    loadingLeases, setLoadingLeases,
    appLoading, setAppLoading,
    email, setEmail,
    password, setPassword,
    authMode, setAuthMode,
    firstName, setFirstName,
    lastName, setLastName,
    authError, setAuthError,
    searchTerm, setSearchTerm,
    filterType, setFilterType,
    historyFilter, setHistoryFilter,
    historyStartDate, setHistoryStartDate,
    historyEndDate, setHistoryEndDate,
    notifiedLeases, setNotifiedLeases,
    toastMsg, setToastMsg,
    
    // Modals
    isPropertyModalOpen, setIsPropertyModalOpen,
    isTenantModalOpen, setIsTenantModalOpen,
    isLeaseModalOpen, setIsLeaseModalOpen,
    isDocModalOpen, setIsDocModalOpen,
    selectedContratForDoc, setSelectedContratForDoc,
    contractDocuments, setContractDocuments,
    docTitre, setDocTitre,
    docType, setDocType,
    isUploading, setIsUploading,
    uploadProgress, setUploadProgress,
    docError, setDocError,
    selectedHistoryLease, setSelectedHistoryLease,
    selectedTenantForDetails, setSelectedTenantForDetails,
    isTenantDetailsOpen, setIsTenantDetailsOpen,
    paymentsSubTab, setPaymentsSubTab,
    selectedStatementLease, setSelectedStatementLease,
    generatingReleveId, setGeneratingReleveId,
    confirmModal, setConfirmModal,
    
    // Payment confirmation
    allValidatedPayments, setAllValidatedPayments,
    paymentToValidate, setPaymentToValidate,
    confirmAmount, setConfirmAmount,
    confirmDate, setConfirmDate,
    confirmMode, setConfirmMode,
    confirmStatus, setConfirmStatus,
    actionLogs, setActionLogs,
    
    // Form fields
    editingProperty, setEditingProperty,
    propertyTitle, setPropertyTitle,
    propertyDescription, setPropertyDescription,
    propertyType, setPropertyType,
    propertyPrice, setPropertyPrice,
    propertyCity, setPropertyCity,
    propertySurface, setPropertySurface,
    propertyRooms, setPropertyRooms,
    propertyStatus, setPropertyStatus,
    
    editingTenant, setEditingTenant,
    tenantFirstName, setTenantFirstName,
    tenantLastName, setTenantLastName,
    tenantEmail, setTenantEmail,
    tenantPhone, setTenantPhone,
    tenantProfession, setTenantProfession,
    tenantIncome, setTenantIncome,
    tenantIdCard, setTenantIdCard,
    
    editingLease, setEditingLease,
    leaseType, setLeaseType,
    leasePropertyId, setLeasePropertyId,
    leaseTenantId, setLeaseTenantId,
    leaseStartDate, setLeaseStartDate,
    leaseEndDate, setLeaseEndDate,
    leaseMonthlyRent, setLeaseMonthlyRent,
    leaseSalePrice, setLeaseSalePrice,
    leaseStatus, setLeaseStatus,
    
    touched, setTouched,
    attemptedSubmit, setAttemptedSubmit,
    markTouched,
    
    // Helper handlers, logs, computed stats
    addActionLog,
    filteredProperties,
    filteredLogs,
    expiringLeases,
    sendExpiryNotification,
    activePropertiesCount,
    activeContractsCount,
    monthlyRentRevenue,
    vacancyRate,
    lateContractsCount,
    complianceRate,
    totalPaidRent,
    totalLateRent,
    last6MonthsData,
    
    getLeasePaymentStatus,
    getLeasePaymentHistory,
    
    // API Actions
    fetchProperties,
    fetchLeases,
    fetchTenants,
    fetchAllValidatedPayments,
    openNewProperty,
    openEditProperty,
    openNewTenant,
    openEditTenant,
    openNewLease,
    openEditLease,
    
    handleSaveProperty,
    handleDeleteProperty,
    handleSaveTenant,
    handleDeleteTenant,
    handleSaveLease,
    handleDeleteLease,
    handlePrintLease,
    handleGenerateAndSaveReleve,
    handleSavePaymentConfirmation,
    handleCancelPaymentConfirmation,
    openDocModal,
    fetchDocuments,
    handleUploadDocument,
    handleDeleteDocument,
    syncWithBackend,
    handleLogin,
    handleRegister,
    handleGoogleSignIn,
    handleLogout,
    useLocalAuth,
    setUseLocalAuth,
    
    // Errors
    propertyErrors,
    tenantErrors,
    leaseErrors,
    formatPrice,
    generateReleveHtml
  };
}
