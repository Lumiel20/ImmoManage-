import React from 'react';
import { ConfirmModal } from './ConfirmModal';
import { PropertyModal } from './PropertyModal';
import { DocumentModal } from './DocumentModal';
import { TenantModal } from './TenantModal';
import { TenantDetailsModal } from './TenantDetailsModal';
import { LeaseModal } from './LeaseModal';
import { DetailPaymentHistoryModal } from './DetailPaymentHistoryModal';
import { ConfirmPaymentDialog } from './ConfirmPaymentDialog';
import { FinancialStatementDetailedViewModal } from './FinancialStatementDetailedViewModal';
import { Property, Lease, ContractDocument } from '../types';

interface ModalsContainerProps {
  // ConfirmModal
  confirmModal: {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null;
  setConfirmModal: (val: any) => void;

  // PropertyModal
  isPropertyModalOpen: boolean;
  setIsPropertyModalOpen: (val: boolean) => void;
  handleSaveProperty: (e: React.FormEvent) => void;
  editingProperty: Property | null;
  propertyTitle: string;
  setPropertyTitle: (val: string) => void;
  propertyType: string;
  setPropertyType: (val: string) => void;
  propertyPrice: number;
  setPropertyPrice: (val: number) => void;
  propertyCity: string;
  setPropertyCity: (val: string) => void;
  propertyStatus: string;
  setPropertyStatus: (val: string) => void;
  propertySurface: number;
  setPropertySurface: (val: number) => void;
  propertyRooms: number;
  setPropertyRooms: (val: number) => void;
  propertyDescription: string;
  setPropertyDescription: (val: string) => void;
  propertyErrors: Record<string, string>;
  touched: Record<string, boolean>;
  attemptedSubmitOnProperty: boolean;
  markTouched: (field: string) => void;

  // DocumentModal
  isDocModalOpen: boolean;
  setIsDocModalOpen: (val: boolean) => void;
  selectedContratForDoc: Lease | null;
  docTitre: string;
  setDocTitre: (val: string) => void;
  docType: string;
  setDocType: (val: string) => void;
  isUploading: boolean;
  uploadProgress: number;
  docError: string | null;
  contractDocuments: ContractDocument[];
  handleUploadDocument: (file: File) => void;
  handleDeleteDocument: (docId: number, storagePath: string) => void;

  // TenantModal
  isTenantModalOpen: boolean;
  setIsTenantModalOpen: (val: boolean) => void;
  handleSaveTenant: (e: React.FormEvent) => void;
  editingTenant: any | null;
  tenantFirstName: string;
  setTenantFirstName: (val: string) => void;
  tenantLastName: string;
  setTenantLastName: (val: string) => void;
  tenantEmail: string;
  setTenantEmail: (val: string) => void;
  tenantPhone: string;
  setTenantPhone: (val: string) => void;
  tenantProfession: string;
  setTenantProfession: (val: string) => void;
  tenantIncome: number;
  setTenantIncome: (val: number) => void;
  tenantIdCard: string;
  setTenantIdCard: (val: string) => void;
  tenantErrors: Record<string, string>;
  attemptedSubmitOnTenant: boolean;

  // TenantDetailsModal
  isTenantDetailsOpen: boolean;
  setIsTenantDetailsOpen: (val: boolean) => void;
  selectedTenantForDetails: any | null;
  leases: Lease[];
  currency: 'EUR' | 'USD' | 'FCFA';

  // LeaseModal
  isLeaseModalOpen: boolean;
  setIsLeaseModalOpen: (val: boolean) => void;
  handleSaveLease: (e: React.FormEvent) => void;
  editingLease: Lease | null;
  leaseType: string;
  setLeaseType: (val: string) => void;
  leaseStatus: string;
  setLeaseStatus: (val: string) => void;
  leasePropertyId: number | '';
  setLeasePropertyId: (val: number | '') => void;
  leaseTenantId: number | '';
  setLeaseTenantId: (val: number | '') => void;
  leaseStartDate: string;
  setLeaseStartDate: (val: string) => void;
  leaseEndDate: string;
  setLeaseEndDate: (val: string) => void;
  leaseMonthlyRent: number;
  setLeaseMonthlyRent: (val: number) => void;
  leaseSalePrice: number;
  setLeaseSalePrice: (val: number) => void;
  properties: Property[];
  tenants: any[];
  leaseErrors: Record<string, string>;
  attemptedSubmitOnLease: boolean;

  // DetailPaymentHistoryModal
  selectedHistoryLease: Lease | null;
  setSelectedHistoryLease: (val: Lease | null) => void;
  paymentHistory: any[];
  handleCancelPaymentConfirmation: (leaseId: number, dbPaymentId: number, monthName: string) => void;
  setPaymentToValidate: (val: any) => void;

  // ConfirmPaymentDialog
  paymentToValidate: any | null;
  setPaymentToValidateNull: () => void;
  handleSavePaymentConfirmation: (e: React.FormEvent) => void;
  confirmStatus: string;
  setConfirmStatus: (val: string) => void;
  confirmAmount: number;
  setConfirmAmount: (val: number) => void;
  confirmDate: string;
  setConfirmDate: (val: string) => void;
  confirmMode: string;
  setConfirmMode: (val: string) => void;

  // FinancialStatementDetailedViewModal
  selectedStatementLease: Lease | null;
  setSelectedStatementLease: (val: Lease | null) => void;
  releveHistory: any[];
  generateReleveHtml: (c: Lease, history: any[]) => string;
  handleGenerateAndSaveReleve: (c: Lease) => Promise<void>;
  generatingReleveId: number | null;
}

export function ModalsContainer({
  confirmModal,
  setConfirmModal,
  
  isPropertyModalOpen,
  setIsPropertyModalOpen,
  handleSaveProperty,
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
  propertyErrors,
  touched,
  attemptedSubmitOnProperty,
  markTouched,

  isDocModalOpen,
  setIsDocModalOpen,
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

  isTenantModalOpen,
  setIsTenantModalOpen,
  handleSaveTenant,
  editingTenant,
  tenantFirstName,
  setTenantFirstName,
  tenantLastName,
  setTenantLastName,
  tenantEmail,
  setTenantEmail,
  tenantPhone,
  setTenantPhone,
  tenantProfession,
  setTenantProfession,
  tenantIncome,
  setTenantIncome,
  tenantIdCard,
  setTenantIdCard,
  tenantErrors,
  attemptedSubmitOnTenant,

  isTenantDetailsOpen,
  setIsTenantDetailsOpen,
  selectedTenantForDetails,
  leases,
  currency,

  isLeaseModalOpen,
  setIsLeaseModalOpen,
  handleSaveLease,
  editingLease,
  leaseType,
  setLeaseType,
  leaseStatus,
  setLeaseStatus,
  leasePropertyId,
  setLeasePropertyId,
  leaseTenantId,
  setLeaseTenantId,
  leaseStartDate,
  setLeaseStartDate,
  leaseEndDate,
  setLeaseEndDate,
  leaseMonthlyRent,
  setLeaseMonthlyRent,
  leaseSalePrice,
  setLeaseSalePrice,
  properties,
  tenants,
  leaseErrors,
  attemptedSubmitOnLease,

  selectedHistoryLease,
  setSelectedHistoryLease,
  paymentHistory,
  handleCancelPaymentConfirmation,
  setPaymentToValidate,

  paymentToValidate,
  setPaymentToValidateNull,
  handleSavePaymentConfirmation,
  confirmStatus,
  setConfirmStatus,
  confirmAmount,
  setConfirmAmount,
  confirmDate,
  setConfirmDate,
  confirmMode,
  setConfirmMode,

  selectedStatementLease,
  setSelectedStatementLease,
  releveHistory,
  generateReleveHtml,
  handleGenerateAndSaveReleve,
  generatingReleveId
}: ModalsContainerProps) {
  return (
    <div id="reusable-modals-container">
      {/* Sleek Custom Deletion Confirmation Dialog Modal */}
      <ConfirmModal 
        isOpen={confirmModal?.isOpen ?? false}
        title={confirmModal?.title ?? ''}
        message={confirmModal?.message ?? ''}
        onConfirm={confirmModal?.onConfirm ?? (() => {})}
        onClose={() => setConfirmModal(null)}
      />

      {/* --- PROPERTY MODAL --- */}
      <PropertyModal 
        isOpen={isPropertyModalOpen}
        onClose={() => setIsPropertyModalOpen(false)}
        onSubmit={handleSaveProperty}
        editingProperty={editingProperty}
        propertyTitle={propertyTitle}
        setPropertyTitle={setPropertyTitle}
        propertyType={propertyType}
        setPropertyType={setPropertyType}
        propertyPrice={propertyPrice}
        setPropertyPrice={setPropertyPrice}
        propertyCity={propertyCity}
        setPropertyCity={setPropertyCity}
        propertyStatus={propertyStatus}
        setPropertyStatus={setPropertyStatus}
        propertySurface={propertySurface}
        setPropertySurface={setPropertySurface}
        propertyRooms={propertyRooms}
        setPropertyRooms={setPropertyRooms}
        propertyDescription={propertyDescription}
        setPropertyDescription={setPropertyDescription}
        errors={propertyErrors}
        touched={touched}
        attemptedSubmitOnProperty={attemptedSubmitOnProperty}
        markTouched={markTouched}
      />

      {/* --- DOCUMENT & TENANT MODALS --- */}
      <DocumentModal 
        isOpen={isDocModalOpen}
        onClose={() => setIsDocModalOpen(false)}
        selectedContratForDoc={selectedContratForDoc}
        docTitre={docTitre}
        setDocTitre={setDocTitre}
        docType={docType}
        setDocType={setDocType}
        isUploading={isUploading}
        uploadProgress={uploadProgress}
        docError={docError}
        contractDocuments={contractDocuments}
        handleUploadDocument={handleUploadDocument}
        handleDeleteDocument={handleDeleteDocument}
      />

      <TenantModal 
        isOpen={isTenantModalOpen}
        onClose={() => setIsTenantModalOpen(false)}
        onSubmit={handleSaveTenant}
        editingTenant={editingTenant}
        tenantFirstName={tenantFirstName}
        setTenantFirstName={setTenantFirstName}
        tenantLastName={tenantLastName}
        setTenantLastName={setTenantLastName}
        tenantEmail={tenantEmail}
        setTenantEmail={setTenantEmail}
        tenantPhone={tenantPhone}
        setTenantPhone={setTenantPhone}
        tenantProfession={tenantProfession}
        setTenantProfession={setTenantProfession}
        tenantIncome={tenantIncome}
        setTenantIncome={setTenantIncome}
        tenantIdCard={tenantIdCard}
        setTenantIdCard={setTenantIdCard}
        errors={tenantErrors}
        touched={touched}
        attemptedSubmitOnTenant={attemptedSubmitOnTenant}
        markTouched={markTouched}
      />

      {/* --- TENANT DETAILS MODAL --- */}
      <TenantDetailsModal 
        isOpen={isTenantDetailsOpen && selectedTenantForDetails !== null}
        onClose={() => setIsTenantDetailsOpen(false)}
        selectedTenantForDetails={selectedTenantForDetails}
        leases={leases}
        currency={currency}
      />

      {/* --- LEASE MODAL --- */}
      <LeaseModal 
        isOpen={isLeaseModalOpen}
        onClose={() => setIsLeaseModalOpen(false)}
        onSubmit={handleSaveLease}
        editingLease={editingLease}
        leaseType={leaseType}
        setLeaseType={setLeaseType}
        leaseStatus={leaseStatus}
        setLeaseStatus={setLeaseStatus}
        leasePropertyId={leasePropertyId}
        setLeasePropertyId={setLeasePropertyId}
        leaseTenantId={leaseTenantId}
        setLeaseTenantId={setLeaseTenantId}
        leaseStartDate={leaseStartDate}
        setLeaseStartDate={setLeaseStartDate}
        leaseEndDate={leaseEndDate}
        setLeaseEndDate={setLeaseEndDate}
        leaseMonthlyRent={leaseMonthlyRent}
        setLeaseMonthlyRent={setLeaseMonthlyRent}
        leaseSalePrice={leaseSalePrice}
        setLeaseSalePrice={setLeaseSalePrice}
        properties={properties}
        tenants={tenants}
        errors={leaseErrors}
        touched={touched}
        attemptedSubmitOnLease={attemptedSubmitOnLease}
        markTouched={markTouched}
        currency={currency}
      />

      {/* --- DETAIL PAYMENT HISTORY MODAL --- */}
      <DetailPaymentHistoryModal 
        selectedHistoryContrat={selectedHistoryLease}
        history={paymentHistory}
        onClose={() => setSelectedHistoryLease(null)}
        currency={currency}
        handleCancelPaymentConfirmation={handleCancelPaymentConfirmation}
        onValidatePaymentClick={(monthName, monthIndex) => {
          if (selectedHistoryLease) {
            setPaymentToValidate({
              lease: selectedHistoryLease,
              monthIndex,
              monthName,
              amount: selectedHistoryLease.loyer_mensuel || 1000
            });
            setConfirmAmount(selectedHistoryLease.loyer_mensuel || 1000);
            setConfirmDate(new Date().toLocaleDateString('fr-FR'));
            setConfirmMode('virement');
            setConfirmStatus('paye');
          }
        }}
      />

      {/* --- CONFIRM PAYMENT DIALOG MODAL --- */}
      <ConfirmPaymentDialog 
        paymentToValidate={paymentToValidate}
        onClose={setPaymentToValidateNull}
        onSubmit={handleSavePaymentConfirmation}
        confirmStatus={confirmStatus}
        setConfirmStatus={setConfirmStatus}
        confirmAmount={confirmAmount}
        setConfirmAmount={setConfirmAmount}
        confirmDate={confirmDate}
        setConfirmDate={setConfirmDate}
        confirmMode={confirmMode}
        setConfirmMode={setConfirmMode}
      />

      {/* --- FINANCIAL STATEMENT DETAILED VIEW MODAL --- */}
      <FinancialStatementDetailedViewModal 
        selectedReleveContrat={selectedStatementLease}
        history={releveHistory}
        onClose={() => setSelectedStatementLease(null)}
        currency={currency}
        onPrint={() => {
          if (selectedStatementLease) {
            const html = generateReleveHtml(selectedStatementLease, releveHistory);
            const win = window.open("", "_blank");
            if (win) {
              win.document.write(html);
              win.document.close();
              win.print();
            } else {
              alert("The print layout was blocked by popups. Please allow popups to print.");
            }
          }
        }}
        onArchive={async () => {
          if (selectedStatementLease) {
            await handleGenerateAndSaveReleve(selectedStatementLease);
            setSelectedStatementLease(null);
          }
        }}
        generatingReleveId={generatingReleveId}
      />
    </div>
  );
}
