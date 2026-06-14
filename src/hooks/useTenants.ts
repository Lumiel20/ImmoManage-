import React, { useState } from 'react';
import { safeFetchJson } from './usePropertyApp';

interface UseTenantsParams {
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

export function useTenants({ token, addActionLog, setToastMsg, setConfirmModal }: UseTenantsParams) {
  const [tenants, setTenants] = useState<any[]>([]);
  const [isTenantModalOpen, setIsTenantModalOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<any | null>(null);

  // Tenant Details Modal info
  const [selectedTenantForDetails, setSelectedTenantForDetails] = useState<any | null>(null);
  const [isTenantDetailsOpen, setIsTenantDetailsOpen] = useState(false);

  // Form Fields
  const [tenantFirstName, setTenantFirstName] = useState('');
  const [tenantLastName, setTenantLastName] = useState('');
  const [tenantEmail, setTenantEmail] = useState('');
  const [tenantPhone, setTenantPhone] = useState('');
  const [tenantProfession, setTenantProfession] = useState('');
  const [tenantIncome, setTenantIncome] = useState(0);
  const [tenantIdCard, setTenantIdCard] = useState('');

  // Validation state
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

  const markTouched = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const getTenantErrors = () => {
    const errors: Record<string, string> = {};
    if (!tenantFirstName || tenantFirstName.trim().length < 2) {
      errors.firstName = 'First name must be at least 2 characters.';
    }
    if (!tenantLastName || tenantLastName.trim().length < 2) {
      errors.lastName = 'Last name must be at least 2 characters.';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!tenantEmail || !emailRegex.test(tenantEmail)) {
      errors.email = "Invalid email format.";
    }
    if (tenantPhone) {
      const phoneRegex = /^[+0-9\s.-]{10,20}$/;
      if (!phoneRegex.test(tenantPhone)) {
        errors.phone = 'Invalid phone number (minimum 10 digits/characters).';
      }
    }
    if (!tenantProfession || tenantProfession.trim().length < 2) {
      errors.profession = 'Profession must be at least 2 characters.';
    }
    if (tenantIncome < 0) {
      errors.income = 'Monthly income cannot be negative.';
    }
    if (tenantIdCard) {
      const cniRegex = /^[a-zA-Z0-9]{5,20}$/;
      if (!cniRegex.test(tenantIdCard)) {
        errors.idCard = 'ID card number must be 5 to 20 alphanumeric characters.';
      }
    }
    return errors;
  };

  const fetchTenants = async () => {
    if (!token) return;
    try {
      const json = await safeFetchJson('/api/v1/locataires', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (json.success) setTenants(json.data);
    } catch (err: any) {
      if (err?.message !== 'Invalid token' && err?.message !== 'Unauthorized') {
        console.error("Error fetching tenants:", err);
      }
    }
  };

  const openNewTenant = () => {
    setTouched({});
    setAttemptedSubmit(false);
    setEditingTenant(null);
    setTenantFirstName('');
    setTenantLastName('');
    setTenantEmail('');
    setTenantPhone('');
    setTenantProfession('Cadre');
    setTenantIncome(3200);
    setTenantIdCard('ABC123456');
    setIsTenantModalOpen(true);
  };

  const openEditTenant = (tenant: any) => {
    setTouched({});
    setAttemptedSubmit(false);
    setEditingTenant(tenant);
    setTenantFirstName(tenant.first_name || '');
    setTenantLastName(tenant.last_name || '');
    setTenantEmail(tenant.email || '');
    setTenantPhone(tenant.phone || '');
    setTenantProfession(tenant.profession || '');
    setTenantIncome(tenant.revenu_mensuel || 0);
    setTenantIdCard(tenant.cni_numero || '');
    setIsTenantModalOpen(true);
  };

  const handleSaveTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setAttemptedSubmit(true);
    const errors = getTenantErrors();
    if (Object.keys(errors).length > 0) {
      return;
    }

    const payload = {
      first_name: tenantFirstName,
      last_name: tenantLastName,
      email: tenantEmail,
      phone: tenantPhone,
      profession: tenantProfession,
      revenu_mensuel: Number(tenantIncome),
      cni_numero: tenantIdCard
    };

    try {
      const url = editingTenant ? `/api/v1/locataires/${editingTenant.id}` : '/api/v1/locataires';
      const method = editingTenant ? 'PUT' : 'POST';

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
          editingTenant ? 'edition' : 'creation',
          'locataire',
          editingTenant ? 'Customer card updated' : 'Customer profile saved',
          editingTenant ? `Customer data of ${tenantFirstName} ${tenantLastName} modified.` : `Customer ${tenantFirstName} ${tenantLastName} (${tenantProfession}) was successfully added.`
        );
        setIsTenantModalOpen(false);
        fetchTenants();
      } else {
        alert(json.error?.message || "An error occurred.");
      }
    } catch (err) {
      console.error(err);
      alert("Network error");
    }
  };

  const handleDeleteTenant = (id: number) => {
    if (!token) return;
    const targetTenant = tenants.find(t => t.id === id);
    if (!targetTenant) return;

    setConfirmModal({
      isOpen: true,
      title: "Delete tenant card",
      message: `Are you sure you want to delete the tenant "${targetTenant.first_name || ''} ${targetTenant.last_name || ''}"? This action is permanent.`,
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
            addActionLog('suppression', 'locataire', 'Customer profile deleted', `The customer "${targetTenant.first_name || ''} ${targetTenant.last_name || ''}" has been removed.`);
            setToastMsg(`Customer "${targetTenant.first_name || ''} ${targetTenant.last_name || ''}" deleted successfully!`);
            fetchTenants();
          } else {
            setToastMsg(json.error?.message || "An error occurred.");
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

  const tenantErrors = getTenantErrors();

  return {
    tenants, setTenants,
    isTenantModalOpen, setIsTenantModalOpen,
    editingTenant, setEditingTenant,
    selectedTenantForDetails, setSelectedTenantForDetails,
    isTenantDetailsOpen, setIsTenantDetailsOpen,
    
    // Form fields
    tenantFirstName, setTenantFirstName,
    tenantLastName, setTenantLastName,
    tenantEmail, setTenantEmail,
    tenantPhone, setTenantPhone,
    tenantProfession, setTenantProfession,
    tenantIncome, setTenantIncome,
    tenantIdCard, setTenantIdCard,
    
    // Validation
    tenantErrors,
    tenantTouched: touched,
    tenantAttemptedSubmit: attemptedSubmit,
    markTenantTouched: markTouched,
    
    // Methods
    fetchTenants,
    openNewTenant,
    openEditTenant,
    handleSaveTenant,
    handleDeleteTenant
  };
}
